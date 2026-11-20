let myItems = [];
let offers = [];
let wishlists = [];
const bsToast = new bootstrap.Toast(document.getElementById("dashToast"));

function showToast(msg) {
  document.getElementById("dashToastMsg").textContent = msg;
  bsToast.show();
}

function formatNaira(amount) {
  return "₦" + (Number(amount) || 0).toLocaleString("en-NG");
}

window.copyRefLink = function () {
  const inp = document.getElementById("refLinkInput");
  inp.select();
  navigator.clipboard?.writeText(inp.value);
  showToast("Referral link copied! Share to earn +1 Spotlight Boost per signup.");
};

function updateStats() {
  const pending = offers.filter((o) => o.status === "Pending" || o.status === "In Escrow").length;
  const accepted = offers.filter((o) => o.status === "Accepted").length;
  document.getElementById("statListings").textContent = myItems.length;
  document.getElementById("statIncoming").textContent = pending;
  document.getElementById("statAccepted").textContent = accepted;
  document.getElementById("statWishlist").textContent = wishlists.length;
  document.getElementById("badgeIncomingCount").textContent = pending;
}

function renderOffers() {
  const container = document.getElementById("incomingOffersList");
  container.innerHTML = "";
  if (offers.length === 0) {
    container.innerHTML = `<div class="offer-card text-center text-muted py-5">No swap proposals received yet.</div>`;
    updateStats();
    return;
  }

  offers.forEach((offer) => {
    let badgeClass = "status-pending";
    if (offer.status === "In Escrow") badgeClass = "status-escrow";
    if (offer.status === "Accepted") badgeClass = "status-accepted";
    if (offer.status === "Declined") badgeClass = "status-declined";

    const phoneClean = (offer.proposer_phone || "").replace(/\D/g, "").replace(/^0/, "234") || "2348000000000";
    const waMsg = encodeURIComponent(
      `Hi ${offer.proposer_name}, regarding your swap offer (${offer.offered_item}) for my ${offer.my_item_title} on DFQ Trade Crow.`
    );

    let actionButtons = "";
    if (offer.status === "Pending") {
      actionButtons = `
        <button type="button" class="btn btn-outline-danger btn-sm px-3" onclick="respondOffer(${offer.id}, 'Declined')">Decline</button>
        <button type="button" class="btn btn-outline-sky btn-sm px-3" onclick="openCounterModal(${offer.id})">Counter Offer</button>
        <button type="button" class="btn btn-primary btn-sm px-3" onclick="respondOffer(${offer.id}, 'In Escrow')"><i class="bi bi-shield-lock me-1"></i> Lock Escrow Hold</button>
        <button type="button" class="btn btn-sky btn-sm px-3" onclick="respondOffer(${offer.id}, 'Accepted')"><i class="bi bi-check-lg me-1"></i> Accept Swap</button>
      `;
    } else if (offer.status === "In Escrow") {
      actionButtons = `
        <button type="button" class="btn btn-outline-danger btn-sm px-3" onclick="respondOffer(${offer.id}, 'Pending')">Cancel Hold</button>
        <button type="button" class="btn btn-success btn-sm px-3.5" onclick="respondOffer(${offer.id}, 'Accepted')"><i class="bi bi-check2-all me-1"></i> Confirm Handover &amp; Complete</button>
      `;
    } else if (offer.status === "Accepted") {
      actionButtons =
        Number(offer.already_reviewed) === 0
          ? `<button type="button" class="btn btn-warning btn-sm px-3 fw-semibold" onclick="openRateModal(${offer.id}, '${offer.proposer_name}')"><i class="bi bi-star-fill me-1"></i> Rate Trader</button>`
          : `<span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-star-fill text-warning me-1"></i> Rated</span>`;
    } else {
      actionButtons = `<button type="button" class="btn btn-light border btn-sm px-3" onclick="respondOffer(${offer.id}, 'Pending')">Reopen Proposal</button>`;
    }

    const card = document.createElement("div");
    card.className = "offer-card";
    card.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
        <div>
          <span class="fw-bold text-dark"><i class="bi bi-person-circle text-sky me-1"></i>${offer.proposer_name}</span>
          <span class="text-muted small">(${offer.proposer_location}) &bull; ${offer.created_at}</span>
        </div>
        <span class="badge ${badgeClass} px-3 py-1.5 rounded-pill fw-semibold">${offer.status}</span>
      </div>
      <div class="row g-3 align-items-center">
        <div class="col-md-5">
          <div class="trade-side-box">
            <span class="text-uppercase fw-bold text-sky d-block mb-2" style="font-size: 0.7rem;">Your Item</span>
            <div class="d-flex align-items-center gap-3">
              <img src="${offer.my_item_img}" class="thumb-img" alt="" />
              <div>
                <div class="fw-bold text-dark small">${offer.my_item_title}</div>
                <div class="text-muted small">Est. Value: ${formatNaira(offer.my_item_value)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-2 text-center"><div class="swap-arrow-circle mx-auto"><i class="bi bi-arrow-left-right"></i></div></div>
        <div class="col-md-5">
          <div class="trade-side-box theirs">
            <span class="text-uppercase fw-bold text-secondary d-block mb-2" style="font-size: 0.7rem;">They Are Offering</span>
            <div class="fw-bold text-dark small">${offer.offered_item}</div>
            <div class="text-sky fw-bold small mt-1"><i class="bi bi-cash-coin me-1"></i>${offer.cash_topup}</div>
          </div>
        </div>
      </div>
      <div class="mt-3 p-2.5 px-3 rounded-3 bg-light small text-secondary"><strong>Note:</strong> "${offer.note || "No extra note"}"</div>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
        <a href="https://wa.me/${phoneClean}?text=${waMsg}" target="_blank" rel="noopener" class="btn btn-outline-success btn-sm px-3"><i class="bi bi-whatsapp me-1"></i> Chat on WhatsApp</a>
        <div class="d-flex flex-wrap gap-2">${actionButtons}</div>
      </div>
    `;
    container.appendChild(card);
  });
  updateStats();
}

function renderMyListings() {
  const tbody = document.getElementById("myListingsTable");
  tbody.innerHTML = "";
  if (myItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">You haven't posted any items yet.</td></tr>`;
    updateStats();
    return;
  }

  myItems.forEach((item) => {
    const isSwapped = item.status === "Swapped";
    const isFeatured = Number(item.is_featured) === 1;
    let pawnBadge = "";
    if (item.mode === "Pawn / Quick Sale" && item.pawn_due_date) {
      const daysLeft = Math.ceil((new Date(item.pawn_due_date) - new Date()) / (1000 * 60 * 60 * 24));
      pawnBadge = `<div class="small text-warning-emphasis fw-semibold mt-1"><i class="bi bi-stopwatch"></i> Buyback ${formatNaira(item.pawn_buyback)} (${daysLeft > 0 ? daysLeft + "d left" : "Due"}) &bull; <a href="ticket.html?id=${item.id}" target="_blank">Ticket</a></div>`;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="ps-4 py-3">
        <div class="d-flex align-items-center gap-3">
          <img src="${item.image_path}" class="thumb-img" alt="" />
          <div>
            <div class="fw-bold text-dark small">${item.title} ${isFeatured ? '<span class="badge bg-sky-primary ms-1">Spotlight</span>' : ""}</div>
            <div class="text-muted" style="font-size: 0.78rem;">${item.location} &bull; ${item.item_condition}</div>
          </div>
        </div>
      </td>
      <td class="py-3"><span class="badge bg-sky-light text-sky fw-semibold">${item.mode}</span>${pawnBadge}</td>
      <td class="py-3 small fw-medium text-dark" style="max-width: 220px;">${item.wanted}</td>
      <td class="py-3 fw-bold text-dark small">${formatNaira(item.est_value)}</td>
      <td class="py-3">${isSwapped ? `<span class="badge status-swapped px-2.5 py-1 rounded-pill">Swapped</span>` : `<span class="badge status-accepted px-2.5 py-1 rounded-pill">${item.status}</span>`}</td>
      <td class="pe-4 py-3 text-end">
        <div class="btn-group btn-group-sm">
          ${!isFeatured && !isSwapped ? `<button type="button" class="btn btn-sky" onclick="boostItem(${item.id})" title="Pin to top using 1 Spotlight Credit"><i class="bi bi-lightning-fill"></i> Boost</button>` : ""}
          <button type="button" class="btn btn-outline-sky" onclick="toggleItemStatus(${item.id})">${isSwapped ? "Relist" : "Mark Swapped"}</button>
          <button type="button" class="btn btn-outline-danger" onclick="deleteItem(${item.id})"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateStats();
}

function renderWishlists() {
  const box = document.getElementById("wishlistKeywordsList");
  box.innerHTML = wishlists
    .map(
      (w) => `
      <span class="badge bg-sky-light text-dark border border-sky px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
        <span>${w.keyword}</span>
        <button type="button" class="btn-close" style="font-size: 0.6rem;" onclick="removeWishlist(${w.id})"></button>
      </span>
    `
    )
    .join("");
  updateStats();
}

document.getElementById("wishlistForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const kw = document.getElementById("wishlistKeywordInput").value.trim();
  const res = await fetch("api/items.php?action=wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sub: "add", keyword: kw })
  });
  const data = await res.json();
  if (data.success) {
    e.target.reset();
    showToast(data.message);
    await loadDashboardData();
  }
});

window.removeWishlist = async function (id) {
  await fetch("api/items.php?action=wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sub: "remove", id })
  });
  await loadDashboardData();
};

window.boostItem = async function (itemId) {
  const res = await fetch("api/items.php?action=boost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId })
  });
  const data = await res.json();
  if (data.success) {
    showToast(data.message);
    await loadDashboardData();
  } else {
    alert(data.message);
  }
};

window.respondOffer = async function (offerId, decision) {
  const res = await fetch("api/offers.php?action=respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offer_id: offerId, decision })
  });
  const data = await res.json();
  if (data.success) {
    showToast(data.message);
    await loadDashboardData();
  } else {
    alert(data.message);
  }
};

