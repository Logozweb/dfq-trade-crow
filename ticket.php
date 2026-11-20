<?php
define('SKIP_JSON_HEADER', true);
require_once __DIR__ . '/api/config.php';

$itemId = (int) ($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT i.*, u.full_name, u.phone, u.email FROM items i JOIN users u ON i.user_id = u.id WHERE i.id = ? AND i.mode = 'Pawn / Quick Sale'");
$stmt->execute([$itemId]);
$item = $stmt->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Digital Pawn Ticket #DFQ-<?= $itemId ?> | DFQ Trade Crow</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="assets/css/style.css" rel="stylesheet" />
  <script>
  (function () {
    const saved = localStorage.getItem("dfq_theme_mode");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  })();
</script>
</head>
<body>
  <div class="ticket-box shadow-sm">
    <?php if (!$item): ?>
      <div class="alert alert-warning mb-0">Pawn ticket not found or item is not a Pawn listing.</div>
    <?php else: ?>
      <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
        <div>
          <span class="badge bg-info text-dark mb-1">OFFICIAL PAWN &amp; BUYBACK RECEIPT</span>
          <h4 class="fw-bold mb-0">DFQ Trade Crow</h4>
          <small class="text-muted">Ticket ID: #DFQ-PAWN-<?= str_pad((string)$item['id'], 5, '0', STR_PAD_LEFT) ?></small>
        </div>
        <button onclick="window.print()" class="btn btn-sky btn-sm no-print">Print / Save PDF</button>
      </div>

      <div class="row g-3 mb-3 small">
        <div class="col-6"><strong>Item Collateral:</strong><br><?= htmlspecialchars($item['title']) ?></div>
        <div class="col-6"><strong>Condition:</strong><br><?= htmlspecialchars($item['item_condition']) ?></div>
        <div class="col-6"><strong>Serial / IMEI:</strong><br><?= htmlspecialchars($item['serial_imei'] ?: 'N/A') ?></div>
        <div class="col-6"><strong>Owner / Holder:</strong><br><?= htmlspecialchars($item['full_name']) ?> (<?= htmlspecialchars($item['phone']) ?>)</div>
      </div>

      <div class="p-3 rounded-3 bg-light border mb-3">
        <div class="row text-center">
          <div class="col-4 border-end"><small class="text-muted d-block">Est. Valuation</small><strong>₦<?= number_format((float)$item['est_value'], 2) ?></strong></div>
          <div class="col-4 border-end"><small class="text-muted d-block">Pawn Advance</small><strong>₦<?= number_format((float)($item['pawn_advance'] ?? 0), 2) ?></strong></div>
          <div class="col-4"><small class="text-muted d-block">Buyback Total (10%)</small><strong class="text-primary">₦<?= number_format((float)($item['pawn_buyback'] ?? 0), 2) ?></strong></div>
        </div>
      </div>

      <p class="small text-muted mb-0">
        <strong>Redemption Deadline:</strong> <?= htmlspecialchars($item['pawn_due_date'] ?? 'Open Agreement') ?>.
        Upon full payment of the buyback total before the deadline, collateral ownership reverts 100% to the holder.
      </p>
    <?php endif; ?>
  </div>
  <script>
  (function () {
    function syncThemeButtons(theme) {
      document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
        const icon = btn.querySelector("i");
        const label = btn.querySelector(".theme-label");
        if (theme === "dark") {
          if (icon) icon.className = "bi bi-sun-fill text-warning";
          if (label) label.textContent = "Light";
          btn.setAttribute("title", "Switch to Light Theme");
        } else {
          if (icon) icon.className = "bi bi-moon-stars-fill";
          if (label) label.textContent = "Dark";
          btn.setAttribute("title", "Switch to Dark Theme");
        }
      });
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute("data-bs-theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("dfq_theme_mode", theme);
      syncThemeButtons(theme);
    }

    window.toggleDfqTheme = function () {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    };

    document.addEventListener("DOMContentLoaded", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      syncThemeButtons(current);
      document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
        btn.addEventListener("click", window.toggleDfqTheme);
      });
    });
  })();
</script>
</body>
</html>
