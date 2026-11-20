<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET' && $action === 'list') {
    $mode     = $_GET['mode'] ?? 'all';
    $category = $_GET['category'] ?? 'all';
    $location = $_GET['location'] ?? 'all';
    $search   = trim($_GET['search'] ?? '');
    $mineOnly = isset($_GET['mine']) && $_GET['mine'] === '1';

    $sql = "SELECT i.*, u.full_name AS owner_name, u.phone AS owner_phone,
                   COALESCE(ROUND(AVG(r.rating), 1), 5.0) AS owner_rating,
                   COUNT(DISTINCT r.id) AS review_count
            FROM items i
            JOIN users u ON i.user_id = u.id
            LEFT JOIN trader_reviews r ON r.target_user_id = u.id
            WHERE 1=1";
    $params = [];

    if ($mineOnly) {
        $userId = requireAuth();
        $sql .= " AND i.user_id = ? AND i.status != 'Removed'";
        $params[] = $userId;
    } else {
        $sql .= " AND i.status IN ('Active', 'In Escrow')";
    }

    if ($mode !== 'all') {
        $sql .= " AND i.mode = ?";
        $params[] = $mode;
    }
    if ($category !== 'all') {
        $sql .= " AND i.category = ?";
        $params[] = $category;
    }
    if ($location !== 'all') {
        $sql .= " AND i.location = ?";
        $params[] = $location;
    }
    if ($search !== '') {
        $sql .= " AND (i.title LIKE ? OR i.wanted LIKE ? OR i.description LIKE ? OR i.serial_imei LIKE ?)";
        $like = "%{$search}%";
        array_push($params, $like, $like, $like, $like);
    }

    $sql .= " GROUP BY i.id ORDER BY i.is_featured DESC, i.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $gallery = json_decode($row['gallery_json'] ?? '[]', true);
        $row['gallery'] = (is_array($gallery) && count($gallery) > 0) ? $gallery : [$row['image_path']];
    }

    sendJson(true, "Listings fetched.", ["items" => $rows]);
}

