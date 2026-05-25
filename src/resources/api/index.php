<?php
/**
 * Course Resources API
 * Tables: resources, comments_resource
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../common/db.php';
$db     = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$raw    = file_get_contents('php://input');
$data   = json_decode($raw, true) ?? [];
$id         = $_GET['id']          ?? null;
$resourceId = $_GET['resource_id'] ?? null;
$commentId  = $_GET['comment_id']  ?? null;
$action     = $_GET['action']      ?? null;

// ── RESOURCES ────────────────────────────────────────────────────────────────

function getAllResources(PDO $db): void {
    $sql = 'SELECT id, title, description, link, created_at FROM resources';
    $params = [];
    if (!empty($_GET['search'])) {
        $sql .= ' WHERE title LIKE :search OR description LIKE :search';
        $params[':search'] = '%' . $_GET['search'] . '%';
    }
    $allowed = ['title','created_at'];
    $sort  = (isset($_GET['sort']) && in_array($_GET['sort'],$allowed)) ? $_GET['sort'] : 'created_at';
    $order = (isset($_GET['order']) && strtolower($_GET['order'])==='asc') ? 'ASC' : 'DESC';
    $sql  .= " ORDER BY $sort $order";
    $stmt  = $db->prepare($sql);
    foreach ($params as $k=>$v) $stmt->bindValue($k,$v);
    $stmt->execute();
    sendResponse(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getResourceById(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid resource ID.'],400);
    $stmt = $db->prepare('SELECT id,title,description,link,created_at FROM resources WHERE id=?');
    $stmt->execute([(int)$id]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$r) sendResponse(['success'=>false,'message'=>'Resource not found.'],404);
    sendResponse(['success'=>true,'data'=>$r]);
}

function createResource(PDO $db, array $data): void {
    if (empty($data['title'])||empty($data['link'])) sendResponse(['success'=>false,'message'=>'title and link are required.'],400);
    $title = sanitizeInput($data['title']);
    $desc  = sanitizeInput($data['description']??'');
    $link  = trim($data['link']);
    if (!filter_var($link,FILTER_VALIDATE_URL)) sendResponse(['success'=>false,'message'=>'Invalid URL.'],400);
    $stmt = $db->prepare('INSERT INTO resources (title,description,link) VALUES (?,?,?)');
    $stmt->execute([$title,$desc,$link]);
    if ($stmt->rowCount()>0) {
        $newId = (int)$db->lastInsertId();
        sendResponse(['success'=>true,'id'=>$newId,'data'=>['id'=>$newId]],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create resource.'],500);
}

function updateResource(PDO $db, array $data): void {
    if (empty($data['id'])) sendResponse(['success'=>false,'message'=>'Resource ID required.'],400);
    $chk = $db->prepare('SELECT id FROM resources WHERE id=?');
    $chk->execute([(int)$data['id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Resource not found.'],404);
    $set=[]; $p=[];
    if (!empty($data['title']))       { $set[]='title=?';       $p[]=sanitizeInput($data['title']); }
    if (isset($data['description']))  { $set[]='description=?'; $p[]=sanitizeInput($data['description']); }
    if (!empty($data['link']))        {
        if (!filter_var($data['link'],FILTER_VALIDATE_URL)) sendResponse(['success'=>false,'message'=>'Invalid URL.'],400);
        $set[]='link=?'; $p[]=trim($data['link']);
    }
    if (empty($set)) sendResponse(['success'=>false,'message'=>'No fields to update.'],400);
    $p[]=(int)$data['id'];
    $db->prepare('UPDATE resources SET '.implode(',',$set).' WHERE id=?')->execute($p);
    sendResponse(['success'=>true,'message'=>'Resource updated.']);
}

function deleteResource(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid resource ID.'],400);
    $chk=$db->prepare('SELECT id FROM resources WHERE id=?'); $chk->execute([(int)$id]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Resource not found.'],404);
    $stmt=$db->prepare('DELETE FROM resources WHERE id=?'); $stmt->execute([(int)$id]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Resource deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete resource.'],500);
}

// ── COMMENTS ─────────────────────────────────────────────────────────────────

function getCommentsByResource(PDO $db, $rid): void {
    if (!$rid||!is_numeric($rid)) sendResponse(['success'=>false,'message'=>'Invalid resource ID.'],400);
    $stmt=$db->prepare('SELECT id,resource_id,author,text,created_at FROM comments_resource WHERE resource_id=? ORDER BY created_at ASC');
    $stmt->execute([(int)$rid]);
    sendResponse(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment(PDO $db, array $data): void {
    if (empty($data['resource_id'])||empty(trim($data['author']??''))||empty(trim($data['text']??'')))
        sendResponse(['success'=>false,'message'=>'resource_id, author, and text required.'],400);
    if (!is_numeric($data['resource_id'])) sendResponse(['success'=>false,'message'=>'Invalid resource ID.'],400);
    $chk=$db->prepare('SELECT id FROM resources WHERE id=?'); $chk->execute([(int)$data['resource_id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Resource not found.'],404);
    $author=sanitizeInput($data['author']); $text=sanitizeInput($data['text']);
    $stmt=$db->prepare('INSERT INTO comments_resource (resource_id,author,text) VALUES (?,?,?)');
    $stmt->execute([(int)$data['resource_id'],$author,$text]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        $comment=['id'=>$newId,'resource_id'=>(int)$data['resource_id'],'author'=>$author,'text'=>$text,'created_at'=>date('Y-m-d H:i:s')];
        sendResponse(['success'=>true,'id'=>$newId,'data'=>$comment],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create comment.'],500);
}

function deleteComment(PDO $db, $cid): void {
    if (!$cid||!is_numeric($cid)) sendResponse(['success'=>false,'message'=>'Invalid comment ID.'],400);
    $chk=$db->prepare('SELECT id FROM comments_resource WHERE id=?'); $chk->execute([(int)$cid]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Comment not found.'],404);
    $stmt=$db->prepare('DELETE FROM comments_resource WHERE id=?'); $stmt->execute([(int)$cid]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Comment deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete comment.'],500);
}

// ── ROUTER ───────────────────────────────────────────────────────────────────
try {
    if ($method==='GET') {
        if ($action==='comments')      getCommentsByResource($db,$resourceId);
        elseif ($id!==null)            getResourceById($db,$id);
        else                           getAllResources($db);
    } elseif ($method==='POST') {
        if ($action==='comment')       createComment($db,$data);
        else                           createResource($db,$data);
    } elseif ($method==='PUT')         { updateResource($db,$data); }
    elseif ($method==='DELETE') {
        if ($action==='delete_comment') deleteComment($db,$commentId);
        else                            deleteResource($db,$id);
    } else sendResponse(['success'=>false,'message'=>'Method not allowed.'],405);
} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse(['success'=>false,'message'=>'A database error occurred.'],500);
} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success'=>false,'message'=>'An unexpected error occurred.'],500);
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function sendResponse(array $data, int $statusCode=200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}
function sanitizeInput(string $data): string {
    return htmlspecialchars(strip_tags(trim($data)),ENT_QUOTES,'UTF-8');
}