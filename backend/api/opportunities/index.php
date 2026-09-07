<?php
// backend/api/opportunities/index.php
require_once __DIR__ . '/../../config/db.php';

$search = trim($_GET['search'] ?? '');
$categoryId = !empty($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
$categorySlug = trim($_GET['category'] ?? '');
$country = trim($_GET['country'] ?? '');
$statusFilter = trim($_GET['status'] ?? '');
$universityId = !empty($_GET['university_id']) ? (int)$_GET['university_id'] : 0;
$providerId = !empty($_GET['provider_id']) ? (int)$_GET['provider_id'] : 0;

$sql = "
    SELECT o.*, c.name AS category_name, c.slug AS category_slug,
           p.name AS provider_name, p.logo AS provider_logo, p.provider_type,
           u.name AS university_name, u.is_verified AS university_is_verified, u.is_featured AS university_is_featured
    FROM opportunities o
    JOIN categories c ON o.category_id = c.id
    JOIN providers p ON o.provider_id = p.id
    LEFT JOIN universities u ON o.university_id = u.id
    WHERE 1=1
";

$params = [];

if (!empty($search)) {
    $sql .= " AND (o.title LIKE :search OR o.description LIKE :search OR o.location LIKE :search OR p.name LIKE :search)";
    $params['search'] = "%{$search}%";
}

if ($categoryId > 0) {
    $sql .= " AND o.category_id = :cid";
    $params['cid'] = $categoryId;
}

if (!empty($categorySlug) && $categorySlug !== 'all') {
    $sql .= " AND c.slug = :cslug";
    $params['cslug'] = $categorySlug;
}

if (!empty($country)) {
    $sql .= " AND o.country = :country";
    $params['country'] = $country;
}

if ($universityId > 0) {
    $sql .= " AND o.university_id = :uid";
    $params['uid'] = $universityId;
}

if ($providerId > 0) {
    $sql .= " AND o.provider_id = :pid";
    $params['pid'] = $providerId;
}

$sql .= " ORDER BY o.application_deadline ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

// Dynamic date-based status calculation
$today = date('Y-m-d');
$filtered = [];

foreach ($rows as $row) {
    $deadline = $row['application_deadline'];
    $diffDays = (strtotime($deadline) - strtotime($today)) / (60 * 60 * 24);

    if ($diffDays < 0) {
        $calcStatus = 'closed';
    } else if ($diffDays <= 7) {
        $calcStatus = 'closing_soon';
    } else if (strtotime($row['start_date']) > strtotime($today)) {
        $calcStatus = 'upcoming';
    } else {
        $calcStatus = 'open';
    }
    $row['status'] = $calcStatus;

    if (!empty($statusFilter) && $statusFilter !== 'all' && $statusFilter !== $calcStatus) {
        continue;
    }
    $filtered[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $filtered
]);