if ($method === 'POST' && $action === 'create') {
    $userId = requireAuth();

    $title      = trim($_POST['title'] ?? '');
    $category   = $_POST['category'] ?? '';
    $mode       = $_POST['mode'] ?? '';
    $condition  = $_POST['item_condition'] ?? 'Neatly Used';
    $location   = trim($_POST['location'] ?? '');
    $wanted     = trim($_POST['wanted'] ?? '');
    $estValue   = (float) preg_replace('/[^0-9.]/', '', $_POST['est_value'] ?? '0');
    $serialImei = trim($_POST['serial_imei'] ?? '');
    $desc       = trim($_POST['description'] ?? '');

    if ($serialImei !== '') {
        $chk = $pdo->prepare("SELECT id FROM items WHERE serial_imei = ? AND (is_reported = 1 OR status = 'Removed')");
        $chk->execute([$serialImei]);
        if ($chk->fetch()) {
            sendJson(false, "Security Alert: This Serial/IMEI has been flagged on DFQ Trade Crow and cannot be listed.", [], 403);
        }
    }

    $pawnAdvance = null;
    $pawnBuyback = null;
    $pawnDueDate = null;
    if ($mode === 'Pawn / Quick Sale') {
        $advRaw = (float) preg_replace('/[^0-9.]/', '', $_POST['pawn_advance'] ?? '0');
        $days   = max(7, min(60, (int) ($_POST['pawn_days'] ?? 14)));
        if ($advRaw > 0) {
            $pawnAdvance = $advRaw;
            $pawnBuyback = round($advRaw * 1.10, 2);
            $pawnDueDate = date('Y-m-d', strtotime("+{$days} days"));
        }
    }

    if (!$title || !$category || !$mode || !$location || !$wanted || !$desc) {
        sendJson(false, "All required item fields must be filled.", [], 400);
    }

    if (!isset($_FILES['photos']) || empty($_FILES['photos']['name'][0])) {
        sendJson(false, "Please upload at least 1 photo of your item.", [], 400);
    }

    $uploadDir = dirname(__DIR__) . '/uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $allowedMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $savedPaths = [];

    $totalFiles = min(4, count($_FILES['photos']['name']));
    for ($idx = 0; $idx < $totalFiles; $idx++) {
        if ($_FILES['photos']['error'][$idx] !== UPLOAD_ERR_OK) {
            continue;
        }
        if ($_FILES['photos']['size'][$idx] > 5 * 1024 * 1024) {
            sendJson(false, "Each image must be under 5MB.", [], 400);
        }
        $mime = $finfo->file($_FILES['photos']['tmp_name'][$idx]);
        if (!isset($allowedMimes[$mime])) {
            sendJson(false, "Only JPG, PNG, and WEBP images are allowed.", [], 400);
        }
        $filename = 'item_' . $userId . '_' . bin2hex(random_bytes(8)) . '.' . $allowedMimes[$mime];
        if (move_uploaded_file($_FILES['photos']['tmp_name'][$idx], $uploadDir . $filename)) {
            $savedPaths[] = 'uploads/' . $filename;
        }
    }

    if (count($savedPaths) === 0) {
        sendJson(false, "Failed to process uploaded images.", [], 400);
    }

    $receiptPath = null;
    if (isset($_FILES['receipt']) && $_FILES['receipt']['error'] === UPLOAD_ERR_OK) {
        $recMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];
        $rMime = $finfo->file($_FILES['receipt']['tmp_name']);
        if (isset($recMimes[$rMime]) && $_FILES['receipt']['size'] <= 5 * 1024 * 1024) {
            $rName = 'receipt_' . $userId . '_' . bin2hex(random_bytes(8)) . '.' . $recMimes[$rMime];
            if (move_uploaded_file($_FILES['receipt']['tmp_name'], $uploadDir . $rName)) {
                $receiptPath = 'uploads/' . $rName;
            }
        }
    }

    $stmt = $pdo->prepare(
        "INSERT INTO items (user_id, title, category, mode, item_condition, location, wanted, est_value, pawn_advance, pawn_buyback, pawn_due_date, serial_imei, receipt_path, image_path, gallery_json, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $userId, $title, $category, $mode, $condition, $location, $wanted, $estValue,
        $pawnAdvance, $pawnBuyback, $pawnDueDate, ($serialImei !== '' ? $serialImei : null), $receiptPath,
        $savedPaths[0], json_encode($savedPaths), $desc
    ]);

    $itemId = (int) $pdo->lastInsertId();

    $wStmt = $pdo->query("SELECT w.keyword, u.email, u.full_name, u.id AS uid FROM wishlists w JOIN users u ON w.user_id = u.id");
    foreach ($wStmt->fetchAll() as $w) {
        if ((int) $w['uid'] !== $userId && stripos($title . ' ' . $desc, $w['keyword']) !== false) {
            sendTradeEmail(
                $w['email'],
                $w['full_name'],
                "DFQ Trade Crow Wishlist Match: {$title}",
                "An item matching your saved keyword "{$w['keyword']}" was just posted:
- Item: {$title}
- Wants: {$wanted}
- Location: {$location}"
            );
        }
    }

    sendJson(true, "Item posted live to DFQ Trade Crow!", ["item_id" => $itemId], 201);
}

