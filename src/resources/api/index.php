<?php
/**
 * Course Resources API
 *
 * RESTful API for CRUD operations on course resources and their comments.
 * Uses PDO to interact with a MySQL database.
 *
 * Database Table Structures (for reference):
 *
 * Table: resources
 * Columns:
 *   - id          (INT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
 *   - title       (VARCHAR(255), NOT NULL)
 *   - description (TEXT, nullable)
 *   - link        (VARCHAR(500), NOT NULL)
 *   - created_at  (TIMESTAMP)
 *
 * Table: comments_resource
 * Columns:
 *   - id          (INT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
 *   - resource_id (INT UNSIGNED, FOREIGN KEY references resources.id, CASCADE DELETE)
 *   - author      (VARCHAR(100), NOT NULL)
 *   - text        (TEXT, NOT NULL)
 *   - created_at  (TIMESTAMP)
 *
 * HTTP Methods Supported:
 *   - GET:    Retrieve resource(s) or comment(s)
 *   - POST:   Create a new resource or comment
 *   - PUT:    Update an existing resource
 *   - DELETE: Delete a resource (associated comments removed by CASCADE)
 *
 * Response Format: JSON
 * All responses follow the structure:
 *   { "success": true,  "data": ...    }  (on success)
 *   { "success": false, "message": ... }  (on error)
 *
 * API Endpoints:
 *
 *   Resources:
 *     GET    ./api/index.php                              - Get all resources
 *     GET    ./api/index.php?id={id}                      - Get single resource by ID
 *     POST   ./api/index.php                              - Create new resource
 *     PUT    ./api/index.php                              - Update resource
 *     DELETE ./api/index.php?id={id}                      - Delete resource
 *
 *   Comments:
 *     GET    ./api/index.php?resource_id={id}&action=comments  - Get all comments for a resource
 *     POST   ./api/index.php?action=comment                    - Create a new comment
 *     DELETE ./api/index.php?comment_id={id}&action=delete_comment - Delete a single comment
 *
 * Query Parameters for GET all resources:
 *   - search: Optional. Filter resources by title or description using LIKE.
 *   - sort:   Optional. Sort field — allowed values: title, created_at (default: created_at).
 *   - order:  Optional. Sort direction — allowed values: asc, desc (default: desc).
 */

// --- Headers ---
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Database ---
require_once __DIR__ . '/../../common/db.php';
$db = getDBConnection();

// --- Request Info ---
$method     = $_SERVER['REQUEST_METHOD'];
$rawData    = file_get_contents('php://input');
$data       = json_decode($rawData, true) ?? [];
$id         = $_GET['id']          ?? null;
$resourceId = $_GET['resource_id'] ?? null;
$commentId  = $_GET['comment_id']  ?? null;
$action     = $_GET['action']      ?? null;


// ============================================================================
// RESOURCE FUNCTIONS
// ============================================================================

function getAllResources($db) {
    $sql    = 'SELECT id, title, description, link, created_at FROM resources';
    $params = [];

    if (!empty($_GET['search'])) {
        $sql .= ' WHERE title LIKE :search OR description LIKE :search';
        $params[':search'] = '%' . $_GET['search'] . '%';
    }

    $allowedSort = ['title', 'created_at'];
    $sort  = (isset($_GET['sort']) && in_array($_GET['sort'], $allowedSort)) ? $_GET['sort'] : 'created_at';
    $order = (isset($_GET['order']) && strtolower($_GET['order']) === 'asc') ? 'ASC' : 'DESC';
    $sql  .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse($resources);
}

function getResourceById($db, $id) {
    if (!$id || !is_numeric($id)) {
        sendResponse('Invalid resource ID.', 400);
    }

    $stmt = $db->prepare('SELECT id, title, description, link, created_at FROM resources WHERE id = ?');
    $stmt->execute([(int)$id]);
    $resource = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resource) {
        sendResponse('Resource not found.', 404);
    }

    sendResponse($resource);
}

function createResource($db, $data) {
    if (empty($data['title']) || empty($data['link'])) {
        sendResponse('title and link are required.', 400);
    }

    $title       = sanitizeInput($data['title']);
    $description = sanitizeInput($data['description'] ?? '');
    $link        = trim($data['link']);

    if (!filter_var($link, FILTER_VALIDATE_URL)) {
        sendResponse('Invalid URL for link.', 400);
    }

    $stmt = $db->prepare('INSERT INTO resources (title, description, link) VALUES (?, ?, ?)');
    $stmt->execute([$title, $description, $link]);

    if ($stmt->rowCount() > 0) {
        sendResponse(['id' => (int)$db->lastInsertId()], 201);
    } else {
        sendResponse('Failed to create resource.', 500);
    }
}

