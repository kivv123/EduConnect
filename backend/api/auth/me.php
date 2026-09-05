<?php
/**
 * EduConnect - Authentication: Current User Profile
 * 
 * Endpoint: GET /backend/api/auth/me.php?id=1
 */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

$userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($userId <= 0) {
    jsonError('User ID is required.', 400);
}

$pdo = getDbConnection();

$stmt = $pdo->prepare("
    SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at`
    FROM `users`
    WHERE `id` = ?
    LIMIT 1
");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    jsonError('User not found.', 404);
}

jsonResponse($user);
