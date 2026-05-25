<?php
/**
 * Assignments API
 * Tables: assignments, comments_assignment
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD']==='OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../../common/db.php';
$db     = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$raw    = file_get_contents('php://input');
$data   = json_decode($raw, true) ?? [];
$action       = $_GET['action']        ?? null;
$id           = $_GET['id']            ?? null;
$assignmentId = $_GET['assignment_id'] ?? null;
$commentId    = $_GET['comment_id']    ?? null;

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────────

function getAllAssignments(PDO $db): void {
    $sql='SELECT id,title,description,due_date,files,created_at,updated_at FROM assignments';
    $params=[];
    if (!empty($_GET['search'])) {
        $sql.=' WHERE title LIKE :search OR description LIKE :search';
        $params[':search']='%'.$_GET['search'].'%';
    }
    $allowed=['title','due_date','created_at'];
    $sort=(isset($_GET['sort'])&&in_array($_GET['sort'],$allowed))?$_GET['sort']:'due_date';
    $order=(isset($_GET['order'])&&strtolower($_GET['order'])==='desc')?'DESC':'ASC';
    $sql.=" ORDER BY $sort $order";
    $stmt=$db->prepare($sql);
    foreach ($params as $k=>$v) $stmt->bindValue($k,$v);
    $stmt->execute();
    $rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) $r['files']=json_decode($r['files'],true)??[];
    sendResponse(['success'=>true,'data'=>$rows]);
}

function getAssignmentById(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid assignment ID.'],400);
    $stmt=$db->prepare('SELECT id,title,description,due_date,files,created_at,updated_at FROM assignments WHERE id=?');
    $stmt->execute([(int)$id]);
    $a=$stmt->fetch(PDO::FETCH_ASSOC);
    if (!$a) sendResponse(['success'=>false,'message'=>'Assignment not found.'],404);
    $a['files']=json_decode($a['files'],true)??[];
    sendResponse(['success'=>true,'data'=>$a]);
}

function createAssignment(PDO $db, array $data): void {
    if (empty($data['title'])||empty($data['description'])||empty($data['due_date']))
        sendResponse(['success'=>false,'message'=>'title, description, and due_date required.'],400);
    $title=sanitizeInput($data['title']); $desc=sanitizeInput($data['description']); $dd=trim($data['due_date']);
    if (!validateDate($dd)) sendResponse(['success'=>false,'message'=>'due_date must be YYYY-MM-DD.'],400);
    $files=(isset($data['files'])&&is_array($data['files']))?json_encode($data['files']):json_encode([]);
    $stmt=$db->prepare('INSERT INTO assignments (title,description,due_date,files) VALUES (?,?,?,?)');
    $stmt->execute([$title,$desc,$dd,$files]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        sendResponse(['success'=>true,'id'=>$newId,'data'=>['id'=>$newId]],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create assignment.'],500);
}

function updateAssignment(PDO $db, array $data): void {
    if (empty($data['id'])||!is_numeric($data['id'])) sendResponse(['success'=>false,'message'=>'Assignment ID required.'],400);
    $chk=$db->prepare('SELECT id FROM assignments WHERE id=?'); $chk->execute([(int)$data['id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Assignment not found.'],404);
    $set=[]; $p=[];
    if (!empty($data['title']))       { $set[]='title=?';       $p[]=sanitizeInput($data['title']); }
    if (!empty($data['description'])) { $set[]='description=?'; $p[]=sanitizeInput($data['description']); }
    if (!empty($data['due_date']))    {
        if (!validateDate($data['due_date'])) sendResponse(['success'=>false,'message'=>'Invalid date.'],400);
        $set[]='due_date=?'; $p[]=trim($data['due_date']);
    }
    if (isset($data['files'])&&is_array($data['files'])) { $set[]='files=?'; $p[]=json_encode($data['files']); }
    if (empty($set)) sendResponse(['success'=>false,'message'=>'No fields to update.'],400);
    $p[]=(int)$data['id'];
    $db->prepare('UPDATE assignments SET '.implode(',',$set).' WHERE id=?')->execute($p);
    sendResponse(['success'=>true,'message'=>'Assignment updated.']);
}

function deleteAssignment(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid assignment ID.'],400);
    $chk=$db->prepare('SELECT id FROM assignments WHERE id=?'); $chk->execute([(int)$id]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Assignment not found.'],404);
    $stmt=$db->prepare('DELETE FROM assignments WHERE id=?'); $stmt->execute([(int)$id]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Assignment deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete assignment.'],500);
}

// ── COMMENTS ──────────────────────────────────────────────────────────────────

function getCommentsByAssignment(PDO $db, $aid): void {
    if (!$aid||!is_numeric($aid)) sendResponse(['success'=>false,'message'=>'Invalid assignment ID.'],400);
    $stmt=$db->prepare('SELECT id,assignment_id,author,text,created_at FROM comments_assignment WHERE assignment_id=? ORDER BY created_at ASC');
    $stmt->execute([(int)$aid]);
    sendResponse(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment(PDO $db, array $data): void {
    if (empty($data['assignment_id'])||empty(trim($data['author']??''))||empty(trim($data['text']??'')))
        sendResponse(['success'=>false,'message'=>'assignment_id, author, and text required.'],400);
    if (!is_numeric($data['assignment_id'])) sendResponse(['success'=>false,'message'=>'Invalid assignment ID.'],400);
    $chk=$db->prepare('SELECT id FROM assignments WHERE id=?'); $chk->execute([(int)$data['assignment_id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Assignment not found.'],404);
    $author=sanitizeInput($data['author']); $text=sanitizeInput($data['text']);
    $stmt=$db->prepare('INSERT INTO comments_assignment (assignment_id,author,text) VALUES (?,?,?)');
    $stmt->execute([(int)$data['assignment_id'],$author,$text]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        $comment=['id'=>$newId,'assignment_id'=>(int)$data['assignment_id'],'author'=>$author,'text'=>$text,'created_at'=>date('Y-m-d H:i:s')];
        sendResponse(['success'=>true,'id'=>$newId,'data'=>$comment],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create comment.'],500);
}

function deleteComment(PDO $db, $cid): void {
    if (!$cid||!is_numeric($cid)) sendResponse(['success'=>false,'message'=>'Invalid comment ID.'],400);
    $chk=$db->prepare('SELECT id FROM comments_assignment WHERE id=?'); $chk->execute([(int)$cid]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Comment not found.'],404);
    $stmt=$db->prepare('DELETE FROM comments_assignment WHERE id=?'); $stmt->execute([(int)$cid]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Comment deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete comment.'],500);
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
try {
    if ($method==='GET') {
        if ($action==='comments')       getCommentsByAssignment($db,$assignmentId);
        elseif ($id!==null)             getAssignmentById($db,$id);
        else                            getAllAssignments($db);
    } elseif ($method==='POST') {
        if ($action==='comment')        createComment($db,$data);
        else                            createAssignment($db,$data);
    } elseif ($method==='PUT')          { updateAssignment($db,$data); }
    elseif ($method==='DELETE') {
        if ($action==='delete_comment') deleteComment($db,$commentId);
        else                            deleteAssignment($db,$id);
    } else sendResponse(['success'=>false,'message'=>'Method not allowed.'],405);
} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse(['success'=>false,'message'=>'A database error occurred.'],500);
} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success'=>false,'message'=>'An unexpected error occurred.'],500);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function sendResponse(array $data, int $statusCode=200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}
function validateDate(string $date): bool {
    $d=DateTime::createFromFormat('Y-m-d',$date);
    return $d&&$d->format('Y-m-d')===$date;
}
function sanitizeInput(string $data): string {
    return htmlspecialchars(strip_tags(trim($data)),ENT_QUOTES,'UTF-8');
}