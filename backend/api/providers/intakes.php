<?php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser || $authUser['role'] !== 'provider') {
    http_response_code(403);
    echo json_encode(['success'=>false,'message'=>'Unauthorized. Provider account required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, provider_type FROM providers WHERE user_id = :uid LIMIT 1");
$stmt->execute(['uid'=>$authUser['id']]);
$provider = $stmt->fetch();
if (!$provider) {
    http_response_code(404);
    echo json_encode(['success'=>false,'message'=>'Provider record not found.']);
    exit();
}

if ($provider['provider_type'] !== 'university') {
    echo json_encode(['success'=>true,'data'=>[]]);
    exit();
}

$u = $pdo->prepare("SELECT id FROM universities WHERE provider_id = :pid LIMIT 1");
$u->execute(['pid'=>$provider['id']]);
$univ = $u->fetch();
if (!$univ) {
    echo json_encode(['success'=>true,'data'=>[]]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $q = $pdo->prepare("SELECT i.*, u.name AS university_name, u.country, u.city FROM university_intakes i JOIN universities u ON u.id=i.university_id WHERE i.university_id=:uid ORDER BY i.application_deadline ASC");
    $q->execute(['uid'=>$univ['id']]);
    $rows=$q->fetchAll();
    $today=date('Y-m-d');
    foreach($rows as &$r){
        $r['term_season'] = $r['term_season'] ?? '';
        $r['academic_year'] = $r['academic_year'] ?? date('Y', strtotime($r['start_date']));
        $r['application_open_date'] = $r['application_open_date'] ?? null;
        $r['programs_offered'] = $r['programs_offered'] ?? '';
        $r['status'] = ($r['application_deadline'] < $today) ? 'closed' : 'open';
    }
    echo json_encode(['success'=>true,'data'=>$rows]); exit();
}

if ($method === 'POST') {
    $input=getJsonInput();
    $name=trim($input['intake_name'] ?? '');
    $season=trim($input['term_season'] ?? 'Fall');
    $year=(int)($input['academic_year'] ?? date('Y'));
    $open=$input['application_open_date'] ?? date('Y-m-d');
    $deadline=$input['application_deadline'] ?? '';
    $programs=trim($input['programs_offered'] ?? '');
    if(!$name || !$deadline){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'Intake name and deadline are required.']); exit(); }
    $description=$programs ? 'Programs: '.$programs : null;
    $ins=$pdo->prepare("INSERT INTO university_intakes (university_id,intake_name,start_date,application_deadline,description,application_url) VALUES (:uid,:name,:start,:deadline,:desc,NULL)");
    $ins->execute(['uid'=>$univ['id'],'name'=>$name,'start'=>$open ?: date('Y-m-d'),'deadline'=>$deadline,'desc'=>$description]);
    echo json_encode(['success'=>true,'message'=>'Intake published successfully.','id'=>$pdo->lastInsertId()]); exit();
}

if ($method === 'DELETE') {
    $id=(int)($_GET['id'] ?? 0);
    $del=$pdo->prepare("DELETE i FROM university_intakes i WHERE i.id=:id AND i.university_id=:uid");
    $del->execute(['id'=>$id,'uid'=>$univ['id']]);
    echo json_encode(['success'=>$del->rowCount()>0,'message'=>$del->rowCount()>0?'Intake removed successfully.':'Intake not found.']); exit();
}

http_response_code(405);
echo json_encode(['success'=>false,'message'=>'Method not allowed.']);
