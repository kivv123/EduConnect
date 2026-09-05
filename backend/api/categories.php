<?php
/**
 * EduConnect - Opportunity Categories REST API
 * 
 * Endpoint: GET /backend/api/categories.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = getDbConnection();

$stmt = $pdo->query("SELECT * FROM `categories` ORDER BY `id` ASC");
jsonResponse($stmt->fetchAll());
