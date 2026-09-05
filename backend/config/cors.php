<?php
/**
 * EduConnect - CORS & API Helper Utilities
 * 
 * Sets universal CORS headers to allow cross-origin requests from
 * frontend dev servers, file:// protocols, or localhost ports.
 */

// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache preflight for 1 day
} else {
    header('Access-Control-Allow-Origin: *');
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    } else {
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }
    http_response_code(200);
    exit(0);
}

header('Content-Type: application/json; charset=UTF-8');

/**
 * Parses incoming JSON payload or falls back to $_POST / $_REQUEST.
 * @return array
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $data = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            return $data;
        }
    }
    return !empty($_POST) ? $_POST : $_REQUEST;
}

/**
 * Outputs a success JSON response and terminates execution.
 * @param mixed $data
 * @param string|null $message
 * @param int $code
 */
function jsonResponse($data = null, $message = null, $code = 200) {
    http_response_code($code);
    $response = ['success' => true];
    if ($message !== null) {
        $response['message'] = $message;
    }
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Outputs an error JSON response and terminates execution.
 * @param string $message
 * @param int $code
 * @param mixed $extra
 */
function jsonError($message, $code = 400, $extra = null) {
    http_response_code($code);
    $response = [
        'success' => false,
        'message' => $message
    ];
    if ($extra !== null) {
        $response['errors'] = $extra;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
