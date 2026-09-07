<?php
// backend/api/admin/dashboard.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin role required.']);
    exit();
}

// Live statistics from MySQL
$stats = [];

$uQuery = $pdo->query("SELECT COUNT(*) AS total FROM universities");
$stats['universities'] = (int)$uQuery->fetch()['total'];

$pQuery = $pdo->query("SELECT COUNT(*) AS total FROM providers");
$stats['providers'] = (int)$pQuery->fetch()['total'];

$oQuery = $pdo->query("SELECT COUNT(*) AS total FROM opportunities");
$stats['opportunities'] = (int)$oQuery->fetch()['total'];

$aQuery = $pdo->query("SELECT COUNT(*) AS total FROM applications");
$stats['applications'] = (int)$aQuery->fetch()['total'];

$lQuery = $pdo->query("SELECT COUNT(*) AS total FROM users WHERE role = 'learner'");
$stats['learners'] = (int)$lQuery->fetch()['total'];

$fQuery = $pdo->query("SELECT COUNT(*) AS total FROM universities WHERE is_featured = 1");
$stats['featured_universities'] = (int)$fQuery->fetch()['total'];

$vQuery = $pdo->query("SELECT COUNT(*) AS total FROM universities WHERE is_verified = 1");
$stats['verified_universities'] = (int)$vQuery->fetch()['total'];

// Recent audit logs
$logStmt = $pdo->query("
    SELECT al.*, u.name AS admin_name, u.email AS admin_email
    FROM audit_logs al
    JOIN users u ON al.admin_user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 10
");
$stats['recent_logs'] = $logStmt->fetchAll();

echo json_encode([
    'success' => true,
    'data' => $stats
]);
