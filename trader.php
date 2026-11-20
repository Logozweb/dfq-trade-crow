<?php
define('SKIP_JSON_HEADER', true);
require_once __DIR__ . '/api/config.php';

$traderId = (int) ($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT id, full_name, location, created_at FROM users WHERE id = ?");
$stmt->execute([$traderId]);
$trader = $stmt->fetch();

$items = [];
$reviews = [];
$avgRating = "5.0";
$swappedCount = 0;

if ($trader) {
    $iStmt = $pdo->prepare("SELECT * FROM items WHERE user_id = ? AND status IN ('Active', 'In Escrow') ORDER BY created_at DESC");
    $iStmt->execute([$traderId]);
    $items = $iStmt->fetchAll();

    $swappedCount = (int) $pdo->query("SELECT COUNT(*) FROM items WHERE user_id = {$traderId} AND status = 'Swapped'")->fetchColumn();

    $rStmt = $pdo->prepare("SELECT r.*, u.full_name AS reviewer_name FROM trader_reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.target_user_id = ? ORDER BY r.created_at DESC");
    $rStmt->execute([$traderId]);
    $reviews = $rStmt->fetchAll();

    if (count($reviews) > 0) {
        $sum = array_sum(array_column($reviews, 'rating'));
        $avgRating = number_format($sum / count($reviews), 1);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= $trader ? htmlspecialchars($trader['full_name']) . " — Trader Storefront" : "Trader Not Found" ?> | DFQ Trade Crow</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
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
  <nav class="navbar bg-white border-bottom py-3">
    <div class="container">
      <a class="navbar-brand fw-bold" href="index.html">DFQ <span class="text-sky">Trade Crow</span></a>
      <a href="index.html" class="btn btn-outline-sky btn-sm">Back to Marketplace</a>
      <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1" data-theme-toggle title="Toggle Dark/Light Theme"><i class="bi bi-moon-stars-fill"></i><span class="theme-label d-none d-sm-inline">Dark</span></button>
      </div>
  </nav>

  <div class="container py-5">
    <?php if (!$trader): ?>
      <div class="alert alert-warning rounded-4">Trader profile not found.</div>
    <?php else: ?>
      <div class="bg-white border rounded-4 p-4 mb-4 shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <span class="badge bg-sky-tint text-sky border border-info mb-2">Verified DFQ Trader</span>
          <h2 class="fw-bold text-dark mb-1"><?= htmlspecialchars($trader['full_name']) ?></h2>
          <p class="text-muted small mb-0">
            <i class="bi bi-geo-alt-fill text-sky"></i> <?= htmlspecialchars($trader['location']) ?> &bull;
            Member since <?= date('M Y', strtotime($trader['created_at'])) ?>
          </p>
        </div>
        <div class="d-flex gap-3 text-center">
          <div class="px-3 py-2 rounded-3 bg-light border">
            <div class="fw-bold fs-4 text-warning-emphasis"><i class="bi bi-star-fill text-warning"></i> <?= $avgRating ?></div>
            <small class="text-muted"><?= count($reviews) ?> Reviews</small>
          </div>
          <div class="px-3 py-2 rounded-3 bg-light border">
            <div class="fw-bold fs-4 text-sky"><?= $swappedCount ?></div>
            <small class="text-muted">Completed Swaps</small>
          </div>
        </div>
      </div>

      <h5 class="fw-bold text-dark mb-3">Active Listings by <?= htmlspecialchars($trader['full_name']) ?> (<?= count($items) ?>)</h5>
      <div class="row g-4 mb-5">
        <?php if (empty($items)): ?>
          <div class="col-12"><div class="bg-white border rounded-4 p-4 text-muted">No active listings right now.</div></div>
        <?php endif; ?>
        <?php foreach ($items as $it): ?>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <img src="<?= htmlspecialchars($it['image_path']) ?>" style="height:190px;object-fit:cover;" alt="" />
              <div class="card-body d-flex flex-column">
                <span class="badge bg-info-subtle text-dark align-self-start mb-2"><?= htmlspecialchars($it['mode']) ?></span>
                <h6 class="fw-bold text-dark"><?= htmlspecialchars($it['title']) ?></h6>
                <p class="small text-muted flex-grow-1">Wants: <strong><?= htmlspecialchars($it['wanted']) ?></strong></p>
                <a href="index.html#marketplace" class="btn btn-sky btn-sm mt-2">View on Marketplace</a>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>

      <h5 class="fw-bold text-dark mb-3">Trader Reviews (<?= count($reviews) ?>)</h5>
      <div class="d-grid gap-3">
        <?php if (empty($reviews)): ?>
          <div class="bg-white border rounded-4 p-4 text-muted small">No reviews yet.</div>
        <?php endif; ?>
        <?php foreach ($reviews as $rev): ?>
          <div class="bg-white border rounded-4 p-3 shadow-sm">
            <div class="d-flex justify-content-between">
              <strong class="text-dark small"><?= htmlspecialchars($rev['reviewer_name']) ?></strong>
              <span class="text-warning small fw-bold"><?= str_repeat('★', (int)$rev['rating']) ?></span>
            </div>
            <p class="small text-secondary mb-0 mt-1"><?= htmlspecialchars($rev['comment']) ?></p>
          </div>
        <?php endforeach; ?>
      </div>
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
