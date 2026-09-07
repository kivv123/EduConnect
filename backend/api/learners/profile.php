<?php
// backend/api/learners/profile.php
require_once __DIR__ . '/../../config/db.php';

$authUser = getAuthUser($pdo);
if (!$authUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please sign in.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Fetch or create learner profile
$stmt = $pdo->prepare("SELECT * FROM learner_profiles WHERE user_id = :uid LIMIT 1");
$stmt->execute(['uid' => $authUser['id']]);
$learner = $stmt->fetch();

if (!$learner && $authUser['role'] === 'learner') {
    $ins = $pdo->prepare("INSERT INTO learner_profiles (user_id, headline, created_at) VALUES (:uid, 'Learner Profile', NOW())");
    $ins->execute(['uid' => $authUser['id']]);
    $learnerId = $pdo->lastInsertId();
    $stmt->execute(['uid' => $authUser['id']]);
    $learner = $stmt->fetch();
}

if (!$learner) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Learner profile not found.']);
    exit();
}

$learnerId = $learner['id'];

if ($method === 'GET') {
    // Fetch related portfolio sections
    $eduStmt = $pdo->prepare("SELECT * FROM learner_education WHERE learner_id = :lid ORDER BY start_date DESC");
    $eduStmt->execute(['lid' => $learnerId]);
    $education = $eduStmt->fetchAll();

    $skillStmt = $pdo->prepare("SELECT * FROM learner_skills WHERE learner_id = :lid ORDER BY skill_level DESC, skill_name ASC");
    $skillStmt->execute(['lid' => $learnerId]);
    $skills = $skillStmt->fetchAll();

    $achStmt = $pdo->prepare("SELECT * FROM learner_achievements WHERE learner_id = :lid ORDER BY date DESC");
    $achStmt->execute(['lid' => $learnerId]);
    $achievements = $achStmt->fetchAll();

    $projStmt = $pdo->prepare("SELECT * FROM learner_projects WHERE learner_id = :lid ORDER BY start_date DESC");
    $projStmt->execute(['lid' => $learnerId]);
    $projects = $projStmt->fetchAll();

    $certStmt = $pdo->prepare("SELECT * FROM learner_certificates WHERE learner_id = :lid ORDER BY issue_date DESC");
    $certStmt->execute(['lid' => $learnerId]);
    $certificates = $certStmt->fetchAll();

    $langStmt = $pdo->prepare("SELECT * FROM learner_languages WHERE learner_id = :lid");
    $langStmt->execute(['lid' => $learnerId]);
    $languages = $langStmt->fetchAll();

    // Dynamic completion calculation (weighted out of 100)
    $criteria = [
        'basic_info' => !empty($learner['headline']) && !empty($learner['bio']) && !empty($learner['country']),
        'education' => count($education) > 0,
        'skills' => count($skills) >= 2,
        'projects' => count($projects) > 0,
        'certificates' => count($certificates) > 0,
        'achievements' => count($achievements) > 0,
        'languages' => count($languages) > 0,
    ];

    $weights = [
        'basic_info' => 20,
        'education' => 25,
        'skills' => 15,
        'projects' => 15,
        'certificates' => 10,
        'achievements' => 10,
        'languages' => 5
    ];

    $score = 0;
    foreach ($criteria as $key => $passed) {
        if ($passed) {
            $score += $weights[$key];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'user' => $authUser,
            'profile' => $learner,
            'education' => $education,
            'skills' => $skills,
            'achievements' => $achievements,
            'projects' => $projects,
            'certificates' => $certificates,
            'languages' => $languages,
            'completion' => [
                'percentage' => $score,
                'checklist' => $criteria
            ]
        ]
    ]);
    exit();
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();

    $upStmt = $pdo->prepare("
        UPDATE learner_profiles SET
            headline = :headline,
            bio = :bio,
            profile_photo = :profile_photo,
            date_of_birth = :dob,
            gender = :gender,
            country = :country,
            city = :city,
            phone = :phone,
            website = :website,
            linkedin_url = :linkedin,
            career_goal = :career_goal,
            education_goal = :education_goal,
            interests = :interests,
            profile_visibility = :visibility
        WHERE id = :id
    ");

    $upStmt->execute([
        'headline' => trim($input['headline'] ?? $learner['headline']),
        'bio' => trim($input['bio'] ?? $learner['bio']),
        'profile_photo' => trim($input['profile_photo'] ?? $learner['profile_photo']),
        'dob' => !empty($input['date_of_birth']) ? $input['date_of_birth'] : $learner['date_of_birth'],
        'gender' => trim($input['gender'] ?? $learner['gender']),
        'country' => trim($input['country'] ?? $learner['country']),
        'city' => trim($input['city'] ?? $learner['city']),
        'phone' => trim($input['phone'] ?? $learner['phone']),
        'website' => trim($input['website'] ?? $learner['website']),
        'linkedin' => trim($input['linkedin_url'] ?? $learner['linkedin_url']),
        'career_goal' => trim($input['career_goal'] ?? $learner['career_goal']),
        'education_goal' => trim($input['education_goal'] ?? $learner['education_goal']),
        'interests' => trim($input['interests'] ?? $learner['interests']),
        'visibility' => in_array($input['profile_visibility'] ?? '', ['public', 'providers_only', 'private']) ? $input['profile_visibility'] : 'public',
        'id' => $learnerId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Learner profile updated successfully.'
    ]);
    exit();
}
