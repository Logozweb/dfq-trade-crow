<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;

if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($input['full_name'] ?? '');
    $email    = strtolower(trim($input['email'] ?? ''));
    $phone    = trim($input['phone'] ?? '');
    $location = trim($input['location'] ?? 'Lekki, Lagos');
    $password = $input['password'] ?? '';
    $refInput  = strtoupper(trim($input['ref_code'] ?? ''));

    if ($fullName === "" || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === "" || strlen($password) < 6) {
        sendJson(false, "Please fill all fields properly: valid name, email, phone, and password (at least 6 characters).", [], 200);
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJson(false, "An account with this email already exists. Try logging in instead.", [], 200);
    }

    $referredBy = null;
    if ($refInput !== '') {
        $rStmt = $pdo->prepare("SELECT id FROM users WHERE referral_code = ?");
        $rStmt->execute([$refInput]);
        $refUser = $rStmt->fetch();
        if ($refUser) {
            $referredBy = (int) $refUser['id'];
            $pdo->prepare("UPDATE users SET spotlight_credits = spotlight_credits + 1 WHERE id = ?")->execute([$referredBy]);
        }
    }

    $countUsers = (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $isAdmin = ($countUsers === 0) ? 1 : 0;
    $myRefCode = 'DFQ-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, location, password_hash, referral_code, referred_by, spotlight_credits, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)");
    $stmt->execute([$fullName, $email, $phone, $location, $hash, $myRefCode, $referredBy, $isAdmin]);

    $userId = (int) $pdo->lastInsertId();
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $fullName;
    $_SESSION['is_admin'] = $isAdmin;

    sendJson(true, $isAdmin ? "Admin account created!" : "Account created! You received 1 free Spotlight Boost.", [
        "user" => [
            "id" => $userId, "full_name" => $fullName, "email" => $email, "phone" => $phone,
            "location" => $location, "referral_code" => $myRefCode, "spotlight_credits" => 1, "is_admin" => $isAdmin
        ]
    ], 201);
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, password_hash, is_admin FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendJson(false, "Invalid email or password.", [], 200);
    }

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_name'] = $user['full_name'];
    $_SESSION['is_admin'] = (int) $user['is_admin'];
    unset($user['password_hash']);

    sendJson(true, "Welcome back, " . $user['full_name'] . "!", ["user" => $user]);
}

if ($action === 'me') {
    if (!isset($_SESSION['user_id'])) {
        sendJson(true, "Guest", ["authenticated" => false]);
    }
    $stmt = $pdo->prepare("SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, is_admin FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    sendJson(true, "Authenticated", ["authenticated" => true, "user" => $user]);
}

if ($action === 'logout') {
    session_destroy();
    sendJson(true, "Logged out successfully.");
}

sendJson(false, "Invalid auth action.", [], 400);
