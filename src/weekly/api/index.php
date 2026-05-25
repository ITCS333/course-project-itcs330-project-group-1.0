<?php
/**
 * Weekly Course Breakdown API
 * Tables: weeks, comments_week
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
$action    = $_GET['action']    ?? null;
$id        = $_GET['id']        ?? null;
$weekId    = $_GET['week_id']   ?? null;
$commentId = $_GET['comment_id']?? null;

// ── WEEKS ─────────────────────────────────────────────────────────────────────

function getAllWeeks(PDO $db): void {
    $sql='SELECT id,title,start_date,description,links,created_at FROM weeks';
    $params=[];
    if (!empty($_GET['search'])) {
        $sql.=' WHERE title LIKE :search OR description LIKE :search';
        $params[':search']='%'.$_GET['search'].'%';
    }
    $allowed=['title','start_date'];
    $sort=(isset($_GET['sort'])&&in_array($_GET['sort'],$allowed))?$_GET['sort']:'start_date';
    $order=(isset($_GET['order'])&&strtolower($_GET['order'])==='desc')?'DESC':'ASC';
    $sql.=" ORDER BY $sort $order";
    $stmt=$db->prepare($sql);
    foreach ($params as $k=>$v) $stmt->bindValue($k,$v);
    $stmt->execute();
    $rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) $r['links']=json_decode($r['links'],true)??[];
    sendResponse(['success'=>true,'data'=>$rows]);
}

function getWeekById(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid week ID.'],400);
    $stmt=$db->prepare('SELECT id,title,start_date,description,links,created_at FROM weeks WHERE id=?');
    $stmt->execute([(int)$id]);
    $w=$stmt->fetch(PDO::FETCH_ASSOC);
    if (!$w) sendResponse(['success'=>false,'message'=>'Week not found.'],404);
    $w['links']=json_decode($w['links'],true)??[];
    sendResponse(['success'=>true,'data'=>$w]);
}

function createWeek(PDO $db, array $data): void {
    if (empty($data['title'])||empty($data['start_date'])) sendResponse(['success'=>false,'message'=>'title and start_date required.'],400);
    $title=sanitizeInput($data['title']); $sd=trim($data['start_date']);
    if (!validateDate($sd)) sendResponse(['success'=>false,'message'=>'start_date must be YYYY-MM-DD.'],400);
    $desc=sanitizeInput($data['description']??'');
    $links=(isset($data['links'])&&is_array($data['links']))?json_encode($data['links']):json_encode([]);
    $stmt=$db->prepare('INSERT INTO weeks (title,start_date,description,links) VALUES (?,?,?,?)');
    $stmt->execute([$title,$sd,$desc,$links]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        sendResponse(['success'=>true,'id'=>$newId,'data'=>['id'=>$newId]],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create week.'],500);
}

function updateWeek(PDO $db, array $data): void {
    if (empty($data['id'])||!is_numeric($data['id'])) sendResponse(['success'=>false,'message'=>'Week ID required.'],400);
    $chk=$db->prepare('SELECT id FROM weeks WHERE id=?'); $chk->execute([(int)$data['id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Week not found.'],404);
    $set=[]; $p=[];
    if (!empty($data['title']))       { $set[]='title=?';       $p[]=sanitizeInput($data['title']); }
    if (!empty($data['start_date']))  {
        if (!validateDate($data['start_date'])) sendResponse(['success'=>false,'message'=>'Invalid date.'],400);
        $set[]='start_date=?'; $p[]=trim($data['start_date']);
    }
    if (isset($data['description']))  { $set[]='description=?'; $p[]=sanitizeInput($data['description']); }
    if (isset($data['links'])&&is_array($data['links'])) { $set[]='links=?'; $p[]=json_encode($data['links']); }
    if (empty($set)) sendResponse(['success'=>false,'message'=>'No fields to update.'],400);
    $p[]=(int)$data['id'];
    $db->prepare('UPDATE weeks SET '.implode(',',$set).' WHERE id=?')->execute($p);
    sendResponse(['success'=>true,'message'=>'Week updated.']);
}

function deleteWeek(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid week ID.'],400);
    $chk=$db->prepare('SELECT id FROM weeks WHERE id=?'); $chk->execute([(int)$id]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Week not found.'],404);
    $stmt=$db->prepare('DELETE FROM weeks WHERE id=?'); $stmt->execute([(int)$id]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Week deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete week.'],500);
}

// ── COMMENTS ──────────────────────────────────────────────────────────────────

function getCommentsByWeek(PDO $db, $wid): void {
    if (!$wid||!is_numeric($wid)) sendResponse(['success'=>false,'message'=>'Invalid week ID.'],400);
    $stmt=$db->prepare('SELECT id,week_id,author,text,created_at FROM comments_week WHERE week_id=? ORDER BY created_at ASC');
    $stmt->execute([(int)$wid]);
    sendResponse(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment(PDO $db, array $data): void {
    if (empty($data['week_id'])||empty(trim($data['author']??''))||empty(trim($data['text']??'')))
        sendResponse(['success'=>false,'message'=>'week_id, author, and text required.'],400);
    if (!is_numeric($data['week_id'])) sendResponse(['success'=>false,'message'=>'Invalid week ID.'],400);
    $chk=$db->prepare('SELECT id FROM weeks WHERE id=?'); $chk->execute([(int)$data['week_id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Week not found.'],404);
    $author=sanitizeInput($data['author']); $text=sanitizeInput($data['text']);
    $stmt=$db->prepare('INSERT INTO comments_week (week_id,author,text) VALUES (?,?,?)');
    $stmt->execute([(int)$data['week_id'],$author,$text]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        $comment=['id'=>$newId,'week_id'=>(int)$data['week_id'],'author'=>$author,'text'=>$text,'created_at'=>date('Y-m-d H:i:s')];
        sendResponse(['success'=>true,'id'=>$newId,'data'=>$comment],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create comment.'],500);
}

function deleteComment(PDO $db, $cid): void {
    if (!$cid||!is_numeric($cid)) sendResponse(['success'=>false,'message'=>'Invalid comment ID.'],400);
    $chk=$db->prepare('SELECT id FROM comments_week WHERE id=?'); $chk->execute([(int)$cid]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Comment not found.'],404);
    $stmt=$db->prepare('DELETE FROM comments_week WHERE id=?'); $stmt->execute([(int)$cid]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Comment deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete comment.'],500);
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
try {
    if ($method==='GET') {
        if ($action==='comments')       getCommentsByWeek($db,$weekId);
        elseif ($id!==null)             getWeekById($db,$id);
        else                            getAllWeeks($db);
    } elseif ($method==='POST') {
        if ($action==='comment')        createComment($db,$data);
        else                            createWeek($db,$data);
    } elseif ($method==='PUT')          { updateWeek($db,$data); }
    elseif ($method==='DELETE') {
        if ($action==='delete_comment') deleteComment($db,$commentId);
        else                            deleteWeek($db,$id);
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