<?php
// backend/api/providers/applications.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'provider') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized provider access.']);
    exit();
}

$pStmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = :uid LIMIT 1");
$pStmt->execute(['uid' => $authUser['id']]);
$provider = $pStmt->fetch();
if (!$provider) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider not found.']);
    exit();
}
$providerId = $provider['id'];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT 
            a.id, a.application_type, a.status, a.cover_message, a.submitted_at, a.updated_at,
            o.id AS opportunity_id, o.title AS opportunity_title,
            lp.id AS learner_profile_id, lp.headline, lp.bio, lp.country AS learner_country, lp.city AS learner_city,
            u.id AS user_id, u.name AS learner_name, u.email AS learner_email, u.phone AS learner_phone
        FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        JOIN learner_profiles lp ON a.learner_id = lp.id
        JOIN users u ON lp.user_id = u.id
        WHERE a.provider_id = :pid
        ORDER BY a.submitted_at DESC
    ");
    $stmt->execute(['pid' => $providerId]);
    $applications = $stmt->fetchAll();

    // If specific application ID requested, attach full portfolio
    if (isset($_GET['id'])) {
        $appId = (int)$_GET['id'];
        $singleApp = null;
        foreach ($applications as $app) {
            if ($app['id'] == $appId) {
                $singleApp = $app;
                break;
            }
        }
        if ($singleApp) {
            $lid = $singleApp['learner_profile_id'];
            $edu = $pdo->prepare("SELECT * FROM learner_education WHERE learner_id = :lid ORDER BY start_date DESC");
            $edu->execute(['lid' => $lid]);
            $singleApp['education'] = $edu->fetchAll();

            $ski = $pdo->prepare("SELECT * FROM learner_skills WHERE learner_id = :lid ORDER BY skill_level DESC");
            $ski->execute(['lid' => $lid]);
            $singleApp['skills'] = $ski->fetchAll();

            $prj = $pdo->prepare("SELECT * FROM learner_projects WHERE learner_id = :lid ORDER BY start_date DESC");
            $prj->execute(['lid' => $lid]);
            $singleApp['projects'] = $prj->fetchAll();

            $cer = $pdo->prepare("SELECT * FROM learner_certificates WHERE learner_id = :lid ORDER BY issue_date DESC");
            $cer->execute(['lid' => $lid]);
            $singleApp['certificates'] = $cer->fetchAll();

            echo json_encode(['success' => true, 'data' => $singleApp]);
            exit();
        }
    }

    echo json_encode(['success' => true, 'data' => $applications]);
    exit();
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $appId = (int)($input['application_id'] ?? 0);
    $status = trim($input['status'] ?? '');

    if (!in_array($status, ['pending', 'viewed', 'shortlisted', 'accepted', 'rejected'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status.']);
        exit();
    }

    // Verify ownership
    $chk = $pdo->prepare("SELECT id FROM applications WHERE id = :id AND provider_id = :pid");
    $chk->execute(['id' => $appId, 'pid' => $providerId]);
    if (!$chk->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Application not found or unauthorized.']);
        exit();
    }

    $up = $pdo->prepare("UPDATE applications SET status = :status WHERE id = :id AND provider_id = :pid");
    $up->execute(['status' => $status, 'id' => $appId, 'pid' => $providerId]);

    echo json_encode(['success' => true, 'message' => "Application status updated to '{$status}'."]);
    exit();
}
