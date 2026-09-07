<?php
// backend/api/learners/projects.php
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
    $stmt = $pdo->prepare("SELECT * FROM learner_projects WHERE learner_id = :lid ORDER BY start_date DESC");
    $stmt->execute(['lid' => $learnerId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $role = trim($input['role'] ?? '');
    $technologies = trim($input['technologies'] ?? '');
    $url = trim($input['project_url'] ?? '');
    $startDate = !empty($input['start_date']) ? $input['start_date'] : date('Y-m-d');
    $endDate = !empty($input['end_date']) ? $input['end_date'] : null;

    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Project title is required.']);
        exit();
    }

    $ins = $pdo->prepare("INSERT INTO learner_projects (learner_id, title, description, role, technologies, project_url, start_date, end_date, created_at) VALUES (:lid, :title, :desc, :role, :tech, :url, :sdate, :edate, NOW())");
    $ins->execute([
        'lid' => $learnerId,
        'title' => $title,
        'desc' => $description,
        'role' => $role,
        'tech' => $technologies,
        'url' => $url,
        'sdate' => $startDate,
        'edate' => $endDate
    ]);

    echo json_encode(['success' => true, 'message' => 'Project added successfully.']);
    exit();
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $del = $pdo->prepare("DELETE FROM learner_projects WHERE id = :id AND learner_id = :lid");
    $del->execute(['id' => $id, 'lid' => $learnerId]);
    echo json_encode(['success' => true, 'message' => 'Project removed.']);
    exit();
}
