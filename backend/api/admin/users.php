<?php
require_once __DIR__ . '/../../config/db.php';

$authUser=getAuthUser($pdo);
if(!$authUser || $authUser['role']!=='admin'){ http_response_code(403); echo json_encode(['success'=>false,'message'=>'Unauthorized. Admin account required.']); exit(); }

$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){
    $search=trim($_GET['search'] ?? ''); $role=trim($_GET['role'] ?? 'all');
    $sql="SELECT id,name,email,role,status,created_at,(status='active') AS is_active FROM users WHERE 1=1"; $params=[];
    if($search!==''){ $sql.=" AND (name LIKE :search OR email LIKE :search)"; $params['search']='%'.$search.'%'; }
    if(in_array($role,['learner','provider','admin'])){ $sql.=" AND role=:role"; $params['role']=$role; }
    $sql.=" ORDER BY created_at DESC";
    $st=$pdo->prepare($sql); $st->execute($params); echo json_encode(['success'=>true,'data'=>$st->fetchAll()]); exit();
}
if($method==='POST'){
    $input=getJsonInput(); $id=(int)($input['user_id'] ?? 0); $action=$input['action'] ?? '';
    if($id===$authUser['id']){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'You cannot change your own account status.']); exit(); }
    if($action==='toggle_status'){
        $st=$pdo->prepare("SELECT status,role FROM users WHERE id=:id LIMIT 1"); $st->execute(['id'=>$id]); $u=$st->fetch();
        if(!$u){ http_response_code(404); echo json_encode(['success'=>false,'message'=>'User not found.']); exit(); }
        if($u['role']==='admin'){ http_response_code(403); echo json_encode(['success'=>false,'message'=>'Admin accounts are protected.']); exit(); }
        $new=$u['status']==='active'?'suspended':'active'; $up=$pdo->prepare("UPDATE users SET status=:status WHERE id=:id"); $up->execute(['status'=>$new,'id'=>$id]);
        recordAuditLog($pdo,$authUser['id'],'STATUS_CHANGE','user',$id,'Changed user status to '.$new);
        echo json_encode(['success'=>true,'message'=>'User status changed to '.$new.'.']); exit();
    }
}
http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed.']);
