<?php
// backend/api/admin/featured.php
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
$featureAction = isset($input['is_featured']) ? (bool)$input['is_featured'] : true;
$featuredOrder = (int)($input['featured_order'] ?? 0);

if (!$universityId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'University ID is required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, name, is_featured FROM universities WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $universityId]);
$univ = $stmt->fetch();

if (!$univ) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'University not found.']);
    exit();
}

$oldVal = ['is_featured' => (int)$univ['is_featured']];

if ($featureAction) {
    $up = $pdo->prepare("
        UPDATE universities SET
            is_featured = 1,
            featured_at = NOW(),
            featured_by = :aid,
            featured_order = :forder
        WHERE id = :id
    ");
    $up->execute(['aid' => $authUser['id'], 'forder' => $featuredOrder, 'id' => $universityId]);
    $newVal = ['is_featured' => 1, 'featured_order' => $featuredOrder];
    $description = "Admin {$authUser['name']} featured {$univ['name']}.";
    $message = "{$univ['name']} is now featured on the homepage.";
} else {
    $up = $pdo->prepare("
        UPDATE universities SET
            is_featured = 0,
            featured_at = NULL,
            featured_by = NULL,
            featured_order = 0
        WHERE id = :id
    ");
    $up->execute(['id' => $universityId]);
    $newVal = ['is_featured' => 0];
    $description = "Admin {$authUser['name']} removed {$univ['name']}'s featured status.";
    $message = "{$univ['name']} removed from featured list.";
}

recordAuditLog($pdo, $authUser['id'], $featureAction ? 'FEATURE' : 'UNFEATURE', 'university', $universityId, $description, $oldVal, $newVal);

echo json_encode([
    'success' => true,
    'message' => $message,
    'data' => [
        'university_id' => $universityId,
        'is_featured' => $featureAction ? 1 : 0
    ]
]);
