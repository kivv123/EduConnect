<?php
// backend/api/opportunities/details.php
require_once __DIR__ . '/../../config/db.php';

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Opportunity ID is required.']);
    exit();
}

$stmt = $pdo->prepare("
    SELECT o.*, c.name AS category_name, c.slug AS category_slug,
           p.name AS provider_name, p.logo AS provider_logo, p.provider_type, p.website AS provider_website, p.contact_email, p.contact_phone,
           u.id AS university_id, u.name AS university_name, u.logo AS university_logo, u.is_verified AS university_is_verified, u.is_featured AS university_is_featured, u.qs_world_ranking
    FROM opportunities o
    JOIN categories c ON o.category_id = c.id
    JOIN providers p ON o.provider_id = p.id
    LEFT JOIN universities u ON o.university_id = u.id
    WHERE o.id = :id
    LIMIT 1
");
$stmt->execute(['id' => $id]);
$opp = $stmt->fetch();

if (!$opp) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Opportunity not found.']);
    exit();
}

// Calculate status from dates
$today = date('Y-m-d');
$diffDays = (strtotime($opp['application_deadline']) - strtotime($today)) / (60 * 60 * 24);
if ($diffDays < 0) $opp['status'] = 'closed';
else if ($diffDays <= 7) $opp['status'] = 'closing_soon';
else if (strtotime($opp['start_date']) > strtotime($today)) $opp['status'] = 'upcoming';
else $opp['status'] = 'open';

// Check if bookmarked by logged in user
$isBookmarked = false;
$hasApplied = false;
$authUser = getAuthUser($pdo);
if ($authUser) {
    $bStmt = $pdo->prepare("SELECT id FROM saved_bookmarks WHERE user_id = :uid AND opportunity_id = :oid LIMIT 1");
    $bStmt->execute(['uid' => $authUser['id'], 'oid' => $id]);
    $isBookmarked = (bool)$bStmt->fetch();

    if ($authUser['role'] === 'learner') {
        $lStmt = $pdo->prepare("SELECT id FROM learner_profiles WHERE user_id = :uid LIMIT 1");
        $lStmt->execute(['uid' => $authUser['id']]);
        $learner = $lStmt->fetch();
        if ($learner) {
            $aStmt = $pdo->prepare("SELECT id, status, application_type, submitted_at FROM applications WHERE learner_id = :lid AND opportunity_id = :oid LIMIT 1");
            $aStmt->execute(['lid' => $learner['id'], 'oid' => $id]);
            $applicationRecord = $aStmt->fetch();
            if ($applicationRecord) {
                $hasApplied = true;
                $opp['application_status'] = $applicationRecord['status'];
                $opp['applied_at'] = $applicationRecord['submitted_at'];
            }
        }
    }
}

$opp['is_bookmarked'] = $isBookmarked;
$opp['has_applied'] = $hasApplied;

echo json_encode(['success' => true, 'data' => $opp]);
