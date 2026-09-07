<?php
// backend/api/applications/status.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit();
}

$input = getJsonInput();
$appId = (int)($input['application_id'] ?? ($_GET['id'] ?? 0));
$action = trim($input['action'] ?? ($_GET['action'] ?? 'check'));

if (!$appId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Application ID is required.']);
    exit();
}

if ($action === 'withdraw' && $authUser['role'] === 'learner') {
    $lStmt = $pdo->prepare("SELECT id FROM learner_profiles WHERE user_id = :uid LIMIT 1");
    $lStmt->execute(['uid' => $authUser['id']]);
    $learner = $lStmt->fetch();

    $del = $pdo->prepare("DELETE FROM applications WHERE id = :id AND learner_id = :lid");
    $del->execute(['id' => $appId, 'lid' => $learner['id']]);
    echo json_encode(['success' => true, 'message' => 'Application withdrawn successfully.']);
    exit();
}

// Check status
$stmt = $pdo->prepare("SELECT id, status, application_type, submitted_at, updated_at FROM applications WHERE id = :id");
$stmt->execute(['id' => $appId]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Application not found.']);
    exit();
}

echo json_encode(['success' => true, 'data' => $row]);
