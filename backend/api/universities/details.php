<?php
// backend/api/universities/details.php
require_once __DIR__ . '/../../config/db.php';

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'University ID is required.']);
    exit();
}

$stmt = $pdo->prepare("
    SELECT u.*, p.name AS provider_name, p.logo AS provider_logo, p.contact_email, p.contact_phone
    FROM universities u
    JOIN providers p ON u.provider_id = p.id
    WHERE u.id = :id
    LIMIT 1
");
$stmt->execute(['id' => $id]);
$university = $stmt->fetch();

if (!$university) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'University not found.']);
    exit();
}

// Fetch intakes
$inStmt = $pdo->prepare("SELECT * FROM university_intakes WHERE university_id = :uid ORDER BY start_date ASC");
$inStmt->execute(['uid' => $id]);
$intakes = $inStmt->fetchAll();

// Fetch opportunities
$opStmt = $pdo->prepare("
    SELECT o.*, c.name AS category_name
    FROM opportunities o
    JOIN categories c ON o.category_id = c.id
    WHERE o.university_id = :uid
    ORDER BY o.application_deadline ASC
");
$opStmt->execute(['uid' => $id]);
$opportunities = $opStmt->fetchAll();

$today = date('Y-m-d');
foreach ($opportunities as &$opp) {
    $diffDays = (strtotime($opp['application_deadline']) - strtotime($today)) / (60 * 60 * 24);
    if ($diffDays < 0) $opp['status'] = 'closed';
    else if ($diffDays <= 7) $opp['status'] = 'closing_soon';
    else if (strtotime($opp['start_date']) > strtotime($today)) $opp['status'] = 'upcoming';
    else $opp['status'] = 'open';
}

echo json_encode([
    'success' => true,
    'data' => [
        'university' => $university,
        'intakes' => $intakes,
        'opportunities' => $opportunities
    ]
]);