window.openCounterModal = function (offerId) {
  const offer = offers.find((o) => Number(o.id) === Number(offerId));
  if (!offer) return;
  document.getElementById("counterOfferId").value = offerId;
  document.getElementById("counterSummary").textContent = `Countering ${offer.proposer_name}'s offer of "${offer.offered_item}".`;
  new bootstrap.Modal(document.getElementById("counterModal")).show();
};

document.getElementById("counterForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch("api/offers.php?action=respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offer_id: Number(document.getElementById("counterOfferId").value),
      decision: "Counter",
      cash_topup: document.getElementById("counterCashInput").value.trim(),
      note: document.getElementById("counterNoteInput").value.trim()
    })
  });
  const data = await res.json();
  if (data.success) {
    e.target.reset();
    bootstrap.Modal.getInstance(document.getElementById("counterModal")).hide();
    showToast(data.message);
    await loadDashboardData();
  }
});

window.openRateModal = function (offerId, partnerName) {
  document.getElementById("rateOfferId").value = offerId;
  document.getElementById("ratePartnerText").textContent = `Leave a rating for ${partnerName} on this completed swap:`;
  new bootstrap.Modal(document.getElementById("rateModal")).show();
};

document.getElementById("rateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch("api/offers.php?action=rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offer_id: Number(document.getElementById("rateOfferId").value),
      rating: Number(document.getElementById("rateScore").value),
      comment: document.getElementById("rateComment").value.trim()
    })
  });
  const data = await res.json();
  if (data.success) {
    e.target.reset();
    bootstrap.Modal.getInstance(document.getElementById("rateModal")).hide();
    showToast(data.message);
    await loadDashboardData();
  }
});

