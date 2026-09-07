<?php
// backend/api/auth/resend_code.php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$input = getJsonInput();
$email = trim(strtolower($input['email'] ?? ''));

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email address is required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, name, email, email_verified FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Account not found with this email.']);
    exit();
}

if ($user['email_verified'] == 1) {
    echo json_encode(['success' => true, 'message' => 'Email is already verified. You can log in.']);
    exit();
}

$newOtp = generate6DigitCode();
$expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

$updateStmt = $pdo->prepare("UPDATE users SET verification_code = :code, verification_expires = :expires, verification_attempts = 0 WHERE id = :id");
$updateStmt->execute(['code' => $newOtp, 'expires' => $expires, 'id' => $user['id']]);

sendEduConnectEmail($email, $user['name'], 'New EduConnect Verification Code', $newOtp, 'verification');

echo json_encode([
    'success' => true,
    'message' => 'A fresh 6-digit verification code has been dispatched to your email.',
    'data' => [
        'debug_code' => $newOtp
    ]
]);
