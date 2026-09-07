<?php
// backend/api/admin/universities.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin role required.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $sql = "
        SELECT u.*, p.name AS provider_name, p.provider_type,
               (SELECT COUNT(*) FROM opportunities WHERE university_id = u.id) AS opportunities_count,
               (SELECT COUNT(*) FROM university_intakes WHERE university_id = u.id) AS intakes_count
        FROM universities u
        JOIN providers p ON u.provider_id = p.id
        WHERE 1=1
    ";
    $params = [];
    if (!empty($search)) {
        $sql .= " AND (u.name LIKE :search OR u.country LIKE :search OR u.city LIKE :search)";
        $params['search'] = "%{$search}%";
    }
    $sql .= " ORDER BY u.is_featured DESC, u.is_verified DESC, u.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'PUT' || $method === 'POST') {
    $input = getJsonInput();
    $id = (int)($input['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'University ID is required.']);
        exit();
    }

    // Read old values for audit log
    $oldStmt = $pdo->prepare("SELECT * FROM universities WHERE id = :id LIMIT 1");
    $oldStmt->execute(['id' => $id]);
    $oldData = $oldStmt->fetch();
    if (!$oldData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'University not found.']);
        exit();
    }

    $name = trim($input['name'] ?? $oldData['name']);
    $country = trim($input['country'] ?? $oldData['country']);
    $city = trim($input['city'] ?? $oldData['city']);
    $ranking = isset($input['qs_world_ranking']) ? (int)$input['qs_world_ranking'] : $oldData['qs_world_ranking'];
    $tMin = isset($input['tuition_min']) ? (float)$input['tuition_min'] : $oldData['tuition_min'];
    $tMax = isset($input['tuition_max']) ? (float)$input['tuition_max'] : $oldData['tuition_max'];
    $currency = trim($input['currency'] ?? $oldData['currency']);
    $instType = trim($input['institution_type'] ?? $oldData['institution_type']);
    $website = trim($input['website'] ?? $oldData['website']);

    $upStmt = $pdo->prepare("
        UPDATE universities SET
            name = :name,
            country = :country,
            city = :city,
            qs_world_ranking = :rank,
            tuition_min = :tmin,
            tuition_max = :tmax,
            currency = :curr,
            institution_type = :itype,
            website = :web
        WHERE id = :id
    ");
    $upStmt->execute([
        'name' => $name,
        'country' => $country,
        'city' => $city,
        'rank' => $ranking,
        'tmin' => $tMin,
        'tmax' => $tMax,
        'curr' => $currency,
        'itype' => $instType,
        'web' => $website,
        'id' => $id
    ]);

    // Read new values
    $newStmt = $pdo->prepare("SELECT * FROM universities WHERE id = :id LIMIT 1");
    $newStmt->execute(['id' => $id]);
    $newData = $newStmt->fetch();

    // Create Audit Log
    $desc = "Admin {$authUser['name']} updated {$newData['name']} (Tuition: {$tMin}-{$tMax} {$currency}, Rank: {$ranking}).";
    recordAuditLog($pdo, $authUser['id'], 'UPDATE_UNIVERSITY', 'university', $id, $desc, [
        'tuition_min' => $oldData['tuition_min'],
        'tuition_max' => $oldData['tuition_max'],
        'qs_world_ranking' => $oldData['qs_world_ranking']
    ], [
        'tuition_min' => $tMin,
        'tuition_max' => $tMax,
        'qs_world_ranking' => $ranking
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'University updated successfully and change recorded in audit log.',
        'data' => $newData
    ]);
    exit();
}