if ($method === 'POST' && $action === 'boost') {
    $userId = requireAuth();
    $input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $itemId = (int) ($input['item_id'] ?? 0);

    $uStmt = $pdo->prepare("SELECT spotlight_credits FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $credits = (int) $uStmt->fetchColumn();
    if ($credits < 1) {
        sendJson(false, "No Spotlight Credits left. Invite a friend with your referral link to earn free boosts!", [], 400);
    }

    $upd = $pdo->prepare("UPDATE items SET is_featured = 1 WHERE id = ? AND user_id = ?");
    $upd->execute([$itemId, $userId]);
    if ($upd->rowCount() > 0) {
        $pdo->prepare("UPDATE users SET spotlight_credits = spotlight_credits - 1 WHERE id = ?")->execute([$userId]);
        sendJson(true, "Listing pinned to Featured Spotlight!");
    }
    sendJson(false, "Unable to boost item.", [], 400);
}

if ($method === 'POST' && $action === 'report') {
    $input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $itemId = (int) ($input['item_id'] ?? 0);
    $reason = trim($input['reason'] ?? 'Suspicious listing');
    if ($itemId) {
        $pdo->prepare("UPDATE items SET is_reported = 1, report_reason = ? WHERE id = ?")->execute([$reason, $itemId]);
        sendJson(true, "Listing flagged for Admin review. Thank you for keeping DFQ Trade Crow safe.");
    }
    sendJson(false, "Invalid item ID.", [], 400);
}

if ($method === 'GET' && $action === 'check_serial') {
    $q = trim($_GET['serial'] ?? '');
    if ($q === '') {
        sendJson(false, "Enter a Serial number or IMEI to verify.", [], 400);
    }
    $stmt = $pdo->prepare("SELECT id, title, status, is_reported, report_reason, receipt_path FROM items WHERE serial_imei = ?");
    $stmt->execute([$q]);
    $matches = $stmt->fetchAll();
    $flagged = false;
    foreach ($matches as $m) {
        if ((int)$m['is_reported'] === 1 || $m['status'] === 'Removed') {
            $flagged = true;
        }
    }
    sendJson(true, $flagged ? "WARNING: Flagged serial/IMEI found!" : "Serial/IMEI check complete.", [
        "flagged" => $flagged,
        "matches" => $matches
    ]);
}

if ($method === 'POST' && ($action === 'toggle_status' || $action === 'delete')) {
    $userId = requireAuth();
    $input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $itemId = (int) ($input['item_id'] ?? 0);

    $stmt = $pdo->prepare("SELECT id, status, image_path, gallery_json, receipt_path FROM items WHERE id = ? AND user_id = ?");
    $stmt->execute([$itemId, $userId]);
    $item = $stmt->fetch();

    if (!$item) {
        sendJson(false, "Item not found or unauthorized.", [], 403);
    }

    if ($action === 'toggle_status') {
        $newStatus = ($item['status'] === 'Active') ? 'Swapped' : 'Active';
        $pdo->prepare("UPDATE items SET status = ? WHERE id = ?")->execute([$newStatus, $itemId]);
        sendJson(true, "Listing marked as {$newStatus}.", ["status" => $newStatus]);
    }

    if ($action === 'delete') {
        $pdo->prepare("DELETE FROM items WHERE id = ?")->execute([$itemId]);
        $gallery = json_decode($item['gallery_json'] ?? '[]', true) ?: [$item['image_path']];
        foreach ($gallery as $relImg) {
            $fullImg = dirname(__DIR__) . '/' . $relImg;
            if (file_exists($fullImg)) @unlink($fullImg);
        }
        if (!empty($item['receipt_path'])) {
            $fullRec = dirname(__DIR__) . '/' . $item['receipt_path'];
            if (file_exists($fullRec)) @unlink($fullRec);
        }
        sendJson(true, "Listing deleted permanently.");
    }
}

if ($action === 'wishlist') {
    $userId = requireAuth();
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, keyword FROM wishlists WHERE user_id = ? ORDER BY id DESC");
        $stmt->execute([$userId]);
        sendJson(true, "Wishlist fetched.", ["keywords" => $stmt->fetchAll()]);
    }
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
        $sub = $input['sub'] ?? 'add';
        if ($sub === 'add') {
            $kw = trim($input['keyword'] ?? '');
            if ($kw !== '') {
                $pdo->prepare("INSERT INTO wishlists (user_id, keyword) VALUES (?, ?)")->execute([$userId, $kw]);
            }
            sendJson(true, "Wishlist alert saved!");
        }
        if ($sub === 'remove') {
            $wid = (int) ($input['id'] ?? 0);
            $pdo->prepare("DELETE FROM wishlists WHERE id = ? AND user_id = ?")->execute([$wid, $userId]);
            sendJson(true, "Wishlist keyword removed.");
        }
    }
}

sendJson(false, "Invalid items endpoint request.", [], 400);
