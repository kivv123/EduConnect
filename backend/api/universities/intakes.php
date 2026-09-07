<?php
// backend/api/universities/intakes.php
require_once __DIR__ . '/../../config/db.php';

$universityId = isset($_GET['university_id']) ? (int)$_GET['university_id'] : 0;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "
        SELECT ui.*, u.name AS university_name, u.country, u.city, u.logo, u.is_verified
        FROM university_intakes ui
        JOIN universities u ON ui.university_id = u.id
        WHERE 1=1
    ";
    $params = [];
    if ($universityId > 0) {
        $sql .= " AND ui.university_id = :uid";
        $params['uid'] = $universityId;
    }
    $sql .= " ORDER BY ui.start_date ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $authUser = getAuthUser($pdo);
    if (!$authUser || ($authUser['role'] !== 'provider' && $authUser['role'] !== 'admin')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
        exit();
    }

    $input = getJsonInput();
    $targetUnivId = (int)($input['university_id'] ?? 0);
    $name = trim($input['intake_name'] ?? '');
    $startDate = $input['start_date'] ?? '';
    $deadline = $input['application_deadline'] ?? '';
    $description = trim($input['description'] ?? '');
    $url = trim($input['application_url'] ?? '');

    if (empty($name) || empty($startDate) || empty($deadline) || empty($targetUnivId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'University, intake name, start date, and deadline are required.']);
        exit();
    }

    // Check ownership if provider
    if ($authUser['role'] === 'provider') {
        $pStmt = $pdo->prepare("SELECT u.id FROM universities u JOIN providers p ON u.provider_id = p.id WHERE u.id = :uid AND p.user_id = :userId");
        $pStmt->execute(['uid' => $targetUnivId, 'userId' => $authUser['id']]);
        if (!$pStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized to add intakes for this university.']);
            exit();
        }
    }

    $ins = $pdo->prepare("INSERT INTO university_intakes (university_id, intake_name, start_date, application_deadline, description, application_url, created_at) VALUES (:uid, :name, :sdate, :dline, :desc, :url, NOW())");
    $ins->execute([
        'uid' => $targetUnivId,
        'name' => $name,
        'sdate' => $startDate,
        'dline' => $deadline,
        'desc' => $description,
        'url' => $url
    ]);

    echo json_encode(['success' => true, 'message' => 'University intake added successfully.']);
    exit();
}
