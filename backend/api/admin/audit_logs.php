<?php
// backend/api/admin/audit_logs.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin role required.']);
    exit();
}

$search = trim($_GET['search'] ?? '');
$action = trim($_GET['action'] ?? '');
$entity = trim($_GET['entity'] ?? '');
$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(5, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$sql = "
    SELECT al.*, u.name AS admin_name, u.email AS admin_email
    FROM audit_logs al
    JOIN users u ON al.admin_user_id = u.id
    WHERE 1=1
";
$countSql = "
    SELECT COUNT(*) AS total
    FROM audit_logs al
    JOIN users u ON al.admin_user_id = u.id
    WHERE 1=1
";

$params = [];

if (!empty($search)) {
    $clause = " AND (al.description LIKE :search OR u.name LIKE :search OR al.action LIKE :search)";
    $sql .= $clause;
    $countSql .= $clause;
    $params['search'] = "%{$search}%";
}

if (!empty($action) && $action !== 'all') {
    $clause = " AND al.action = :act";
    $sql .= $clause;
    $countSql .= $clause;
    $params['act'] = $action;
}

if (!empty($entity) && $entity !== 'all') {
    $clause = " AND al.entity_type = :entity";
    $sql .= $clause;
    $countSql .= $clause;
    $params['entity'] = $entity;
}

if (!empty($startDate)) {
    $clause = " AND DATE(al.created_at) >= :sdate";
    $sql .= $clause;
    $countSql .= $clause;
    $params['sdate'] = $startDate;
}

if (!empty($endDate)) {
    $clause = " AND DATE(al.created_at) <= :edate";
    $sql .= $clause;
    $countSql .= $clause;
    $params['edate'] = $endDate;
}

// Count total matching
$cStmt = $pdo->prepare($countSql);
$cStmt->execute($params);
$totalRecords = (int)$cStmt->fetch()['total'];

// Fetch paginated
$sql .= " ORDER BY al.created_at DESC LIMIT {$limit} OFFSET {$offset}";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$logs = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'data' => [
        'logs' => $logs,
        'pagination' => [
            'total' => $totalRecords,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($totalRecords / $limit)
        ]
    ]
]);
