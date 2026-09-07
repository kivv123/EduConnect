<?php
// backend/api/applications/create.php
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'learner') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only registered learners can submit applications.']);
    exit();
}

// Find learner profile
$lStmt = $pdo->prepare("SELECT id FROM learner_profiles WHERE user_id = :uid LIMIT 1");
$lStmt->execute(['uid' => $authUser['id']]);
$learner = $lStmt->fetch();
if (!$learner) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Learner profile not found. Please complete your profile first.']);
    exit();
}
$learnerId = $learner['id'];

$input = getJsonInput();
$opportunityId = (int)($input['opportunity_id'] ?? 0);
$appType = trim($input['application_type'] ?? 'profile_application');
$coverMessage = trim($input['cover_message'] ?? '');

if (!$opportunityId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Opportunity ID is required.']);
    exit();
}

if (!in_array($appType, ['express_interest', 'profile_application', 'external_application'])) {
    $appType = 'profile_application';
}

// Check if opportunity exists and fetch provider_id
$oStmt = $pdo->prepare("SELECT id, provider_id, title, application_deadline FROM opportunities WHERE id = :oid LIMIT 1");
$oStmt->execute(['oid' => $opportunityId]);
$opp = $oStmt->fetch();

if (!$opp) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Opportunity not found.']);
    exit();
}

// Prevent duplicate active applications
$chk = $pdo->prepare("SELECT id FROM applications WHERE learner_id = :lid AND opportunity_id = :oid LIMIT 1");
$chk->execute(['lid' => $learnerId, 'oid' => $opportunityId]);
if ($chk->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'You have already submitted an application for this opportunity.']);
    exit();
}

// Insert application
$ins = $pdo->prepare("
    INSERT INTO applications (learner_id, opportunity_id, provider_id, application_type, status, cover_message, submitted_at, updated_at)
    VALUES (:lid, :oid, :pid, :type, 'pending', :msg, NOW(), NOW())
");
$ins->execute([
    'lid' => $learnerId,
    'oid' => $opportunityId,
    'pid' => $opp['provider_id'],
    'type' => $appType,
    'msg' => $coverMessage
]);

echo json_encode([
    'success' => true,
    'message' => ($appType === 'express_interest') 
        ? 'Your interest has been expressed! The provider has received your EduConnect profile.' 
        : 'Application submitted successfully with your EduConnect Profile.',
    'data' => [
        'application_id' => $pdo->lastInsertId(),
        'status' => 'pending'
    ]
]);
