<?php
// backend/api/learners/skills.php
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
    $stmt = $pdo->prepare("SELECT * FROM learner_skills WHERE learner_id = :lid ORDER BY skill_level DESC, skill_name ASC");
    $stmt->execute(['lid' => $learnerId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $name = trim($input['skill_name'] ?? '');
    $level = trim($input['skill_level'] ?? 'Intermediate');
    if (!in_array($level, ['Beginner', 'Intermediate', 'Advanced', 'Expert'])) {
        $level = 'Intermediate';
    }

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Skill name is required.']);
        exit();
    }

    $ins = $pdo->prepare("INSERT INTO learner_skills (learner_id, skill_name, skill_level, created_at) VALUES (:lid, :name, :lvl, NOW())");
    $ins->execute(['lid' => $learnerId, 'name' => $name, 'lvl' => $level]);

    echo json_encode(['success' => true, 'message' => 'Skill added successfully.']);
    exit();
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $del = $pdo->prepare("DELETE FROM learner_skills WHERE id = :id AND learner_id = :lid");
    $del->execute(['id' => $id, 'lid' => $learnerId]);
    echo json_encode(['success' => true, 'message' => 'Skill removed.']);
    exit();
}
