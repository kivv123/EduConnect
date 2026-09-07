<?php
// backend/api/users/profile.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please sign in.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode([
        'success' => true,
        'data' => $authUser
    ]);
    exit();
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $name = trim($input['name'] ?? $authUser['name']);
    $phone = trim($input['phone'] ?? '');

    $stmt = $pdo->prepare("UPDATE users SET name = :name, phone = :phone WHERE id = :id");
    $stmt->execute(['name' => $name, 'phone' => $phone, 'id' => $authUser['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully.'
    ]);
    exit();
}
