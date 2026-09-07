<?php
// backend/api/learners/achievements.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id FROM learner_profiles WHERE user_id = :uid LIMIT 1");
$stmt->execute(['uid' => $authUser['id']]);
$learner = $stmt->fetch();
if (!$learner) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Learner profile not found.']);
    exit();
}
$learnerId = $learner['id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM learner_achievements WHERE learner_id = :lid ORDER BY date DESC");
    $stmt->execute(['lid' => $learnerId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $date = !empty($input['date']) ? $input['date'] : date('Y-m-d');
    $organization = trim($input['organization'] ?? '');

    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Achievement title is required.']);
        exit();
    }

    $ins = $pdo->prepare("INSERT INTO learner_achievements (learner_id, title, description, date, organization, created_at) VALUES (:lid, :title, :desc, :dt, :org, NOW())");
    $ins->execute(['lid' => $learnerId, 'title' => $title, 'desc' => $description, 'dt' => $date, 'org' => $organization]);

    echo json_encode(['success' => true, 'message' => 'Achievement added successfully.']);
    exit();
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $del = $pdo->prepare("DELETE FROM learner_achievements WHERE id = :id AND learner_id = :lid");
    $del->execute(['id' => $id, 'lid' => $learnerId]);
    echo json_encode(['success' => true, 'message' => 'Achievement removed.']);
    exit();
}
