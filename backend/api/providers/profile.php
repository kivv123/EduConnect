<?php
// backend/api/providers/profile.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'provider') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized provider access.']);
    exit();
}

$stmt = $pdo->prepare("SELECT * FROM providers WHERE user_id = :uid LIMIT 1");
$stmt->execute(['uid' => $authUser['id']]);
$provider = $stmt->fetch();

if (!$provider) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Provider profile not found.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $univData = null;
    if ($provider['provider_type'] === 'university') {
        $uStmt = $pdo->prepare("SELECT * FROM universities WHERE provider_id = :pid LIMIT 1");
        $uStmt->execute(['pid' => $provider['id']]);
        $univData = $uStmt->fetch() ?: null;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'provider' => $provider,
            'university' => $univData
        ]
    ]);
    exit();
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $name = trim($input['name'] ?? $provider['name']);
    $country = trim($input['country'] ?? $provider['country']);
    $city = trim($input['city'] ?? $provider['city']);
    $address = trim($input['address'] ?? $provider['address']);
    $website = trim($input['website'] ?? $provider['website']);
    $description = trim($input['description'] ?? $provider['description']);
    $logo = trim($input['logo'] ?? $provider['logo']);
    $contactEmail = trim($input['contact_email'] ?? $provider['contact_email']);
    $contactPhone = trim($input['contact_phone'] ?? $provider['contact_phone']);

    $upStmt = $pdo->prepare("
        UPDATE providers SET
            name = :name,
            country = :country,
            city = :city,
            address = :addr,
            website = :web,
            description = :desc,
            logo = :logo,
            contact_email = :cemail,
            contact_phone = :cphone
        WHERE id = :id
    ");
    $upStmt->execute([
        'name' => $name,
        'country' => $country,
        'city' => $city,
        'addr' => $address,
        'web' => $website,
        'desc' => $description,
        'logo' => $logo,
        'cemail' => $contactEmail,
        'cphone' => $contactPhone,
        'id' => $provider['id']
    ]);

    // If it's a university, also update university profile details
    if ($provider['provider_type'] === 'university') {
        $uStmt = $pdo->prepare("SELECT id FROM universities WHERE provider_id = :pid LIMIT 1");
        $uStmt->execute(['pid' => $provider['id']]);
        $univ = $uStmt->fetch();

        $estYear = !empty($input['established_year']) ? (int)$input['established_year'] : null;
        $instType = $input['institution_type'] ?? 'Public';
        $ranking = !empty($input['qs_world_ranking']) ? (int)$input['qs_world_ranking'] : null;
        $tMin = !empty($input['tuition_min']) ? (float)$input['tuition_min'] : null;
        $tMax = !empty($input['tuition_max']) ? (float)$input['tuition_max'] : null;
        $curr = $input['currency'] ?? 'USD';

        if ($univ) {
            $uUp = $pdo->prepare("
                UPDATE universities SET
                    name = :name,
                    country = :country,
                    city = :city,
                    address = :addr,
                    website = :web,
                    description = :desc,
                    logo = :logo,
                    established_year = :eyear,
                    institution_type = :itype,
                    qs_world_ranking = :rank,
                    tuition_min = :tmin,
                    tuition_max = :tmax,
                    currency = :curr
                WHERE id = :uid
            ");
            $uUp->execute([
                'name' => $name,
                'country' => $country,
                'city' => $city,
                'addr' => $address,
                'web' => $website,
                'desc' => $description,
                'logo' => $logo,
                'eyear' => $estYear,
                'itype' => $instType,
                'rank' => $ranking,
                'tmin' => $tMin,
                'tmax' => $tMax,
                'curr' => $curr,
                'uid' => $univ['id']
            ]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Provider profile updated successfully.']);
    exit();
}
