<?php
/**
 * EduConnect - Opportunities REST API
 * 
 * Supported Methods:
 * - GET  /backend/api/opportunities.php                  -> List with optional filters: ?search=&category_id=&type=&mode=&provider_id=&status=
 * - GET  /backend/api/opportunities.php?id=1            -> Single opportunity details
 * - POST /backend/api/opportunities.php                 -> Create opportunity
 * - PUT  /backend/api/opportunities.php?id=1            -> Update opportunity
 * - DELETE /backend/api/opportunities.php?id=1         -> Delete opportunity
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle method override
if ($method === 'POST' && isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
}

// ---------------------------------------------------------------------
// 1. GET: List or Single Item
// ---------------------------------------------------------------------
if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT o.*, c.name as category_name, c.slug as category_slug, u.name as provider_user_name, u.email as provider_email
            FROM `opportunities` o
            LEFT JOIN `categories` c ON o.category_id = c.id
            LEFT JOIN `users` u ON o.provider_id = u.id
            WHERE o.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $opportunity = $stmt->fetch();

        if (!$opportunity) {
            jsonError('Opportunity not found.', 404);
        }

        jsonResponse($opportunity);
    }

    // List with filters
    $conditions = [];
    $params = [];

    if (!empty($_GET['search'])) {
        $searchTerm = '%' . trim($_GET['search']) . '%';
        $conditions[] = "(o.title LIKE ? OR o.description LIKE ? OR o.location LIKE ? OR o.provider_name LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if (!empty($_GET['category_id']) && $_GET['category_id'] !== 'all') {
        $conditions[] = "o.category_id = ?";
        $params[] = (int)$_GET['category_id'];
    }

    if (!empty($_GET['type']) && $_GET['type'] !== 'all') {
        $conditions[] = "LOWER(o.type) = LOWER(?)";
        $params[] = trim($_GET['type']);
    }

    if (!empty($_GET['mode']) && $_GET['mode'] !== 'all') {
        $conditions[] = "LOWER(o.mode) = LOWER(?)";
        $params[] = trim($_GET['mode']);
    }

    if (!empty($_GET['provider_id'])) {
        $conditions[] = "o.provider_id = ?";
        $params[] = (int)$_GET['provider_id'];
    }

    if (!empty($_GET['status']) && $_GET['status'] !== 'all') {
        $conditions[] = "o.status = ?";
        $params[] = trim($_GET['status']);
    }

    $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $sql = "
        SELECT o.*, c.name as category_name, c.slug as category_slug
        FROM `opportunities` o
        LEFT JOIN `categories` c ON o.category_id = c.id
        {$whereClause}
        ORDER BY o.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $list = $stmt->fetchAll();

    jsonResponse($list);
}

// ---------------------------------------------------------------------
// 2. POST: Create Opportunity
// ---------------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $title = isset($input['title']) ? trim($input['title']) : '';
    $description = isset($input['description']) ? trim($input['description']) : '';
    $category_id = isset($input['category_id']) ? (int)$input['category_id'] : 1;
    $provider_id = isset($input['provider_id']) ? (int)$input['provider_id'] : 2;
    $provider_name = isset($input['provider_name']) ? trim($input['provider_name']) : 'Educational Provider';
    $location = isset($input['location']) ? trim($input['location']) : 'Online';
    $mode = isset($input['mode']) ? trim($input['mode']) : 'Remote';
    $type = isset($input['type']) ? trim($input['type']) : 'Course';
    $stipend_or_fee = isset($input['stipend_or_fee']) ? trim($input['stipend_or_fee']) : 'Free';
    $deadline = isset($input['deadline']) ? trim($input['deadline']) : date('Y-m-d', strtotime('+3 months'));
    $requirements = isset($input['requirements']) ? trim($input['requirements']) : '';
    $spots = isset($input['spots']) ? (int)$input['spots'] : 25;
    $image = isset($input['image']) && !empty($input['image']) 
        ? trim($input['image']) 
        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
    $status = isset($input['status']) ? trim($input['status']) : 'active';

    if (empty($title) || empty($description)) {
        jsonError('Title and description are required fields.', 422);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `opportunities` (
            `title`, `description`, `category_id`, `provider_id`, `provider_name`,
            `location`, `mode`, `type`, `stipend_or_fee`, `deadline`,
            `requirements`, `spots`, `image`, `status`, `created_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    try {
        $stmt->execute([
            $title, $description, $category_id, $provider_id, $provider_name,
            $location, $mode, $type, $stipend_or_fee, $deadline,
            $requirements, $spots, $image, $status
        ]);

        $newId = (int)$pdo->lastInsertId();

        $getStmt = $pdo->prepare("SELECT * FROM `opportunities` WHERE `id` = ?");
        $getStmt->execute([$newId]);
        $newRecord = $getStmt->fetch();

        jsonResponse($newRecord, 'Opportunity created successfully.', 201);
    } catch (PDOException $e) {
        jsonError('Failed to create opportunity: ' . $e->getMessage(), 500);
    }
}

// ---------------------------------------------------------------------
// 3. PUT / PATCH: Update Opportunity
// ---------------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $input = getJsonInput();

    if ($id <= 0 && isset($input['id'])) {
        $id = (int)$input['id'];
    }

    if ($id <= 0) {
        jsonError('Opportunity ID is required for update.', 400);
    }

    // Verify existence
    $check = $pdo->prepare("SELECT `id` FROM `opportunities` WHERE `id` = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        jsonError('Opportunity not found.', 404);
    }

    $allowedFields = [
        'title', 'description', 'category_id', 'provider_name',
        'location', 'mode', 'type', 'stipend_or_fee', 'deadline',
        'requirements', 'spots', 'image', 'status'
    ];

    $updates = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = "`{$field}` = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        jsonError('No valid fields provided to update.', 400);
    }

    $params[] = $id;
    $sql = "UPDATE `opportunities` SET " . implode(', ', $updates) . " WHERE `id` = ?";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $getStmt = $pdo->prepare("SELECT * FROM `opportunities` WHERE `id` = ?");
        $getStmt->execute([$id]);
        $updated = $getStmt->fetch();

        jsonResponse($updated, 'Opportunity updated successfully.');
    } catch (PDOException $e) {
        jsonError('Failed to update opportunity: ' . $e->getMessage(), 500);
    }
}

// ---------------------------------------------------------------------
// 4. DELETE: Remove Opportunity
// ---------------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        $input = getJsonInput();
        $id = isset($input['id']) ? (int)$input['id'] : 0;
    }

    if ($id <= 0) {
        jsonError('Opportunity ID is required for deletion.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM `opportunities` WHERE `id` = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Opportunity not found or already deleted.', 404);
    }

    jsonResponse(null, 'Opportunity deleted successfully.');
}

jsonError('Method not supported.', 405);