function updateResource($db, $data) {
    if (empty($data['id'])) {
        sendResponse('Resource ID is required.', 400);
    }

    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([(int)$data['id']]);
    if (!$check->fetch()) {
        sendResponse('Resource not found.', 404);
    }

    $setClauses = [];
    $params     = [];

    if (isset($data['title']) && $data['title'] !== '') {
        $setClauses[] = 'title = ?';
        $params[]     = sanitizeInput($data['title']);
    }
    if (isset($data['description'])) {
        $setClauses[] = 'description = ?';
        $params[]     = sanitizeInput($data['description']);
    }
    if (isset($data['link']) && $data['link'] !== '') {
        if (!filter_var($data['link'], FILTER_VALIDATE_URL)) {
            sendResponse('Invalid URL for link.', 400);
        }
        $setClauses[] = 'link = ?';
        $params[]     = trim($data['link']);
    }

    if (empty($setClauses)) {
        sendResponse('No updatable fields provided.', 400);
    }

    $params[] = (int)$data['id'];
    $stmt = $db->prepare('UPDATE resources SET ' . implode(', ', $setClauses) . ' WHERE id = ?');
    $stmt->execute($params);

    sendResponse('Resource updated successfully.');
}

function deleteResource($db, $id) {
    if (!$id || !is_numeric($id)) {
        sendResponse('Invalid resource ID.', 400);
    }

    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([(int)$id]);
    if (!$check->fetch()) {
        sendResponse('Resource not found.', 404);
    }

    $stmt = $db->prepare('DELETE FROM resources WHERE id = ?');
    $stmt->execute([(int)$id]);

    if ($stmt->rowCount() > 0) {
        sendResponse('Resource deleted successfully.');
    } else {
        sendResponse('Failed to delete resource.', 500);
    }
}


// ============================================================================
// COMMENT FUNCTIONS
// ============================================================================

function getCommentsByResource($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse('Invalid resource ID.', 400);
    }

    $stmt = $db->prepare('SELECT id, resource_id, author, text, created_at FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC');
    $stmt->execute([(int)$resourceId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse($comments);
}

function createComment($db, $data) {
    if (empty($data['resource_id']) || empty(trim($data['author'] ?? '')) || empty(trim($data['text'] ?? ''))) {
        sendResponse('resource_id, author, and text are required.', 400);
    }

    if (!is_numeric($data['resource_id'])) {
        sendResponse('Invalid resource ID.', 400);
    }

    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([(int)$data['resource_id']]);
    if (!$check->fetch()) {
        sendResponse('Resource not found.', 404);
    }

    $author = sanitizeInput($data['author']);
    $text   = sanitizeInput($data['text']);

    $stmt = $db->prepare('INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)');
    $stmt->execute([(int)$data['resource_id'], $author, $text]);

    if ($stmt->rowCount() > 0) {
        $newId   = (int)$db->lastInsertId();
        $comment = [
            'id'          => $newId,
            'resource_id' => (int)$data['resource_id'],
            'author'      => $author,
            'text'        => $text,
            'created_at'  => date('Y-m-d H:i:s'),
        ];
        sendResponse($comment, 201);
    } else {
        sendResponse('Failed to create comment.', 500);
    }
}

function deleteComment($db, $commentId) {
    if (!$commentId || !is_numeric($commentId)) {
        sendResponse('Invalid comment ID.', 400);
    }

    $check = $db->prepare('SELECT id FROM comments_resource WHERE id = ?');
    $check->execute([(int)$commentId]);
    if (!$check->fetch()) {
        sendResponse('Comment not found.', 404);
    }

    $stmt = $db->prepare('DELETE FROM comments_resource WHERE id = ?');
    $stmt->execute([(int)$commentId]);

    if ($stmt->rowCount() > 0) {
        sendResponse('Comment deleted successfully.');
    } else {
        sendResponse('Failed to delete comment.', 500);
    }
}


// ============================================================================
// MAIN REQUEST ROUTER
// ============================================================================

try {

    if ($method === 'GET') {
        if ($action === 'comments') {
            getCommentsByResource($db, $resourceId);
        } elseif ($id !== null) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }

    } elseif ($method === 'POST') {
        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }

    } elseif ($method === 'PUT') {
        updateResource($db, $data);

    } elseif ($method === 'DELETE') {
        if ($action === 'delete_comment') {
            deleteComment($db, $commentId);
        } else {
            deleteResource($db, $id);
        }

    } else {
        sendResponse('Method not allowed.', 405);
    }

} catch (PDOException $e) {
    error_log('PDOException in resources/api/index.php: ' . $e->getMessage());
    sendResponse('A database error occurred.', 500);

} catch (Exception $e) {
    error_log('Exception in resources/api/index.php: ' . $e->getMessage());
    sendResponse('An unexpected error occurred.', 500);
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    if ($statusCode < 400) {
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => $data]);
    }
    exit;
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}