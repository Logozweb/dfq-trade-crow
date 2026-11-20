<?php
declare(strict_types=1);

session_start();

if (!defined('SKIP_JSON_HEADER')) {
    header("Content-Type: application/json; charset=UTF-8");
}

$DB_HOST = "localhost";
$DB_NAME = "dfqtrade_crowdb";
$DB_USER = "dfqtrade_admin";
$DB_PASS = "CHANGE_THIS_STRONG_PASSWORD";
$SITE_EMAIL = "notifications@dfqtradecrow.com";

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    if (!defined('SKIP_JSON_HEADER')) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database connection failed. Import api/schema.sql in phpMyAdmin and check DB credentials in api/config.php."]);
        exit;
    }
    die("Database connection failed. Check api/config.php.");
}

function sendJson(bool $success, string $message, array $data = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode(array_merge(["success" => $success, "message" => $message], $data));
    exit;
}

function requireAuth(): int {
    if (!isset($_SESSION['user_id'])) {
        sendJson(false, "Authentication required. Please log in.", [], 401);
    }
    return (int) $_SESSION['user_id'];
}

function sendTradeEmail(string $toEmail, string $toName, string $subject, string $bodyText): void {
    global $SITE_EMAIL;
    if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return;
    }
    $headers  = "From: DFQ Trade Crow <{$SITE_EMAIL}>
";
    $headers .= "Reply-To: {$SITE_EMAIL}
";
    $headers .= "Content-Type: text/plain; charset=UTF-8
";
    $message  = "Hello {$toName},

{$bodyText}

Log in to your Trade Desk to respond: https://" . ($_SERVER['HTTP_HOST'] ?? 'dfqtradecrow.com') . "/dashboard.html

— DFQ Trade Crow Team";
    @mail($toEmail, $subject, $message, $headers);
}
