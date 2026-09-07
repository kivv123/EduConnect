<?php
// backend/api/admin/verified.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin role required.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$input = getJsonInput();
$universityId = (int)($input['university_id'] ?? 0);
$verifyAction = isset($input['is_verified']) ? (bool)$input['is_verified'] : true;

if (!$universityId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'University ID is required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, name, is_verified FROM universities WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $universityId]);
$univ = $stmt->fetch();

if (!$univ) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'University not found.']);
    exit();
}

$oldVal = ['is_verified' => (int)$univ['is_verified']];

if ($verifyAction) {
    $up = $pdo->prepare("
        UPDATE universities SET
            is_verified = 1,
            verified_at = NOW(),
            verified_by = :aid
        WHERE id = :id
    ");
    $up->execute(['aid' => $authUser['id'], 'id' => $universityId]);
    $newVal = ['is_verified' => 1];
    $description = "Admin {$authUser['name']} verified {$univ['name']}.";
    $message = "Verified badge added to {$univ['name']}.";
} else {
    $up = $pdo->prepare("
        UPDATE universities SET
            is_verified = 0,
            verified_at = NULL,
            verified_by = NULL
        WHERE id = :id
    ");
    $up->execute(['id' => $universityId]);
    $newVal = ['is_verified' => 0];
    $description = "Admin {$authUser['name']} removed the verified badge from {$univ['name']}.";
    $message = "Verified badge removed from {$univ['name']}.";
}

recordAuditLog($pdo, $authUser['id'], $verifyAction ? 'VERIFY' : 'UNVERIFY', 'university', $universityId, $description, $oldVal, $newVal);

echo json_encode([
    'success' => true,
    'message' => $message,
    'data' => [
        'university_id' => $universityId,
        'is_verified' => $verifyAction ? 1 : 0
    ]
]);
