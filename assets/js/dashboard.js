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
        <button type="button" class="btn btn-outline-danger btn-sm px-3" onclick="openDeclineModal(${offer.id})">Decline</button>
        <button type="button" class="btn btn-outline-sky btn-sm px-3" onclick="openCounterModal(${offer.id})">Counter Offer</button>
        <button type="button" class="btn btn-primary btn-sm px-3" onclick="respondOffer(${offer.id}, 'In Escrow')"><i class="bi bi-shield-lock me-1"></i> Lock Escrow Hold</button>
        <button type="button" class="btn btn-sky btn-sm px-3" onclick="respondOffer(${offer.id}, 'Accepted')"><i class="bi bi-check-lg me-1"></i> Accept Swap</button>
      `;
    } else if (offer.status === "In Escrow") {
      actionButtons = `
        <button type="button" class="btn btn-outline-danger btn-sm px-3" onclick="respondOffer(${offer.id}, 'Pending')">Cancel Hold</button>
        <button type="button" class="btn btn-success btn-sm px-3" onclick="openHandoverOtpModal(${offer.id}, '${offer.owner_otp || '4829'}')"><i class="bi bi-shield-check me-1"></i> Dual-OTP Handover</button>
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
    let pawnActions = "";
    if (item.mode === "Pawn / Quick Sale" && item.pawn_due_date) {
      const daysLeft = Math.ceil((new Date(item.pawn_due_date) - new Date()) / (1000 * 60 * 60 * 24));
      const isRedeemed = Boolean(item.redeemed_at);
      const isLiquidated = Number(item.is_liquidated) === 1;

      if (isRedeemed) {
        pawnBadge = `<div class="badge bg-success-subtle text-success mt-1"><i class="bi bi-patch-check-fill me-1"></i>Redeemed &bull; Cleared</div>`;
      } else if (isLiquidated) {
        pawnBadge = `<div class="badge bg-danger-subtle text-danger mt-1"><i class="bi bi-tag-fill me-1"></i>Liquidated Clearance</div>`;
      } else {
        const pctLeft = Math.max(0, Math.min(100, Math.round((daysLeft / 30) * 100)));
        pawnBadge = `
          <div class="mt-1 small">
            <div class="text-warning-emphasis fw-bold"><i class="bi bi-stopwatch"></i> ${daysLeft > 0 ? daysLeft + "d left to redeem" : "Overdue"} &bull; Buyback: ${formatNaira(item.pawn_buyback)}</div>
            <div class="progress mt-1" style="height: 4px; max-width: 160px;">
              <div class="progress-bar ${daysLeft <= 3 ? 'bg-danger' : 'bg-warning'}" style="width: ${pctLeft}%;"></div>
            </div>
            <a href="ticket.html?id=${item.id}" target="_blank" class="small fw-semibold text-sky">View Ticket</a>
          </div>
        `;
        pawnActions = `
          <button type="button" class="btn btn-sm btn-success" onclick="redeemPawnCollateral(${item.id})" title="Settle buyback & redeem ownership"><i class="bi bi-wallet2 me-1"></i>Redeem</button>
          <button type="button" class="btn btn-sm btn-outline-warning" onclick="liquidatePawnCollateral(${item.id})" title="Convert to Quick Sale clearance"><i class="bi bi-tag me-1"></i>Liquidate</button>
        `;
      }
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
          ${pawnActions}
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

let selectedReviewTags = [];

window.toggleReviewTag = function (btn, tag) {
  if (selectedReviewTags.includes(tag)) {
    selectedReviewTags = selectedReviewTags.filter(t => t !== tag);
    btn.classList.remove('bg-sky-primary', 'text-white');
  } else {
    selectedReviewTags.push(tag);
    btn.classList.add('bg-sky-primary', 'text-white');
  }
};

window.openRateModal = function (offerId, partnerName) {
  selectedReviewTags = [];
  document.querySelectorAll("#rateAttributeTags .quick-chip").forEach(b => b.classList.remove('bg-sky-primary', 'text-white'));
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
      comment: document.getElementById("rateComment").value.trim(),
      tags: selectedReviewTags
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

window.openDeclineModal = function (offerId) {
  document.getElementById("declineOfferId").value = offerId;
  new bootstrap.Modal(document.getElementById("declineOfferModal")).show();
};

document.getElementById("declineOfferForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const offerId = Number(document.getElementById("declineOfferId").value);
  const reason = document.querySelector('input[name="declineReason"]:checked')?.value || 'Value mismatch';

  const res = await fetch("api/offers.php?action=respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offer_id: offerId, decision: "Declined", decline_reason: reason })
  });
  const data = await res.json();
  if (data.success) {
    bootstrap.Modal.getInstance(document.getElementById("declineOfferModal"))?.hide();
    showDashToast("Offer declined (" + reason + ")");
    await loadDashboardData();
  }
});

window.redeemPawnCollateral = async function (itemId) {
  if (!confirm("Are you ready to settle the buyback total and redeem this collateral?")) return;
  try {
    const res = await fetch("/api/pawn/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId })
    });
    const data = await res.json();
    showDashToast(data.message);
    if (data.success) await loadDashboardData();
  } catch (err) {
    showDashToast("Error: " + err.message);
  }
};

window.liquidatePawnCollateral = async function (itemId) {
  if (!confirm("Convert this unredeemed collateral to a Quick Sale listing on the marketplace?")) return;
  try {
    const res = await fetch("/api/pawn/liquidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId })
    });
    const data = await res.json();
    showDashToast(data.message);
    if (data.success) await loadDashboardData();
  } catch (err) {
    showDashToast("Error: " + err.message);
  }
};

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


// =========================================================
// DASHBOARD INQUIRIES & MESSAGING TAB CONTROLLER
// =========================================================

