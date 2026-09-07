<?php
// backend/api/auth/verify_email.php
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$input = getJsonInput();
$email = trim(strtolower($input['email'] ?? ''));
$code = trim($input['code'] ?? '');

if (empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and 6-digit verification code are required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, name, email, role, email_verified, verification_code, verification_expires, verification_attempts FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Account not found.']);
    exit();
}

if ($user['email_verified'] == 1) {
    echo json_encode(['success' => true, 'message' => 'Email is already verified. You may proceed to login.']);
    exit();
}

if ($user['verification_attempts'] >= 5) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Maximum verification attempts exceeded. Please request a new code.']);
    exit();
}

if (empty($user['verification_expires']) || strtotime($user['verification_expires']) < time()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verification code has expired. Please request a new one.']);
    exit();
}

if ($user['verification_code'] !== $code) {
    $newAttempts = $user['verification_attempts'] + 1;
    $upStmt = $pdo->prepare("UPDATE users SET verification_attempts = :attempts WHERE id = :id");
    $upStmt->execute(['attempts' => $newAttempts, 'id' => $user['id']]);

    $remaining = 5 - $newAttempts;
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => "Invalid verification code. {$remaining} attempts remaining."]);
    exit();
}

// Successful verification
$upStmt = $pdo->prepare("UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires = NULL, verification_attempts = 0 WHERE id = :id");
$upStmt->execute(['id' => $user['id']]);

echo json_encode([
    'success' => true,
    'message' => 'Email verified successfully! You can now log in to EduConnect.',
    'data' => [
        'email' => $user['email'],
        'verified' => true
    ]
]);
