<?php
// backend/api/auth/register.php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$input = getJsonInput();

$name = trim($input['name'] ?? '');
$email = trim(strtolower($input['email'] ?? ''));
$password = $input['password'] ?? '';
$role = trim(strtolower($input['role'] ?? 'learner'));
$phone = trim($input['phone'] ?? '');
$providerType = trim(strtolower($input['provider_type'] ?? 'university'));

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Name, email, and password are required.']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit();
}

// Security: Prevent registration as admin! Admin does not register or get verified.
if ($role === 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin accounts cannot be registered via public signup.']);
    exit();
}

if (!in_array($role, ['learner', 'provider'])) {
    $role = 'learner';
}

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'An account with this email address already exists.']);
    exit();
}

// Generate 6-digit OTP code & expiration (15 minutes)
$otp = generate6DigitCode();
$expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password, role, phone, status, email_verified, verification_code, verification_expires, verification_attempts, created_at)
        VALUES (:name, :email, :password, :role, :phone, 'active', 0, :code, :expires, 0, NOW())
    ");
    $stmt->execute([
        'name' => $name,
        'email' => $email,
        'password' => $hashedPassword,
        'role' => $role,
        'phone' => $phone,
        'code' => $otp,
        'expires' => $expires
    ]);

    $userId = $pdo->lastInsertId();

    if ($role === 'learner') {
        $profileStmt = $pdo->prepare("INSERT INTO learner_profiles (user_id, headline, created_at) VALUES (:uid, 'Aspiring Student & Learner', NOW())");
        $profileStmt->execute(['uid' => $userId]);
    } else if ($role === 'provider') {
        $allowedTypes = ['university', 'organization', 'ngo', 'training_center', 'company', 'community_organization', 'other'];
        if (!in_array($providerType, $allowedTypes)) {
            $providerType = 'university';
        }
        $providerStmt = $pdo->prepare("
            INSERT INTO providers (user_id, provider_type, name, country, city, contact_email, created_at)
            VALUES (:uid, :ptype, :name, 'Global', 'Online', :email, NOW())
        ");
        $providerStmt->execute([
            'uid' => $userId,
            'ptype' => $providerType,
            'name' => $name,
            'email' => $email
        ]);
        $providerId = $pdo->lastInsertId();

        if ($providerType === 'university') {
            $univStmt = $pdo->prepare("
                INSERT INTO universities (provider_id, name, country, city, description, created_at)
                VALUES (:pid, :name, 'Global', 'Campus', 'Welcome to our institution on EduConnect.', NOW())
            ");
            $univStmt->execute(['pid' => $providerId, 'name' => $name]);
        }
    }

    $pdo->commit();

    // Send the 6-digit verification email
    $mailRes = sendEduConnectEmail($email, $name, 'Verify your EduConnect account', $otp, 'verification');

    echo json_encode([
        'success' => true,
        'message' => 'Registration successful! A 6-digit verification code has been sent to your email.',
        'data' => [
            'userId' => $userId,
            'email' => $email,
            'role' => $role,
            'debug_code' => $otp // Included so developers/testers can easily test without SMTP
        ]
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
}
