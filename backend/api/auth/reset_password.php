<?php
// backend/api/auth/reset_password.php
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$input = getJsonInput();
$email = trim(strtolower($input['email'] ?? ''));
$code = trim($input['code'] ?? '');
$newPassword = $input['password'] ?? '';

if (empty($email) || empty($code) || empty($newPassword)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email, reset code, and new password are required.']);
    exit();
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, reset_code, reset_expires FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid reset request.']);
    exit();
}

if (empty($user['reset_code']) || $user['reset_code'] !== $code) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired 6-digit reset code.']);
    exit();
}

if (empty($user['reset_expires']) || strtotime($user['reset_expires']) < time()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Reset code has expired. Please request a new one.']);
    exit();
}

$hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
$upStmt = $pdo->prepare("UPDATE users SET password = :pwd, reset_code = NULL, reset_expires = NULL WHERE id = :id");
$upStmt->execute(['pwd' => $hashedPassword, 'id' => $user['id']]);

echo json_encode([
    'success' => true,
    'message' => 'Your password has been successfully reset. You can now log in with your new password.'
]);
