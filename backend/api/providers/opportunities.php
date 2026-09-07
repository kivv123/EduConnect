<?php
// backend/api/providers/opportunities.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'provider') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Provider account required.']);
    exit();
}

$pStmt = $pdo->prepare("SELECT id, provider_type FROM providers WHERE user_id = :uid LIMIT 1");
$pStmt->execute(['uid' => $authUser['id']]);
$provider = $pStmt->fetch();
if (!$provider) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider record not found.']);
    exit();
}
$providerId = $provider['id'];

// If university, fetch university_id
$universityId = null;
if ($provider['provider_type'] === 'university') {
    $uStmt = $pdo->prepare("SELECT id FROM universities WHERE provider_id = :pid LIMIT 1");
    $uStmt->execute(['pid' => $providerId]);
    $uRow = $uStmt->fetch();
    if ($uRow) $universityId = $uRow['id'];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT o.*, c.name AS category_name,
        (SELECT COUNT(*) FROM applications WHERE opportunity_id = o.id) AS applications_count
        FROM opportunities o
        JOIN categories c ON o.category_id = c.id
        WHERE o.provider_id = :pid
        ORDER BY o.created_at DESC
    ");
    $stmt->execute(['pid' => $providerId]);
    $opps = $stmt->fetchAll();

    // Dynamically calculate status from deadline
    $today = date('Y-m-d');
    foreach ($opps as &$opp) {
        $deadline = $opp['application_deadline'];
        $diffDays = (strtotime($deadline) - strtotime($today)) / (60 * 60 * 24);
        if ($diffDays < 0) {
            $opp['status'] = 'closed';
        } else if ($diffDays <= 7) {
            $opp['status'] = 'closing_soon';
        } else if (strtotime($opp['start_date']) > strtotime($today)) {
            $opp['status'] = 'upcoming';
        } else {
            $opp['status'] = 'open';
        }
    }

    echo json_encode(['success' => true, 'data' => $opps]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $categoryId = (int)($input['category_id'] ?? 1);
    $location = trim($input['location'] ?? 'Campus / Remote');
    $country = trim($input['country'] ?? 'Global');
    $startDate = !empty($input['start_date']) ? $input['start_date'] : date('Y-m-d');
    $endDate = !empty($input['end_date']) ? $input['end_date'] : null;
    $deadline = !empty($input['application_deadline']) ? $input['application_deadline'] : date('Y-m-d', strtotime('+30 days'));
    $eligibility = trim($input['eligibility'] ?? '');
    $requirements = trim($input['requirements'] ?? '');
    $slots = !empty($input['available_slots']) ? (int)$input['available_slots'] : null;
    $extUrl = trim($input['external_application_url'] ?? '');

    if (empty($title) || empty($description) || empty($deadline)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title, description, and deadline are required.']);
        exit();
    }

    // Dynamic initial status
    $today = date('Y-m-d');
    $diffDays = (strtotime($deadline) - strtotime($today)) / (60 * 60 * 24);
    $status = ($diffDays < 0) ? 'closed' : (($diffDays <= 7) ? 'closing_soon' : 'open');

    $ins = $pdo->prepare("
        INSERT INTO opportunities (provider_id, university_id, category_id, title, description, location, country, start_date, end_date, application_deadline, eligibility, requirements, available_slots, external_application_url, status, created_at)
        VALUES (:pid, :uid, :cid, :title, :desc, :loc, :country, :sdate, :edate, :dline, :elig, :reqs, :slots, :ext, :status, NOW())
    ");
    $ins->execute([
        'pid' => $providerId,
        'uid' => $universityId,
        'cid' => $categoryId,
        'title' => $title,
        'desc' => $description,
        'loc' => $location,
        'country' => $country,
        'sdate' => $startDate,
        'edate' => $endDate,
        'dline' => $deadline,
        'elig' => $eligibility,
        'reqs' => $requirements,
        'slots' => $slots,
        'ext' => $extUrl,
        'status' => $status
    ]);

    echo json_encode(['success' => true, 'message' => 'Opportunity created successfully.', 'id' => $pdo->lastInsertId()]);
    exit();
}

if ($method === 'PUT') {
    $input = getJsonInput();
    $id = (int)($input['id'] ?? 0);

    // Ownership check: must belong to this provider
    $chk = $pdo->prepare("SELECT id FROM opportunities WHERE id = :id AND provider_id = :pid");
    $chk->execute(['id' => $id, 'pid' => $providerId]);
    if (!$chk->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized. You cannot edit this opportunity.']);
        exit();
    }

    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $categoryId = (int)($input['category_id'] ?? 1);
    $location = trim($input['location'] ?? '');
    $country = trim($input['country'] ?? '');
    $startDate = $input['start_date'] ?? null;
    $endDate = !empty($input['end_date']) ? $input['end_date'] : null;
    $deadline = $input['application_deadline'] ?? null;
    $eligibility = trim($input['eligibility'] ?? '');
    $requirements = trim($input['requirements'] ?? '');
    $slots = !empty($input['available_slots']) ? (int)$input['available_slots'] : null;
    $extUrl = trim($input['external_application_url'] ?? '');

    $up = $pdo->prepare("
        UPDATE opportunities SET
            title = :title,
            description = :desc,
            category_id = :cid,
            location = :loc,
            country = :country,
            start_date = :sdate,
            end_date = :edate,
            application_deadline = :dline,
            eligibility = :elig,
            requirements = :reqs,
            available_slots = :slots,
            external_application_url = :ext
        WHERE id = :id AND provider_id = :pid
    ");
    $up->execute([
        'title' => $title,
        'desc' => $description,
        'cid' => $categoryId,
        'loc' => $location,
        'country' => $country,
        'sdate' => $startDate,
        'edate' => $endDate,
        'dline' => $deadline,
        'elig' => $eligibility,
        'reqs' => $requirements,
        'slots' => $slots,
        'ext' => $extUrl,
        'id' => $id,
        'pid' => $providerId
    ]);

    echo json_encode(['success' => true, 'message' => 'Opportunity updated successfully.']);
    exit();
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    // Ownership check
    $del = $pdo->prepare("DELETE FROM opportunities WHERE id = :id AND provider_id = :pid");
    $del->execute(['id' => $id, 'pid' => $providerId]);
    if ($del->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Opportunity deleted successfully.']);
    } else {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Opportunity not found or access denied.']);
    }
    exit();
}
