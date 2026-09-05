<?php
/**
 * EduConnect - Universities, Intakes, and Campus News REST API
 * 
 * Supported Methods:
 * - GET  /backend/api/universities.php               -> List universities with intakes & news (supports ?search=, ?country=, ?scholarship_only=1)
 * - GET  /backend/api/universities.php?id=1          -> Single university with intakes & news
 * - GET  /backend/api/universities.php?action=news   -> Aggregated news feed across all universities
 * - POST /backend/api/universities.php               -> Create new university profile
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------------
// 1. GET: List or Single University or Global News
// ---------------------------------------------------------------------
if ($method === 'GET') {
    $action = isset($_GET['action']) ? trim($_GET['action']) : '';
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    // Aggregated News Feed
    if ($action === 'news') {
        $stmt = $pdo->query("
            SELECT n.*, u.name as university_name, u.logo as university_logo
            FROM `university_news` n
            JOIN `universities` u ON n.university_id = u.id
            ORDER BY n.date DESC
        ");
        jsonResponse($stmt->fetchAll());
    }

    // Helper to fetch intakes and news for a university ID
    $fetchRelations = function($uniId) use ($pdo) {
        $intakesStmt = $pdo->prepare("SELECT * FROM `university_intakes` WHERE `university_id` = ? ORDER BY `deadline` ASC");
        $intakesStmt->execute([$uniId]);
        $intakes = $intakesStmt->fetchAll();

        $newsStmt = $pdo->prepare("SELECT * FROM `university_news` WHERE `university_id` = ? ORDER BY `date` DESC");
        $newsStmt->execute([$uniId]);
        $news = $newsStmt->fetchAll();

        return [$intakes, $news];
    };

    // Single University
    if ($id > 0) {
        $stmt = $pdo->prepare("SELECT * FROM `universities` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$id]);
        $uni = $stmt->fetch();

        if (!$uni) {
            jsonError('University not found.', 404);
        }

        $uni['scholarship_available'] = (bool)$uni['scholarship_available'];
        list($intakes, $news) = $fetchRelations($uni['id']);
        $uni['intakes'] = $intakes;
        $uni['news'] = $news;

        jsonResponse($uni);
    }

    // List Universities
    $conditions = [];
    $params = [];

    if (!empty($_GET['search'])) {
        $searchTerm = '%' . trim($_GET['search']) . '%';
        $conditions[] = "(name LIKE ? OR city LIKE ? OR country LIKE ? OR description LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if (!empty($_GET['country']) && $_GET['country'] !== 'all') {
        $conditions[] = "LOWER(country) = LOWER(?)";
        $params[] = trim($_GET['country']);
    }

    if (!empty($_GET['scholarship_only']) && ($_GET['scholarship_only'] === '1' || $_GET['scholarship_only'] === 'true')) {
        $conditions[] = "scholarship_available = 1";
    }

    $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $sql = "SELECT * FROM `universities` {$whereClause} ORDER BY `ranking` ASC, `name` ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $universities = $stmt->fetchAll();

    // Fetch all intakes and news in batch for efficiency
    $intakesAll = $pdo->query("SELECT * FROM `university_intakes` ORDER BY `deadline` ASC")->fetchAll();
    $newsAll = $pdo->query("SELECT * FROM `university_news` ORDER BY `date` DESC")->fetchAll();

    $intakesByUni = [];
    foreach ($intakesAll as $in) {
        $intakesByUni[$in['university_id']][] = $in;
    }

    $newsByUni = [];
    foreach ($newsAll as $nw) {
        $newsByUni[$nw['university_id']][] = $nw;
    }

    foreach ($universities as &$u) {
        $u['scholarship_available'] = (bool)$u['scholarship_available'];
        $u['intakes'] = isset($intakesByUni[$u['id']]) ? $intakesByUni[$u['id']] : [];
        $u['news'] = isset($newsByUni[$u['id']]) ? $newsByUni[$u['id']] : [];
    }

    jsonResponse($universities);
}

// ---------------------------------------------------------------------
// 2. POST: Create University
// ---------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $name = isset($input['name']) ? trim($input['name']) : '';
    $country = isset($input['country']) ? trim($input['country']) : '';
    $city = isset($input['city']) ? trim($input['city']) : '';
    $established = isset($input['established']) ? (int)$input['established'] : null;
    $ranking = isset($input['ranking']) ? (int)$input['ranking'] : null;
    $intake_periods = isset($input['intake_periods']) ? trim($input['intake_periods']) : 'August & January';
    $website = isset($input['website']) ? trim($input['website']) : '';
    $logo = isset($input['logo']) ? trim($input['logo']) : '';
    $banner = isset($input['banner']) ? trim($input['banner']) : '';
    $description = isset($input['description']) ? trim($input['description']) : '';
    $tuition_range = isset($input['tuition_range']) ? trim($input['tuition_range']) : '';
    $scholarship_available = isset($input['scholarship_available']) ? ($input['scholarship_available'] ? 1 : 0) : 1;

    if (empty($name) || empty($country) || empty($city)) {
        jsonError('University name, country, and city are required.', 422);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `universities` (
            `name`, `country`, `city`, `established`, `ranking`,
            `intake_periods`, `website`, `logo`, `banner`,
            `description`, `tuition_range`, `scholarship_available`, `created_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    try {
        $stmt->execute([
            $name, $country, $city, $established, $ranking,
            $intake_periods, $website, $logo, $banner,
            $description, $tuition_range, $scholarship_available
        ]);

        $newId = (int)$pdo->lastInsertId();
        $getStmt = $pdo->prepare("SELECT * FROM `universities` WHERE `id` = ?");
        $getStmt->execute([$newId]);
        $newUni = $getStmt->fetch();
        $newUni['intakes'] = [];
        $newUni['news'] = [];

        jsonResponse($newUni, 'University created successfully.', 201);
    } catch (PDOException $e) {
        jsonError('Failed to create university: ' . $e->getMessage(), 500);
    }
}

jsonError('Method not supported.', 405);
