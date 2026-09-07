<?php
// backend/api/learners/education.php
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
    $stmt = $pdo->prepare("SELECT * FROM learner_education WHERE learner_id = :lid ORDER BY start_date DESC");
    $stmt->execute(['lid' => $learnerId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $institution = trim($input['institution_name'] ?? '');
    $level = trim($input['education_level'] ?? '');
    $field = trim($input['field_of_study'] ?? '');
    $startDate = $input['start_date'] ?? null;
    $endDate = !empty($input['end_date']) ? $input['end_date'] : null;
    $grade = trim($input['grade'] ?? '');
    $description = trim($input['description'] ?? '');

    if (empty($institution) || empty($level) || empty($field) || empty($startDate)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Institution, level, field of study, and start date are required.']);
        exit();
    }

    $ins = $pdo->prepare("INSERT INTO learner_education (learner_id, institution_name, education_level, field_of_study, start_date, end_date, grade, description, created_at) VALUES (:lid, :inst, :lvl, :field, :sdate, :edate, :grade, :desc, NOW())");
    $ins->execute([
        'lid' => $learnerId,
        'inst' => $institution,
        'lvl' => $level,
        'field' => $field,
        'sdate' => $startDate,
        'edate' => $endDate,
        'grade' => $grade,
        'desc' => $description
    ]);

    echo json_encode(['success' => true, 'message' => 'Education entry added successfully.']);
    exit();
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $del = $pdo->prepare("DELETE FROM learner_education WHERE id = :id AND learner_id = :lid");
    $del->execute(['id' => $id, 'lid' => $learnerId]);
    echo json_encode(['success' => true, 'message' => 'Education entry removed.']);
    exit();
}
