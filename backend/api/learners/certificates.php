<?php
// backend/api/learners/certificates.php
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
    $stmt = $pdo->prepare("SELECT * FROM learner_certificates WHERE learner_id = :lid ORDER BY issue_date DESC");
    $stmt->execute(['lid' => $learnerId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $name = trim($input['certificate_name'] ?? '');
    $org = trim($input['issuing_organization'] ?? '');
    $issueDate = !empty($input['issue_date']) ? $input['issue_date'] : date('Y-m-d');
    $credUrl = trim($input['credential_url'] ?? '');
    $desc = trim($input['description'] ?? '');

    if (empty($name) || empty($org)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Certificate name and issuing organization are required.']);
        exit();
    }

    $ins = $pdo->prepare("INSERT INTO learner_certificates (learner_id, certificate_name, issuing_organization, issue_date, credential_url, description, created_at) VALUES (:lid, :name, :org, :idate, :url, :desc, NOW())");
    $ins->execute([
        'lid' => $learnerId,
        'name' => $name,
        'org' => $org,
        'idate' => $issueDate,
        'url' => $credUrl,
        'desc' => $desc
    ]);

    echo json_encode(['success' => true, 'message' => 'Certificate added successfully.']);
    exit();
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $del = $pdo->prepare("DELETE FROM learner_certificates WHERE id = :id AND learner_id = :lid");
    $del->execute(['id' => $id, 'lid' => $learnerId]);
    echo json_encode(['success' => true, 'message' => 'Certificate removed.']);
    exit();
}
