<?php
/**
 * EduConnect - Academic Seminars & Events REST API
 * 
 * Supported Methods:
 * - GET  /backend/api/events.php         -> List events (supports ?search=, ?type=, ?mode=)
 * - GET  /backend/api/events.php?id=1    -> Single event details
 * - POST /backend/api/events.php        -> Create event
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------------
// 1. GET: List or Single Event
// ---------------------------------------------------------------------
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT e.*, u.name as university_name, u.logo as university_logo, p.name as provider_user_name
            FROM `events` e
            LEFT JOIN `universities` u ON e.university_id = u.id
            LEFT JOIN `users` p ON e.provider_id = p.id
            WHERE e.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $event = $stmt->fetch();

        if (!$event) {
            jsonError('Event not found.', 404);
        }

        jsonResponse($event);
    }

    $conditions = [];
    $params = [];

    if (!empty($_GET['search'])) {
        $term = '%' . trim($_GET['search']) . '%';
        $conditions[] = "(e.title LIKE ? OR e.description LIKE ? OR e.speaker LIKE ? OR e.location LIKE ?)";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if (!empty($_GET['type']) && $_GET['type'] !== 'all') {
        $conditions[] = "LOWER(e.event_type) = LOWER(?)";
        $params[] = trim($_GET['type']);
    }

    if (!empty($_GET['mode']) && $_GET['mode'] !== 'all') {
        $conditions[] = "LOWER(e.mode) = LOWER(?)";
        $params[] = trim($_GET['mode']);
    }

    $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $sql = "
        SELECT e.*, u.name as university_name, u.logo as university_logo
        FROM `events` e
        LEFT JOIN `universities` u ON e.university_id = u.id
        {$whereClause}
        ORDER BY e.date ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

// ---------------------------------------------------------------------
// 2. POST: Create Event
// ---------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $title = isset($input['title']) ? trim($input['title']) : '';
    $university_id = isset($input['university_id']) && !empty($input['university_id']) ? (int)$input['university_id'] : null;
    $provider_id = isset($input['provider_id']) ? (int)$input['provider_id'] : 2;
    $event_type = isset($input['event_type']) ? trim($input['event_type']) : 'Seminar';
    $date = isset($input['date']) ? trim($input['date']) : date('Y-m-d', strtotime('+2 weeks'));
    $time = isset($input['time']) ? trim($input['time']) : '14:00 - 16:00 UTC';
    $location = isset($input['location']) ? trim($input['location']) : 'Online';
    $mode = isset($input['mode']) ? trim($input['mode']) : 'Online';
    $speaker = isset($input['speaker']) ? trim($input['speaker']) : '';
    $banner = isset($input['banner']) ? trim($input['banner']) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&auto=format&fit=crop&q=80';
    $description = isset($input['description']) ? trim($input['description']) : '';
    $registration_link = isset($input['registration_link']) ? trim($input['registration_link']) : '#register';

    if (empty($title) || empty($description)) {
        jsonError('Title and description are required.', 422);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `events` (
            `title`, `university_id`, `provider_id`, `event_type`, `date`,
            `time`, `location`, `mode`, `speaker`, `banner`,
            `description`, `registration_link`, `created_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    try {
        $stmt->execute([
            $title, $university_id, $provider_id, $event_type, $date,
            $time, $location, $mode, $speaker, $banner,
            $description, $registration_link
        ]);

        $newId = (int)$pdo->lastInsertId();
        $getStmt = $pdo->prepare("SELECT * FROM `events` WHERE `id` = ?");
        $getStmt->execute([$newId]);
        jsonResponse($getStmt->fetch(), 'Event created successfully.', 201);
    } catch (PDOException $e) {
        jsonError('Failed to create event: ' . $e->getMessage(), 500);
    }
}

jsonError('Method not supported.', 405);
