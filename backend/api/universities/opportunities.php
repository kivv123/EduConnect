<?php
// backend/api/universities/opportunities.php
require_once __DIR__ . '/../../config/db.php';

$categorySlug = trim($_GET['category'] ?? '');
$universityId = (int)($_GET['university_id'] ?? 0);

$sql = "
    SELECT o.*, c.name AS category_name, c.slug AS category_slug,
    u.name AS university_name, u.logo AS university_logo, u.is_verified, u.country AS university_country,
    p.name AS provider_name
    FROM opportunities o
    JOIN categories c ON o.category_id = c.id
    JOIN universities u ON o.university_id = u.id
    JOIN providers p ON o.provider_id = p.id
    WHERE 1=1
";

$params = [];
if (!empty($categorySlug) && $categorySlug !== 'all') {
    $sql .= " AND c.slug = :cslug";
    $params['cslug'] = $categorySlug;
}

if ($universityId > 0) {
    $sql .= " AND o.university_id = :uid";
    $params['uid'] = $universityId;
}

$sql .= " ORDER BY o.application_deadline ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$opps = $stmt->fetchAll();

$today = date('Y-m-d');
foreach ($opps as &$opp) {
    $diffDays = (strtotime($opp['application_deadline']) - strtotime($today)) / (60 * 60 * 24);
    if ($diffDays < 0) $opp['status'] = 'closed';
    else if ($diffDays <= 7) $opp['status'] = 'closing_soon';
    else if (strtotime($opp['start_date']) > strtotime($today)) $opp['status'] = 'upcoming';
    else $opp['status'] = 'open';
}

echo json_encode(['success' => true, 'data' => $opps]);
