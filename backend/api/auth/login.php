<?php
/**
 * EduConnect - Authentication: Login API
 * 
 * Endpoint: POST /backend/api/auth/login.php
 * Payload: { "email": "student@test.com", "password": "123456" }
 */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method Not Allowed. Use POST.', 405);
}

$input = getJsonInput();

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($email) || empty($password)) {
    jsonError('Email and password are required.', 422);
}

$pdo = getDbConnection();

$stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(?) LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    jsonError('No account found with this email address.', 404);
}

// Support both standard bcrypt password_verify and plain-text fallback (auto-rehash if plain)
$isPasswordValid = false;

if (password_verify($password, $user['password'])) {
    $isPasswordValid = true;
} elseif ($password === $user['password']) {
    // If entered plain-text matched stored plain-text, upgrade stored hash to bcrypt
    $isPasswordValid = true;
    $newHash = password_hash($password, PASSWORD_BCRYPT);
    $upStmt = $pdo->prepare("UPDATE `users` SET `password` = ? WHERE `id` = ?");
    $upStmt->execute([$newHash, $user['id']]);
}

if (!$isPasswordValid) {
    jsonError('Invalid password. Please try again.', 401);
}

if ($user['status'] === 'suspended') {
    jsonError('This account has been suspended. Please contact platform administrators.', 403);
}

// Remove password hash before returning response
unset($user['password']);

// Create simple session token
$token = bin2hex(random_bytes(24));

jsonResponse([
    'user'  => $user,
    'role'  => $user['role'],
    'token' => $token
], 'Login successful.');
