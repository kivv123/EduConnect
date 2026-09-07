<?php
// backend/api/applications/index.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit();
}

if ($authUser['role'] === 'learner') {
    $lStmt = $pdo->prepare("SELECT id FROM learner_profiles WHERE user_id = :uid LIMIT 1");
    $lStmt->execute(['uid' => $authUser['id']]);
    $learner = $lStmt->fetch();
    if (!$learner) {
        echo json_encode(['success' => true, 'data' => []]);
        exit();
    }

    $stmt = $pdo->prepare("
        SELECT a.*, o.title AS opportunity_title, o.location, o.country, o.application_deadline,
               c.name AS category_name, p.name AS provider_name, p.logo AS provider_logo,
               u.name AS university_name
        FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        JOIN categories c ON o.category_id = c.id
        JOIN providers p ON a.provider_id = p.id
        LEFT JOIN universities u ON o.university_id = u.id
        WHERE a.learner_id = :lid
        ORDER BY a.submitted_at DESC
    ");
    $stmt->execute(['lid' => $learner['id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
} else if ($authUser['role'] === 'provider') {
    // Forward to provider applications list
    require_once __DIR__ . '/../providers/applications.php';
    exit();
} else if ($authUser['role'] === 'admin') {
    // Admin overview of all platform applications
    $stmt = $pdo->prepare("
        SELECT a.*, o.title AS opportunity_title, p.name AS provider_name, u.name AS learner_name, u.email AS learner_email
        FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        JOIN providers p ON a.provider_id = p.id
        JOIN learner_profiles lp ON a.learner_id = lp.id
        JOIN users u ON lp.user_id = u.id
        ORDER BY a.submitted_at DESC
        LIMIT 100
    ");
    $stmt->execute();
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

http_response_code(403);
echo json_encode(['success' => false, 'message' => 'Unauthorized role.']);
