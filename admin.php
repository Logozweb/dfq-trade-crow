<?php
define('SKIP_JSON_HEADER', true);
require_once __DIR__ . '/api/config.php';

$isAdmin = false;
if (isset($_SESSION['user_id'])) {
    $stmt = $pdo->prepare("SELECT id, full_name, is_admin FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $adminUser = $stmt->fetch();
    if ($adminUser && (int) $adminUser['is_admin'] === 1) {
        $isAdmin = true;
    }
}

$flash = '';
if ($isAdmin && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $act = $_POST['act'] ?? '';
    $targetId = (int) ($_POST['id'] ?? 0);

    if ($act === 'remove_item' && $targetId) {
        $pdo->prepare("UPDATE items SET status = 'Removed' WHERE id = ?")->execute([$targetId]);
        $flash = "Listing #{$targetId} removed from public feed.";
    } elseif ($act === 'restore_item' && $targetId) {
        $pdo->prepare("UPDATE items SET status = 'Active', is_reported = 0, report_reason = NULL WHERE id = ?")->execute([$targetId]);
        $flash = "Listing #{$targetId} cleared and restored to Active.";
    } elseif ($act === 'toggle_admin' && $targetId && $targetId !== (int) $_SESSION['user_id']) {
        $pdo->prepare("UPDATE users SET is_admin = 1 - is_admin WHERE id = ?")->execute([$targetId]);
        $flash = "User #{$targetId} admin role updated.";
    }
}

$stats = [
    'users'    => (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
    'items'    => (int) $pdo->query("SELECT COUNT(*) FROM items")->fetchColumn(),
    'reported' => (int) $pdo->query("SELECT COUNT(*) FROM items WHERE is_reported = 1 AND status != 'Removed'")->fetchColumn(),
    'swapped'  => (int) $pdo->query("SELECT COUNT(*) FROM items WHERE status = 'Swapped'")->fetchColumn(),
];

$allItems = $isAdmin ? $pdo->query("SELECT i.*, u.full_name AS owner_name, u.email AS owner_email FROM items i JOIN users u ON i.user_id = u.id ORDER BY i.is_reported DESC, i.created_at DESC")->fetchAll() : [];
$allUsers = $isAdmin ? $pdo->query("SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, is_admin, created_at FROM users ORDER BY created_at DESC")->fetchAll() : [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Moderation | DFQ Trade Crow</title>
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
      <a class="navbar-brand fw-bold" href="index.html">DFQ <span class="text-sky">Trade Crow</span> <span class="badge bg-dark ms-2">Admin</span></a>
      <a href="index.html" class="btn btn-outline-sky btn-sm">Back to Marketplace</a>
      <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1" data-theme-toggle title="Toggle Dark/Light Theme"><i class="bi bi-moon-stars-fill"></i><span class="theme-label d-none d-sm-inline">Dark</span></button>
      </div>
  </nav>

  <div class="container py-4">
    <?php if (!$isAdmin): ?>
      <div class="alert alert-warning rounded-4 p-4 shadow-sm">
        <h5 class="fw-bold"><i class="bi bi-shield-lock-fill me-2"></i>Admin Access Required</h5>
        <p class="mb-0">Log in on <a href="index.html">index.html</a> using an administrator account (first registered user gets Admin automatically).</p>
      </div>
    <?php else: ?>
      <?php if ($flash): ?>
        <div class="alert alert-success alert-dismissible fade show rounded-3"><?= htmlspecialchars($flash) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
      <?php endif; ?>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm rounded-4 p-3"><small class="text-muted">Registered Traders</small><h3 class="fw-bold mb-0"><?= $stats['users'] ?></h3></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm rounded-4 p-3"><small class="text-muted">Total Listings</small><h3 class="fw-bold mb-0"><?= $stats['items'] ?></h3></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm rounded-4 p-3"><small class="text-danger fw-semibold">Flagged / Reported</small><h3 class="fw-bold text-danger mb-0"><?= $stats['reported'] ?></h3></div></div>
        <div class="col-6 col-md-3"><div class="card border-0 shadow-sm rounded-4 p-3"><small class="text-muted">Completed Swaps</small><h3 class="fw-bold text-sky mb-0"><?= $stats['swapped'] ?></h3></div></div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div class="card-header bg-white py-3 fw-bold">Moderate Marketplace Listings &amp; Serial Flags</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0 small">
            <thead class="table-light">
              <tr><th>ID</th><th>Photo</th><th>Title &amp; Serial</th><th>Owner</th><th>Receipt</th><th>Status / Flag</th><th class="text-end">Action</th></tr>
            </thead>
            <tbody>
              <?php foreach ($allItems as $it): ?>
              <tr class="<?= (int)$it['is_reported'] === 1 ? 'table-danger' : '' ?>">
                <td>#<?= (int)$it['id'] ?></td>
                <td><img src="<?= htmlspecialchars($it['image_path']) ?>" style="width:44px;height:44px;object-fit:cover;border-radius:8px;" alt="" /></td>
                <td>
                  <div class="fw-bold"><?= htmlspecialchars($it['title']) ?></div>
                  <div class="text-muted">SN/IMEI: <?= htmlspecialchars($it['serial_imei'] ?: 'None') ?></div>
                </td>
                <td><?= htmlspecialchars($it['owner_name']) ?><br><span class="text-muted"><?= htmlspecialchars($it['owner_email']) ?></span></td>
                <td><?= $it['receipt_path'] ? '<a href="'.htmlspecialchars($it['receipt_path']).'" target="_blank" class="badge bg-success text-decoration-none">View Receipt</a>' : '<span class="text-muted">None</span>' ?></td>
                <td>
                  <span class="badge bg-secondary"><?= htmlspecialchars($it['status']) ?></span>
                  <?php if ((int)$it['is_reported'] === 1): ?>
                    <div class="text-danger fw-bold mt-1">Flagged: <?= htmlspecialchars($it['report_reason'] ?? '') ?></div>
                  <?php endif; ?>
                </td>
                <td class="text-end">
                  <form method="POST" class="d-inline">
                    <input type="hidden" name="id" value="<?= (int)$it['id'] ?>" />
                    <?php if ($it['status'] !== 'Removed'): ?>
                      <button name="act" value="remove_item" class="btn btn-outline-danger btn-sm">Remove</button>
                    <?php else: ?>
                      <button name="act" value="restore_item" class="btn btn-outline-success btn-sm">Restore</button>
                    <?php endif; ?>
                  </form>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white py-3 fw-bold">Registered Users &amp; Referrals</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0 small">
            <thead class="table-light">
              <tr><th>ID</th><th>Name</th><th>Email / Phone</th><th>Ref Code</th><th>Boost Credits</th><th>Role</th><th class="text-end">Action</th></tr>
            </thead>
            <tbody>
              <?php foreach ($allUsers as $u): ?>
              <tr>
                <td>#<?= (int)$u['id'] ?></td>
                <td class="fw-bold"><?= htmlspecialchars($u['full_name']) ?></td>
                <td><?= htmlspecialchars($u['email']) ?> &bull; <?= htmlspecialchars($u['phone']) ?></td>
                <td><code><?= htmlspecialchars($u['referral_code']) ?></code></td>
                <td><?= (int)$u['spotlight_credits'] ?></td>
                <td><?= (int)$u['is_admin'] === 1 ? '<span class="badge bg-primary">Admin</span>' : '<span class="badge bg-light text-dark border">Trader</span>' ?></td>
                <td class="text-end">
                  <?php if ((int)$u['id'] !== (int)$_SESSION['user_id']): ?>
                  <form method="POST" class="d-inline">
                    <input type="hidden" name="id" value="<?= (int)$u['id'] ?>" />
                    <button name="act" value="toggle_admin" class="btn btn-outline-secondary btn-sm">Toggle Admin</button>
                  </form>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    <?php endif; ?>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
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
