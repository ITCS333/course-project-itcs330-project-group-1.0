<?php
/**
 * Discussion Board API
 * Tables: topics, replies
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
$action  = $_GET['action']   ?? null;
$id      = $_GET['id']       ?? null;
$topicId = $_GET['topic_id'] ?? null;

// ── TOPICS ────────────────────────────────────────────────────────────────────

function getAllTopics(PDO $db): void {
    $sql='SELECT id,subject,message,author,created_at FROM topics';
    $params=[];
    if (!empty($_GET['search'])) {
        $sql.=' WHERE subject LIKE :search OR message LIKE :search OR author LIKE :search';
        $params[':search']='%'.$_GET['search'].'%';
    }
    $allowed=['subject','author','created_at'];
    $sort=(isset($_GET['sort'])&&in_array($_GET['sort'],$allowed))?$_GET['sort']:'created_at';
    $order=(isset($_GET['order'])&&strtolower($_GET['order'])==='asc')?'ASC':'DESC';
    $sql.=" ORDER BY $sort $order";
    $stmt=$db->prepare($sql);
    foreach ($params as $k=>$v) $stmt->bindValue($k,$v);
    $stmt->execute();
    sendResponse(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getTopicById(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid topic ID.'],400);
    $stmt=$db->prepare('SELECT id,subject,message,author,created_at FROM topics WHERE id=?');
    $stmt->execute([(int)$id]);
    $t=$stmt->fetch(PDO::FETCH_ASSOC);
    if (!$t) sendResponse(['success'=>false,'message'=>'Topic not found.'],404);
    sendResponse(['success'=>true,'data'=>$t]);
}

function createTopic(PDO $db, array $data): void {
    if (empty(trim($data['subject']??''))||empty(trim($data['message']??''))||empty(trim($data['author']??'')))
        sendResponse(['success'=>false,'message'=>'subject, message, and author required.'],400);
    $subject=sanitizeInput($data['subject']); $message=sanitizeInput($data['message']); $author=sanitizeInput($data['author']);
    $stmt=$db->prepare('INSERT INTO topics (subject,message,author) VALUES (?,?,?)');
    $stmt->execute([$subject,$message,$author]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        $topic=['id'=>$newId,'subject'=>$subject,'message'=>$message,'author'=>$author,'created_at'=>date('Y-m-d H:i:s')];
        sendResponse(['success'=>true,'id'=>$newId,'data'=>$topic],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create topic.'],500);
}

function updateTopic(PDO $db, array $data): void {
    if (empty($data['id'])||!is_numeric($data['id'])) sendResponse(['success'=>false,'message'=>'Topic ID required.'],400);
    $chk=$db->prepare('SELECT id FROM topics WHERE id=?'); $chk->execute([(int)$data['id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Topic not found.'],404);
    $set=[]; $p=[];
    if (!empty($data['subject'])) { $set[]='subject=?'; $p[]=sanitizeInput($data['subject']); }
    if (!empty($data['message'])) { $set[]='message=?'; $p[]=sanitizeInput($data['message']); }
    if (empty($set)) sendResponse(['success'=>false,'message'=>'No fields to update.'],400);
    $p[]=(int)$data['id'];
    $db->prepare('UPDATE topics SET '.implode(',',$set).' WHERE id=?')->execute($p);
    sendResponse(['success'=>true,'message'=>'Topic updated.']);
}

function deleteTopic(PDO $db, $id): void {
    if (!$id||!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid topic ID.'],400);
    $chk=$db->prepare('SELECT id FROM topics WHERE id=?'); $chk->execute([(int)$id]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Topic not found.'],404);
    $stmt=$db->prepare('DELETE FROM topics WHERE id=?'); $stmt->execute([(int)$id]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Topic deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete topic.'],500);
}

// ── REPLIES ───────────────────────────────────────────────────────────────────

function getRepliesByTopicId(PDO $db, $tid): void {
    if (!$tid||!is_numeric($tid)) sendResponse(['success'=>false,'message'=>'Invalid topic ID.'],400);
    $stmt=$db->prepare('SELECT id,topic_id,text,author,created_at FROM replies WHERE topic_id=? ORDER BY created_at ASC');
    $stmt->execute([(int)$tid]);
    sendResponse(['success'=>true,'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createReply(PDO $db, array $data): void {
    if (empty($data['topic_id'])||empty(trim($data['text']??''))||empty(trim($data['author']??'')))
        sendResponse(['success'=>false,'message'=>'topic_id, text, and author required.'],400);
    if (!is_numeric($data['topic_id'])) sendResponse(['success'=>false,'message'=>'Invalid topic ID.'],400);
    $chk=$db->prepare('SELECT id FROM topics WHERE id=?'); $chk->execute([(int)$data['topic_id']]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Topic not found.'],404);
    $text=sanitizeInput($data['text']); $author=sanitizeInput($data['author']);
    $stmt=$db->prepare('INSERT INTO replies (topic_id,text,author) VALUES (?,?,?)');
    $stmt->execute([(int)$data['topic_id'],$text,$author]);
    if ($stmt->rowCount()>0) {
        $newId=(int)$db->lastInsertId();
        $reply=['id'=>$newId,'topic_id'=>(int)$data['topic_id'],'text'=>$text,'author'=>$author,'created_at'=>date('Y-m-d H:i:s')];
        sendResponse(['success'=>true,'id'=>$newId,'data'=>$reply],201);
    }
    sendResponse(['success'=>false,'message'=>'Failed to create reply.'],500);
}

function deleteReply(PDO $db, $rid): void {
    if (!$rid||!is_numeric($rid)) sendResponse(['success'=>false,'message'=>'Invalid reply ID.'],400);
    $chk=$db->prepare('SELECT id FROM replies WHERE id=?'); $chk->execute([(int)$rid]);
    if (!$chk->fetch()) sendResponse(['success'=>false,'message'=>'Reply not found.'],404);
    $stmt=$db->prepare('DELETE FROM replies WHERE id=?'); $stmt->execute([(int)$rid]);
    if ($stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Reply deleted.']);
    sendResponse(['success'=>false,'message'=>'Failed to delete reply.'],500);
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
try {
    if ($method==='GET') {
        if ($action==='replies')        getRepliesByTopicId($db,$topicId);
        elseif ($id!==null)             getTopicById($db,$id);
        else                            getAllTopics($db);
    } elseif ($method==='POST') {
        if ($action==='reply')          createReply($db,$data);
        else                            createTopic($db,$data);
    } elseif ($method==='PUT')          { updateTopic($db,$data); }
    elseif ($method==='DELETE') {
        if ($action==='delete_reply')   deleteReply($db,$id);
        else                            deleteTopic($db,$id);
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
function sanitizeInput(string $data): string {
    return htmlspecialchars(strip_tags(trim($data)),ENT_QUOTES,'UTF-8');
}