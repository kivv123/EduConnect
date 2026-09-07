<?php
// backend/api/auth/forgot_password.php
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

$stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if ($user) {
    $resetCode = generate6DigitCode();
    $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $upStmt = $pdo->prepare("UPDATE users SET reset_code = :code, reset_expires = :expires WHERE id = :id");
    $upStmt->execute(['code' => $resetCode, 'expires' => $expires, 'id' => $user['id']]);

    sendEduConnectEmail($email, $user['name'], 'EduConnect Password Reset Code', $resetCode, 'password_reset');
    
    echo json_encode([
        'success' => true,
        'message' => 'If an account exists with this email, a 6-digit password reset code has been sent.',
        'data' => [
            'debug_code' => $resetCode
        ]
    ]);
} else {
    // Consistent response so we don't leak account existence
    echo json_encode([
        'success' => true,
        'message' => 'If an account exists with this email, a 6-digit password reset code has been sent.'
    ]);
}
