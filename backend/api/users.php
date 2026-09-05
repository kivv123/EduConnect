<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

// ---------------------------------------------------------------------
// 1. GET: List or Single User
// ---------------------------------------------------------------------
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at`
            FROM `users`
            WHERE `id` = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonError('User not found.', 404);
        }

        jsonResponse($user);
    }

    $role = isset($_GET['role']) && $_GET['role'] !== 'all' ? trim($_GET['role']) : null;

    if ($role) {
        $stmt = $pdo->prepare("
            SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at`
            FROM `users`
            WHERE `role` = ?
            ORDER BY `id` ASC
        ");
        $stmt->execute([$role]);
    } else {
        $stmt = $pdo->query("
            SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at`
            FROM `users`
            ORDER BY `id` ASC
        ");
    }

    jsonResponse($stmt->fetchAll());
}

// ---------------------------------------------------------------------
// 2. PUT / PATCH / POST: Update Profile or Toggle Status
// ---------------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH' || ($method === 'POST' && isset($_GET['action']))) {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $input = getJsonInput();

    if ($id <= 0 && isset($input['id'])) {
        $id = (int)$input['id'];
    }

    if ($id <= 0) {
        jsonError('User ID is required.', 400);
    }

    $action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : 'update');

    // Toggle Status Action
    if ($action === 'status') {
        $currentStmt = $pdo->prepare("SELECT `status` FROM `users` WHERE `id` = ?");
        $currentStmt->execute([$id]);
        $current = $currentStmt->fetch();

        if (!$current) {
            jsonError('User not found.', 404);
        }

        $newStatus = ($current['status'] === 'active') ? 'suspended' : 'active';
        $upStmt = $pdo->prepare("UPDATE `users` SET `status` = ? WHERE `id` = ?");
        $upStmt->execute([$newStatus, $id]);

        $getUser = $pdo->prepare("SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at` FROM `users` WHERE `id` = ?");
        $getUser->execute([$id]);
        jsonResponse($getUser->fetch(), 'User status updated to ' . $newStatus);
    }

    // Profile Update Action
    $allowed = ['name', 'phone', 'bio', 'organization', 'avatar'];
    $updates = [];
    $params = [];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "`{$field}` = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        jsonError('No valid profile fields provided.', 400);
    }

    $params[] = $id;
    $sql = "UPDATE `users` SET " . implode(', ', $updates) . " WHERE `id` = ?";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $getUser = $pdo->prepare("SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at` FROM `users` WHERE `id` = ?");
        $getUser->execute([$id]);
        jsonResponse($getUser->fetch(), 'Profile updated successfully.');
    } catch (PDOException $e) {
        jsonError('Failed to update profile: ' . $e->getMessage(), 500);
    }
}

// ---------------------------------------------------------------------
// 3. DELETE: Remove User Account
// ---------------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        $input = getJsonInput();
        $id = isset($input['id']) ? (int)$input['id'] : 0;
    }

    if ($id <= 0) {
        jsonError('User ID is required.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM `users` WHERE `id` = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        jsonError('User not found.', 404);
    }

    jsonResponse(null, 'User account deleted successfully.');
}

jsonError('Method not supported.', 405);
