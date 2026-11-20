<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;

if ($method === 'POST' && $action === 'create') {
    $proposerId  = requireAuth();
    $itemId      = (int) ($input['item_id'] ?? 0);
    $offeredItem = trim($input['offered_item'] ?? '');
    $cashTopup   = trim($input['cash_topup'] ?? '₦0 (Straight Swap)');
    $note        = trim($input['note'] ?? '');

    if (!$itemId || !$offeredItem) {
        sendJson(false, "Specify the item you are offering in exchange.", [], 400);
    }

    $stmt = $pdo->prepare("SELECT i.user_id, i.title, u.email, u.full_name FROM items i JOIN users u ON i.user_id = u.id WHERE i.id = ? AND i.status = 'Active'");
    $stmt->execute([$itemId]);
    $item = $stmt->fetch();

    if (!$item) {
        sendJson(false, "This listing is no longer available.", [], 404);
    }
    if ((int) $item['user_id'] === $proposerId) {
        sendJson(false, "You cannot propose a swap on your own listing.", [], 400);
    }

    $ins = $pdo->prepare(
        "INSERT INTO swap_offers (item_id, proposer_id, owner_id, offered_item, cash_topup, note)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $ins->execute([$itemId, $proposerId, (int) $item['user_id'], $offeredItem, $cashTopup, $note]);

    $proposerName = $_SESSION['user_name'] ?? 'A trader';
    sendTradeEmail(
        $item['email'],
        $item['full_name'],
        "New Swap Proposal for {$item['title']} — DFQ Trade Crow",
        "{$proposerName} proposed a trade for your "{$item['title']}":
- Offered Item: {$offeredItem}
- Cash Adjustment: {$cashTopup}
- Note: {$note}"
    );

    sendJson(true, "Swap proposal sent & owner notified by email!", ["offer_id" => (int) $pdo->lastInsertId()], 201);
}

if ($method === 'GET' && $action === 'incoming') {
    $userId = requireAuth();

    $sql = "SELECT o.*,
                   i.title AS my_item_title, i.est_value AS my_item_value, i.image_path AS my_item_img,
                   u.full_name AS proposer_name, u.phone AS proposer_phone, u.location AS proposer_location,
                   (SELECT COUNT(*) FROM trader_reviews tr WHERE tr.offer_id = o.id AND tr.reviewer_id = ?) AS already_reviewed
            FROM swap_offers o
            JOIN items i ON o.item_id = i.id
            JOIN users u ON o.proposer_id = u.id
            WHERE o.owner_id = ?
            ORDER BY o.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $userId]);

    sendJson(true, "Incoming offers fetched.", ["offers" => $stmt->fetchAll()]);
}

if ($method === 'POST' && $action === 'respond') {
    $ownerId   = requireAuth();
    $offerId   = (int) ($input['offer_id'] ?? 0);
    $decision  = $input['decision'] ?? '';
    $cashTopup = trim($input['cash_topup'] ?? '');
    $note      = trim($input['note'] ?? '');

    $stmt = $pdo->prepare(
        "SELECT o.id, o.item_id, o.offered_item, i.title AS item_title, u.email AS proposer_email, u.full_name AS proposer_name
         FROM swap_offers o
         JOIN items i ON o.item_id = i.id
         JOIN users u ON o.proposer_id = u.id
         WHERE o.id = ? AND o.owner_id = ?"
    );
    $stmt->execute([$offerId, $ownerId]);
    $offer = $stmt->fetch();

    if (!$offer) {
        sendJson(false, "Offer not found or unauthorized.", [], 403);
    }

    if ($decision === 'Counter') {
        $upd = $pdo->prepare("UPDATE swap_offers SET cash_topup = ?, note = ?, status = 'Pending' WHERE id = ?");
        $upd->execute(["Counter: " . $cashTopup, $note, $offerId]);
        sendTradeEmail(
            $offer['proposer_email'],
            $offer['proposer_name'],
            "Counter-Offer Received on {$offer['item_title']}",
            "The owner sent a counter-offer for "{$offer['item_title']}":
- Terms: {$cashTopup}
- Note: {$note}"
        );
        sendJson(true, "Counter-offer sent & proposer notified!");
    }

    if (in_array($decision, ['In Escrow', 'Accepted', 'Declined', 'Pending'], true)) {
        $pdo->prepare("UPDATE swap_offers SET status = ? WHERE id = ?")->execute([$decision, $offerId]);

        if ($decision === 'In Escrow') {
            $pdo->prepare("UPDATE items SET status = 'In Escrow' WHERE id = ?")->execute([$offer['item_id']]);
        } elseif ($decision === 'Accepted') {
            $pdo->prepare("UPDATE items SET status = 'Swapped' WHERE id = ?")->execute([$offer['item_id']]);
        } elseif ($decision === 'Pending') {
            $pdo->prepare("UPDATE items SET status = 'Active' WHERE id = ?")->execute([$offer['item_id']]);
        }

        sendTradeEmail(
            $offer['proposer_email'],
            $offer['proposer_name'],
            "Swap Offer Update: {$decision} — {$offer['item_title']}",
            "Your swap proposal ({$offer['offered_item']}) for "{$offer['item_title']}" is now marked as: {$decision}."
        );

        sendJson(true, "Swap status updated to {$decision}.");
    }

    sendJson(false, "Invalid decision action.", [], 400);
}

if ($method === 'POST' && $action === 'rate') {
    $reviewerId = requireAuth();
    $offerId    = (int) ($input['offer_id'] ?? 0);
    $rating     = max(1, min(5, (int) ($input['rating'] ?? 5)));
    $comment    = trim($input['comment'] ?? '');

    $stmt = $pdo->prepare("SELECT id, proposer_id, owner_id, status FROM swap_offers WHERE id = ?");
    $stmt->execute([$offerId]);
    $offer = $stmt->fetch();

    if (!$offer || $offer['status'] !== 'Accepted') {
        sendJson(false, "You can only rate completed/accepted swaps.", [], 400);
    }

    $targetId = ((int) $offer['owner_id'] === $reviewerId) ? (int) $offer['proposer_id'] : (int) $offer['owner_id'];
    if ((int) $offer['owner_id'] !== $reviewerId && (int) $offer['proposer_id'] !== $reviewerId) {
        sendJson(false, "Unauthorized to rate this swap.", [], 403);
    }

    $ins = $pdo->prepare("INSERT INTO trader_reviews (offer_id, reviewer_id, target_user_id, rating, comment) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)");
    $ins->execute([$offerId, $reviewerId, $targetId, $rating, $comment]);

    sendJson(true, "Trader rating submitted! Thank you.");
}

sendJson(false, "Invalid offers endpoint request.", [], 400);
