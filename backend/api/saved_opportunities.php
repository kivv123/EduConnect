<?php
/**
 * EduConnect - Saved Opportunities / Bookmarks REST API
 * 
 * Supported Methods:
 * - GET  /backend/api/saved_opportunities.php?student_id=1                  -> All opportunities saved by student
 * - GET  /backend/api/saved_opportunities.php?student_id=1&opportunity_id=2 -> Check if opportunity is saved
 * - POST /backend/api/saved_opportunities.php                               -> Toggle bookmark state
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------------
// 1. GET: Check status or List Saved Opportunities
// ---------------------------------------------------------------------
if ($method === 'GET') {
    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    $opportunityId = isset($_GET['opportunity_id']) ? (int)$_GET['opportunity_id'] : 0;

    if ($studentId <= 0) {
        jsonError('Student ID is required.', 400);
    }

    // Check single bookmark
    if ($opportunityId > 0) {
        $stmt = $pdo->prepare("
            SELECT `id` FROM `saved_opportunities`
            WHERE `student_id` = ? AND `opportunity_id` = ?
            LIMIT 1
        ");
        $stmt->execute([$studentId, $opportunityId]);
        $exists = (bool)$stmt->fetch();
        jsonResponse(['isSaved' => $exists]);
    }

    // List all saved opportunities for this student
    $stmt = $pdo->prepare("
        SELECT o.*, c.name as category_name, s.saved_at
        FROM `saved_opportunities` s
        JOIN `opportunities` o ON s.opportunity_id = o.id
        LEFT JOIN `categories` c ON o.category_id = c.id
        WHERE s.student_id = ?
        ORDER BY s.saved_at DESC
    ");
    $stmt->execute([$studentId]);
    jsonResponse($stmt->fetchAll());
}

// ---------------------------------------------------------------------
// 2. POST: Toggle Bookmark (Save / Unsave)
// ---------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $studentId = isset($input['student_id']) ? (int)$input['student_id'] : 0;
    $opportunityId = isset($input['opportunity_id']) ? (int)$input['opportunity_id'] : 0;

    if ($studentId <= 0 || $opportunityId <= 0) {
        jsonError('Student ID and Opportunity ID are required.', 422);
    }

    // Check if already saved
    $checkStmt = $pdo->prepare("
        SELECT `id` FROM `saved_opportunities`
        WHERE `student_id` = ? AND `opportunity_id` = ?
        LIMIT 1
    ");
    $checkStmt->execute([$studentId, $opportunityId]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Remove bookmark
        $delStmt = $pdo->prepare("DELETE FROM `saved_opportunities` WHERE `id` = ?");
        $delStmt->execute([$existing['id']]);
        jsonResponse(['isSaved' => false], 'Removed from saved opportunities.');
    } else {
        // Add bookmark
        $insStmt = $pdo->prepare("
            INSERT INTO `saved_opportunities` (`student_id`, `opportunity_id`, `saved_at`)
            VALUES (?, ?, NOW())
        ");
        $insStmt->execute([$studentId, $opportunityId]);
        jsonResponse(['isSaved' => true], 'Saved to your bookmarks.');
    }
}

jsonError('Method not supported.', 405);
