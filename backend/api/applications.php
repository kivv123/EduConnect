<?php
/**
 * EduConnect - Applications REST API
 * 
 * Supported Methods:
 * - GET    /backend/api/applications.php?student_id=1   -> Student's submitted applications
 * - GET    /backend/api/applications.php?provider_id=2  -> Provider's incoming candidate pool
 * - GET    /backend/api/applications.php?id=1           -> Single application details
 * - POST   /backend/api/applications.php                -> Submit new application
 * - PATCH  /backend/api/applications.php?id=1           -> Update status (under_review/accepted/rejected)
 * - DELETE /backend/api/applications.php?id=1          -> Withdraw application
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle action/method overrides
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

// ---------------------------------------------------------------------
// 1. GET: Retrieve Applications
// ---------------------------------------------------------------------
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    $providerId = isset($_GET['provider_id']) ? (int)$_GET['provider_id'] : 0;
    $opportunityId = isset($_GET['opportunity_id']) ? (int)$_GET['opportunity_id'] : 0;

    // Single Application
    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT a.*, o.title as opportunity_title, o.mode, o.deadline, o.type as opportunity_type, o.provider_name
            FROM `applications` a
            JOIN `opportunities` o ON a.opportunity_id = o.id
            WHERE a.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $app = $stmt->fetch();

        if (!$app) {
            jsonError('Application not found.', 404);
        }

        jsonResponse($app);
    }

    // Filter by Student (Learner view)
    if ($studentId > 0) {
        $stmt = $pdo->prepare("
            SELECT a.*, o.title as opportunity_title, o.mode, o.deadline, o.type as opportunity_type, o.provider_name, o.stipend_or_fee
            FROM `applications` a
            JOIN `opportunities` o ON a.opportunity_id = o.id
            WHERE a.student_id = ?
            ORDER BY a.applied_at DESC
        ");
        $stmt->execute([$studentId]);
        jsonResponse($stmt->fetchAll());
    }

    // Filter by Provider (Institution view)
    if ($providerId > 0) {
        $stmt = $pdo->prepare("
            SELECT a.*, o.title as opportunity_title, o.type as opportunity_type, u.avatar as student_avatar, u.phone as student_phone
            FROM `applications` a
            JOIN `opportunities` o ON a.opportunity_id = o.id
            JOIN `users` u ON a.student_id = u.id
            WHERE o.provider_id = ?
            ORDER BY a.applied_at DESC
        ");
        $stmt->execute([$providerId]);
        jsonResponse($stmt->fetchAll());
    }

    // Filter by Opportunity
    if ($opportunityId > 0) {
        $stmt = $pdo->prepare("
            SELECT a.*, u.avatar as student_avatar
            FROM `applications` a
            JOIN `users` u ON a.student_id = u.id
            WHERE a.opportunity_id = ?
            ORDER BY a.applied_at DESC
        ");
        $stmt->execute([$opportunityId]);
        jsonResponse($stmt->fetchAll());
    }

    // Admin / All Applications
    $stmt = $pdo->query("
        SELECT a.*, o.title as opportunity_title
        FROM `applications` a
        JOIN `opportunities` o ON a.opportunity_id = o.id
        ORDER BY a.applied_at DESC
    ");
    jsonResponse($stmt->fetchAll());
}

// ---------------------------------------------------------------------
// 2. POST: Submit Application
// ---------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    // Support action=status sent as POST
    if (isset($_GET['action']) && $_GET['action'] === 'status') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($input['id']) ? (int)$input['id'] : 0);
        $newStatus = isset($input['status']) ? trim($input['status']) : '';

        $allowed = ['pending', 'under_review', 'accepted', 'rejected'];
        if (!in_array($newStatus, $allowed)) {
            jsonError('Invalid status value.', 422);
        }

        $stmt = $pdo->prepare("UPDATE `applications` SET `status` = ? WHERE `id` = ?");
        $stmt->execute([$newStatus, $id]);

        $getStmt = $pdo->prepare("SELECT * FROM `applications` WHERE `id` = ?");
        $getStmt->execute([$id]);
        $updated = $getStmt->fetch();

        jsonResponse($updated, 'Application status updated.');
    }

    $opportunity_id = isset($input['opportunity_id']) ? (int)$input['opportunity_id'] : 0;
    $student_id = isset($input['student_id']) ? (int)$input['student_id'] : 0;
    $student_name = isset($input['student_name']) ? trim($input['student_name']) : '';
    $student_email = isset($input['student_email']) ? trim($input['student_email']) : '';
    $resume_link = isset($input['resume_link']) ? trim($input['resume_link']) : '';
    $statement = isset($input['statement']) ? trim($input['statement']) : '';

    if ($opportunity_id <= 0 || $student_id <= 0 || empty($statement)) {
        jsonError('Opportunity, student profile, and statement of interest are required.', 422);
    }

    // Check for duplicate application
    $dupCheck = $pdo->prepare("
        SELECT `id` FROM `applications`
        WHERE `opportunity_id` = ? AND `student_id` = ?
        LIMIT 1
    ");
    $dupCheck->execute([$opportunity_id, $student_id]);
    if ($dupCheck->fetch()) {
        jsonError('You have already applied for this opportunity.', 409);
    }

    // Check if user details need filling
    if (empty($student_name) || empty($student_email)) {
        $uStmt = $pdo->prepare("SELECT `name`, `email` FROM `users` WHERE `id` = ?");
        $uStmt->execute([$student_id]);
        $userRow = $uStmt->fetch();
        if ($userRow) {
            $student_name = $student_name ?: $userRow['name'];
            $student_email = $student_email ?: $userRow['email'];
        }
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO `applications` (
            `opportunity_id`, `student_id`, `student_name`, `student_email`,
            `resume_link`, `statement`, `status`, `applied_at`
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");

    try {
        $insertStmt->execute([
            $opportunity_id, $student_id, $student_name, $student_email,
            $resume_link, $statement
        ]);

        $newId = (int)$pdo->lastInsertId();

        $fetchStmt = $pdo->prepare("
            SELECT a.*, o.title as opportunity_title
            FROM `applications` a
            JOIN `opportunities` o ON a.opportunity_id = o.id
            WHERE a.id = ?
        ");
        $fetchStmt->execute([$newId]);
        $newApp = $fetchStmt->fetch();

        jsonResponse($newApp, 'Application submitted successfully.', 201);
    } catch (PDOException $e) {
        jsonError('Failed to submit application: ' . $e->getMessage(), 500);
    }
}

// ---------------------------------------------------------------------
// 3. PATCH: Update Status (under_review, accepted, rejected)
// ---------------------------------------------------------------------
if ($method === 'PATCH') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $input = getJsonInput();

    if ($id <= 0 && isset($input['id'])) {
        $id = (int)$input['id'];
    }

    $newStatus = isset($input['status']) ? trim($input['status']) : '';
    $allowed = ['pending', 'under_review', 'accepted', 'rejected'];

    if (!in_array($newStatus, $allowed)) {
        jsonError('Invalid status value. Allowed: ' . implode(', ', $allowed), 422);
    }

    $stmt = $pdo->prepare("UPDATE `applications` SET `status` = ? WHERE `id` = ?");
    $stmt->execute([$newStatus, $id]);

    if ($stmt->rowCount() === 0) {
        // May already be this status or not found
    }

    $getStmt = $pdo->prepare("SELECT * FROM `applications` WHERE `id` = ?");
    $getStmt->execute([$id]);
    $updated = $getStmt->fetch();

    if (!$updated) {
        jsonError('Application not found.', 404);
    }

    jsonResponse($updated, 'Application status updated.');
}

// ---------------------------------------------------------------------
// 4. DELETE: Withdraw Application
// ---------------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        $input = getJsonInput();
        $id = isset($input['id']) ? (int)$input['id'] : 0;
    }

    if ($id <= 0) {
        jsonError('Application ID is required.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM `applications` WHERE `id` = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Application not found or already withdrawn.', 404);
    }

    jsonResponse(null, 'Application withdrawn successfully.');
}

jsonError('Method not supported.', 405);
