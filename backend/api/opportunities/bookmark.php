<?php
// backend/api/opportunities/bookmark.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to save bookmarks.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return all bookmarks for this user
    $stmt = $pdo->prepare("
        SELECT b.id AS bookmark_id, b.created_at AS bookmarked_at,
               o.*, c.name AS category_name, p.name AS provider_name, u.name AS university_name
        FROM saved_bookmarks b
        JOIN opportunities o ON b.opportunity_id = o.id
        JOIN categories c ON o.category_id = c.id
        JOIN providers p ON o.provider_id = p.id
        LEFT JOIN universities u ON o.university_id = u.id
        WHERE b.user_id = :uid
        ORDER BY b.created_at DESC
    ");
    $stmt->execute(['uid' => $authUser['id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();
    $oppId = (int)($input['opportunity_id'] ?? 0);
    if (!$oppId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Opportunity ID is required.']);
        exit();
    }

    // Toggle bookmark
    $chk = $pdo->prepare("SELECT id FROM saved_bookmarks WHERE user_id = :uid AND opportunity_id = :oid LIMIT 1");
    $chk->execute(['uid' => $authUser['id'], 'oid' => $oppId]);
    $existing = $chk->fetch();

    if ($existing) {
        $del = $pdo->prepare("DELETE FROM saved_bookmarks WHERE id = :id");
        $del->execute(['id' => $existing['id']]);
        echo json_encode(['success' => true, 'bookmarked' => false, 'message' => 'Bookmark removed.']);
    } else {
        $ins = $pdo->prepare("INSERT INTO saved_bookmarks (user_id, opportunity_id, created_at) VALUES (:uid, :oid, NOW())");
        $ins->execute(['uid' => $authUser['id'], 'oid' => $oppId]);
        echo json_encode(['success' => true, 'bookmarked' => true, 'message' => 'Opportunity saved to bookmarks.']);
    }
    exit();
}