let activeDashChat = {
  itemId: null,
  partnerId: null,
  partnerName: ""
};

async function loadDashboardConversations() {
  const listEl = document.getElementById("dashConvosList");
  if (!listEl) return;

  try {
    const res = await fetch("/api/messages/conversations");
    const data = await res.json();

    const badge = document.getElementById("badgeChatCount");
    const totalUnread = (data.conversations || []).reduce((acc, c) => acc + (c.unread_count || 0), 0);
    if (badge) {
      badge.textContent = totalUnread;
      badge.classList.toggle("d-none", totalUnread === 0);
    }

    if (!data.success || !data.conversations || data.conversations.length === 0) {
      listEl.innerHTML = `<div class="p-4 text-center text-muted small">No inquiries or buyer chats yet.</div>`;
      return;
    }

    listEl.innerHTML = data.conversations.map((c) => {
      const timeStr = new Date(c.last_message_at).toLocaleDateString([], { month: "short", day: "numeric" });
      const isActive = activeDashChat.itemId === c.item_id && activeDashChat.partnerId === c.partner_id;
      return `
        <a href="#" class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${isActive ? 'bg-sky-tint' : ''}" onclick="selectDashConversation(${c.item_id}, ${c.partner_id}, '${escapeHtml(c.partner_name)}', '${escapeHtml(c.item_title)}'); return false;">
          <img src="${c.item_image || 'assets/img/phone.svg'}" style="width:44px;height:44px;object-fit:cover;border-radius:10px;" alt="" />
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-dark small text-truncate" style="max-width:140px;">${c.partner_name}</strong>
              <small class="text-muted" style="font-size:0.68rem;">${timeStr}</small>
            </div>
            <div class="small text-sky fw-semibold text-truncate mb-0.5">${c.item_title}</div>
            <p class="small text-secondary text-truncate mb-0" style="font-size:0.75rem;">${c.last_message}</p>
          </div>
          ${c.unread_count > 0 ? `<span class="badge bg-danger rounded-pill">${c.unread_count}</span>` : ""}
        </a>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading dashboard convos:", err);
  }
}

window.selectDashConversation = async function (itemId, partnerId, partnerName, itemTitle) {
  activeDashChat.itemId = itemId;
  activeDashChat.partnerId = partnerId;
  activeDashChat.partnerName = partnerName;

  document.getElementById("dashChatTitle").textContent = `${partnerName} • ${itemTitle}`;
  document.getElementById("dashChatSendForm")?.classList.remove("d-none");

  await loadDashChatMessages();
  loadDashboardConversations();
};

async function loadDashChatMessages() {
  const container = document.getElementById("dashChatMessages");
  if (!container || !activeDashChat.itemId) return;

  try {
    const res = await fetch(`/api/messages/thread?item_id=${activeDashChat.itemId}&other_user_id=${activeDashChat.partnerId}`);
    const data = await res.json();

    if (!data.success || !data.messages || data.messages.length === 0) {
      container.innerHTML = `<div class="text-center text-muted small my-auto">No messages exchanged yet. Send a reply below.</div>`;
      return;
    }

    container.innerHTML = data.messages.map((m) => {
      const isMine = m.sender_id !== activeDashChat.partnerId;
      const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="message-bubble ${isMine ? 'outgoing' : 'incoming'}">
          <div class="small fw-semibold mb-0.5 opacity-75" style="font-size:0.72rem;">${isMine ? 'You' : m.sender_name}</div>
          <div>${m.message}</div>
          <div class="message-time">${timeStr}</div>
        </div>
      `;
    }).join("");
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error("Error loading chat messages:", err);
  }
}

const dashChatSendForm = document.getElementById("dashChatSendForm");
if (dashChatSendForm) {
  dashChatSendForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("dashChatInput");
    const msg = (input?.value || "").trim();
    if (!msg || !activeDashChat.itemId) return;

    input.value = "";
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: activeDashChat.itemId,
          recipient_id: activeDashChat.partnerId,
          message: msg
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadDashChatMessages();
        loadDashboardConversations();
      } else {
        showDashToast(data.message || "Failed to send message.");
      }
    } catch (err) {
      showDashToast("Error: " + err.message);
    }
  });
}

// =========================================================
// ESCROW DUAL-OTP HANDOVER VERIFICATION
// =========================================================

window.openHandoverOtpModal = function (offerId, myCode) {
  document.getElementById("currentOtpOfferId").value = offerId;
  document.getElementById("myOtpCodeDisplay").textContent = myCode || "4829";
  document.getElementById("inputPartnerOtp").value = "";
  new bootstrap.Modal(document.getElementById("otpHandoverModal")).show();
};

window.confirmHandoverOtp = async function () {
  const offerId = document.getElementById("currentOtpOfferId")?.value;
  const partnerOtp = document.getElementById("inputPartnerOtp")?.value.trim();

  if (!partnerOtp) {
    showDashToast("Please enter the 4-digit code shown on the trader's phone.");
    return;
  }

  try {
    const res = await fetch("/api/offers/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_id: offerId, otp: partnerOtp })
    });
    const data = await res.json();

    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById("otpHandoverModal"))?.hide();
      showDashToast("Dual-OTP Handover Verified! Escrow released.");
      await loadDashboardData();
    } else {
      showDashToast(data.message || "Invalid code. Please try again.");
    }
  } catch (err) {
    showDashToast("Handover error: " + err.message);
  }
};

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

// Hook conversation loader into loadDashboardData
const origLoadDashboardData = loadDashboardData;
loadDashboardData = async function () {
  if (typeof origLoadDashboardData === "function") {
    await origLoadDashboardData();
  }
  await loadDashboardConversations();
};
