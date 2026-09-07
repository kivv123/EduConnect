<?php
// backend/api/universities/index.php
require_once __DIR__ . '/../../config/db.php';

$search = trim($_GET['search'] ?? '');
$country = trim($_GET['country'] ?? '');
$maxRanking = !empty($_GET['max_ranking']) ? (int)$_GET['max_ranking'] : null;
$hasScholarships = isset($_GET['has_scholarships']) && $_GET['has_scholarships'] === '1';
$featuredOnly = isset($_GET['featured']) && $_GET['featured'] === '1';

$sql = "
    SELECT u.*, p.name AS provider_name, p.logo AS provider_logo,
    (SELECT COUNT(*) FROM opportunities WHERE university_id = u.id AND category_id = 1 AND application_deadline >= CURDATE()) AS scholarships_count,
    (SELECT COUNT(*) FROM opportunities WHERE university_id = u.id) AS total_opportunities,
    (SELECT COUNT(*) FROM university_intakes WHERE university_id = u.id AND application_deadline >= CURDATE()) AS active_intakes_count
    FROM universities u
    JOIN providers p ON u.provider_id = p.id
    WHERE 1=1
";

$params = [];

if (!empty($search)) {
    $sql .= " AND (u.name LIKE :search OR u.city LIKE :search OR u.description LIKE :search)";
    $params['search'] = "%{$search}%";
}

if (!empty($country)) {
    $sql .= " AND u.country = :country";
    $params['country'] = $country;
}

if ($maxRanking) {
    $sql .= " AND u.qs_world_ranking <= :max_rank AND u.qs_world_ranking > 0";
    $params['max_rank'] = $maxRanking;
}

if ($featuredOnly) {
    $sql .= " AND u.is_featured = 1";
}

if ($hasScholarships) {
    $sql .= " AND (SELECT COUNT(*) FROM opportunities WHERE university_id = u.id AND category_id = 1 AND application_deadline >= CURDATE()) > 0";
}

// Order: Featured universities first by featured_order, then ranking, then name
$sql .= " ORDER BY u.is_featured DESC, u.featured_order ASC, CASE WHEN u.qs_world_ranking IS NULL THEN 9999 ELSE u.qs_world_ranking END ASC, u.name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$universities = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'data' => $universities
]);
