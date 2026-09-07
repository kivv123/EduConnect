<?php
// backend/config/db.php
require_once __DIR__ . '/cors.php';

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'educonnect';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error: ' . $e->getMessage()
    ]);
    exit();
}

/**
 * Helper to get JSON input
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Helper to get Bearer Token & authenticated user
 */
function getAuthUser($pdo) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    
    if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    
    // In our simplified session/token approach, token is base64_encode("user_id:email:secret")
    $decoded = base64_decode($token, true);
    if (!$decoded) return null;
    
    $parts = explode(':', $decoded);
    if (count($parts) < 2) return null;
    
    $userId = (int)$parts[0];
    $userEmail = $parts[1];
    
    $stmt = $pdo->prepare("SELECT id, name, email, role, status, email_verified FROM users WHERE id = :id AND email = :email AND status = 'active' LIMIT 1");
    $stmt->execute(['id' => $userId, 'email' => $userEmail]);
    return $stmt->fetch() ?: null;
}

/**
 * Create Audit Log
 */
function recordAuditLog($pdo, $adminId, $action, $entityType, $entityId, $description, $oldValues = null, $newValues = null) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, description, old_values, new_values, ip_address, created_at) VALUES (:admin_id, :action, :entity_type, :entity_id, :description, :old_val, :new_val, :ip, NOW())");
        $stmt->execute([
            'admin_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'old_val' => $oldValues ? json_encode($oldValues) : null,
            'new_val' => $newValues ? json_encode($newValues) : null,
            'ip' => $ip
        ]);
    } catch (Exception $e) {
        // Audit log failure shouldn't crash main operation, but can be logged
        error_log("Audit log failed: " . $e->getMessage());
    }
}