window.toggleItemStatus = async function (itemId) {
  const res = await fetch("api/items.php?action=toggle_status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId })
  });
  const data = await res.json();
  if (data.success) {
    showToast(data.message);
    await loadDashboardData();
  }
};

window.deleteItem = async function (itemId) {
  if (!confirm("Delete this listing permanently?")) return;
  const res = await fetch("api/items.php?action=delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId })
  });
  const data = await res.json();
  if (data.success) {
    showToast(data.message);
    await loadDashboardData();
  }
};

async function loadDashboardData() {
  const meRes = await fetch("api/auth.php?action=me");
  const meData = await meRes.json();
  if (!meData.authenticated) {
    document.getElementById("dashSubtitle").textContent = "Sign in required to view your active deals.";
    document.getElementById("loginPromptBox").classList.remove("d-none");
    renderOffers();
    renderMyListings();
    renderWishlists();
    return;
  }
  document.getElementById("loginPromptBox").classList.add("d-none");
  document.getElementById("dashSubtitle").textContent = `Signed in as ${meData.user.full_name} (${meData.user.location})`;

  const storeLink = document.getElementById("myStorefrontLink");
  storeLink.href = `trader.html?id=${meData.user.id}`;
  storeLink.classList.remove("d-none");

  document.getElementById("referralBox").classList.remove("d-none");
  document.getElementById("creditCount").textContent = meData.user.spotlight_credits;
  const baseUrl = window.location.href.replace("dashboard.html", "index.html");
  document.getElementById("refLinkInput").value = `${baseUrl}?ref=${meData.user.referral_code}`;

  const [itemsRes, offersRes, wishRes] = await Promise.all([
    fetch("api/items.php?action=list&mine=1"),
    fetch("api/offers.php?action=incoming"),
    fetch("api/items.php?action=wishlist")
  ]);
  const itemsJson = await itemsRes.json();
  const offersJson = await offersRes.json();
  const wishJson = await wishRes.json();

  myItems = itemsJson.success ? itemsJson.items : [];
  offers = offersJson.success ? offersJson.offers : [];
  wishlists = wishJson.success ? wishJson.keywords : [];

  renderOffers();
  renderMyListings();
  renderWishlists();
}

loadDashboardData();
