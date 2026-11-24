let currentUser = null;
let activeMode = "all";
let activeCategory = "all";
let activeLocation = "all";
let searchQuery = "";
let liveItems = [];

const LOCAL_KEYS = {
  users: "dfq_local_users_v1",
  session: "dfq_local_session_v1",
  customItems: "dfq_local_custom_items_v1",
  offers: "dfq_local_offers_v1",
  favorites: "dfq_local_favorites_v1"
};

function getFavoriteIds() {
  return readLocalStore(LOCAL_KEYS.favorites, []);
}

function updateFavBadgeCount() {
  const badge = document.getElementById("favCountBadge");
  if (badge) badge.textContent = String(getFavoriteIds().length);
}

function triggerConfettiBurst(originEl) {
  const colors = ["#0EA5E9", "#38BDF8", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;
  if (originEl && originEl.getBoundingClientRect) {
    const rect = originEl.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  }
  for (let i = 0; i < 22; i++) {
    const dot = document.createElement("span");
    dot.className = "dfq-confetti-piece";
    const angle = (Math.PI * 2 * i) / 22 + (Math.random() - 0.5) * 0.4;
    const dist = 55 + Math.random() * 95;
    dot.style.left = `${startX}px`;
    dot.style.top = `${startY}px`;
    dot.style.backgroundColor = colors[i % colors.length];
    dot.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    dot.style.setProperty("--dy", `${Math.sin(angle) * dist + 40}px`);
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 1400);
  }
}

window.toggleFavoriteItem = function (id, btnEl) {
  const numId = Number(id);
  let favs = getFavoriteIds();
  const exists = favs.includes(numId);
  if (exists) {
    favs = favs.filter((f) => f !== numId);
    showToast("Removed from Saved Favorites.");
  } else {
    favs.push(numId);
    triggerConfettiBurst(btnEl);
    showToast("Saved to your Favorites Watchlist!");
  }
  writeLocalStore(LOCAL_KEYS.favorites, favs);
  updateFavBadgeCount();
  if (activeMode === "favorites") {
    loadLiveItems();
  } else if (btnEl) {
    btnEl.classList.toggle("is-favorited", !exists);
    const icon = btnEl.querySelector("i");
    if (icon) icon.className = !exists ? "bi bi-heart-fill" : "bi bi-heart";
  }
};

function readLocalStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeLocalStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function getAllCatalogItems() {
  const custom = readLocalStore(LOCAL_KEYS.customItems, []);
  return [...custom, ...FALLBACK_CATALOG];
}


const FALLBACK_CATALOG = [
  {
    id: 101,
    user_id: 1,
    title: 'iPhone 15 Pro Max (256GB, Natural Titanium)',
    category: 'Electronics & Phones',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'Samsung Galaxy S24 Ultra OR MacBook Pro M2 + Cash',
    est_value: 1120000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '358492019485721',
    receipt_path: 'assets/img/ip15.jpg',
    is_featured: 1,
    status: "Active",
    image_path: 'assets/img/ip15.jpg',
    gallery: ['assets/img/ip15.jpg'],
    description: 'Clean iPhone 15 Pro Max, 92% battery health, Face ID & True Tone working 100%, receipt available.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 102,
    user_id: 1,
    title: 'Samsung Galaxy S24 Ultra (512GB, Titanium Grey)',
    category: 'Electronics & Phones',
    mode: 'Barter Only',
    item_condition: 'Brand New',
    location: 'Abuja',
    wanted: 'MacBook Pro M2/M3 OR Workstation Desktop System',
    est_value: 1280000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '352910485712093',
    receipt_path: 'assets/img/sam24.jpg',
    is_featured: 1,
    status: "Active",
    image_path: 'assets/img/sam24.jpg',
    gallery: ['assets/img/sam24.jpg'],
    description: 'S-Pen included, 512GB storage, crisp AMOLED display, open for straight barters or high-spec swaps.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 103,
    user_id: 1,
    title: 'iPhone 13 Pro (128GB, Sierra Blue)',
    category: 'Electronics & Phones',
    mode: 'Pawn / Quick Sale',
    item_condition: 'Neatly Used',
    location: 'Yaba, Lagos',
    wanted: '14-Day Quick Cash Pawn (₦320k) OR iPad Air 5 + Cash',
    est_value: 560000,
    pawn_advance: 320000,
    pawn_buyback: 352000,
    pawn_due_date: '2026-12-04',
    serial_imei: '354918273645019',
    receipt_path: 'assets/img/ip13.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/ip13.jpg',
    gallery: ['assets/img/ip13.jpg'],
    description: 'Factory unlocked, 88% battery health, zero cracks, eligible for verifiable digital pawn ticket.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 104,
    user_id: 1,
    title: 'Google Pixel 8 Pro (256GB, Obsidian Black)',
    category: 'Electronics & Phones',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Ikeja, Lagos',
    wanted: 'iPhone 14 Pro OR Gaming Laptop',
    est_value: 740000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '359102938475610',
    receipt_path: 'assets/img/gop8.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/gop8.jpg',
    gallery: ['assets/img/gop8.jpg'],
    description: 'Incredible AI camera system, clean screen, comes with fast charger and protective case.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 105,
    user_id: 1,
    title: 'Samsung Galaxy Z Fold 5 (512GB, Phantom Black)',
    category: 'Electronics & Phones',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'iPhone 15 Pro Max OR Toyota Corolla Top-Up Deal',
    est_value: 1190000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '357483920192834',
    receipt_path: 'assets/img/samf5.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/samf5.jpg',
    gallery: ['assets/img/samf5.jpg'],
    description: 'Smooth inner folding screen, zero hinge issues, great for multitasking and trading.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 106,
    user_id: 1,
    title: '6x6 Orthopedic Queen Bed Frame & Mattress',
    category: 'Furniture',
    mode: 'Barter Only',
    item_condition: 'Neatly Used',
    location: 'Yaba, Lagos',
    wanted: '3-Seater Modern Couch OR Double-Door Fridge',
    est_value: 240000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '',
    receipt_path: '',
    is_featured: 1,
    status: "Active",
    image_path: 'assets/img/66-bdf.jpg',
    gallery: ['assets/img/66-bdf.jpg'],
    description: 'Sturdy solid wood 6x6 bed frame with high-density orthopedic mattress. Zero squeaks and super comfortable.',
    owner_name: "DFQ Fittings",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 107,
    user_id: 1,
    title: '3-Seater Modern Grey Fabric Couch',
    category: 'Furniture',
    mode: 'Barter Only',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'Queen Bed Frame OR 55-inch Smart TV',
    est_value: 175000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '',
    receipt_path: '',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/3sch.jpg',
    gallery: ['assets/img/3sch.jpg'],
    description: 'Spacious, clean 3-seater couch with firm cushions and sleek slate-grey upholstery.',
    owner_name: "DFQ Fittings",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 108,
    user_id: 1,
    title: 'L-Shaped Executive Sectional Living Room Sofa',
    category: 'Furniture',
    mode: 'Cash or Swap',
    item_condition: 'Brand New',
    location: 'Abuja',
    wanted: 'King Size Tufted Bed + Mattress OR ₦360,000 Cash',
    est_value: 380000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '',
    receipt_path: 'assets/img/lsch.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/lsch.jpg',
    gallery: ['assets/img/lsch.jpg'],
    description: 'Brand new L-shaped sectional sofa with throw pillows and stain-resistant fabric.',
    owner_name: "DFQ Fittings",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 109,
    user_id: 1,
    title: '4.5x6 Semi-Orthopedic Bed Frame & Spring Mattress',
    category: 'Furniture',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Ota, Ogun',
    wanted: '3.5kVA Generator OR ₦135,000 Cash',
    est_value: 150000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '',
    receipt_path: '',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/4by6bd.jpg',
    gallery: ['assets/img/4by6bd.jpg'],
    description: 'Compact and durable 4.5x6 bed setup ideal for studio or guest bedrooms.',
    owner_name: "DFQ Fittings",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 110,
    user_id: 1,
    title: '6-Seater Hardwood Dining Table & Padded Chairs',
    category: 'Furniture',
    mode: 'Barter Only',
    item_condition: 'Neatly Used',
    location: 'Ikeja, Lagos',
    wanted: '3-Seater Fabric Couch + Center Table OR Inverter Fridge',
    est_value: 260000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '',
    receipt_path: '',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/din-tab.jpg',
    gallery: ['assets/img/din-tab.jpg'],
    description: 'Polished mahogany dining set with six cushioned chairs, zero scratches.',
    owner_name: "DFQ Fittings",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 111,
    user_id: 1,
    title: 'HP / Dell Core i7 Desktop System + 24" IPS Monitor',
    category: 'Electronics & Phones',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Ikeja, Lagos',
    wanted: 'MacBook Air M1/M2 OR ₦520,000 Cash',
    est_value: 540000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'SYS-77482910',
    receipt_path: 'assets/img/hp-dell-i7.jpg',
    is_featured: 1,
    status: "Active",
    image_path: 'assets/img/hp-dell-i7.jpg',
    gallery: ['assets/img/hp-dell-i7.jpg'],
    description: 'Complete office/editing system: Intel Core i7, 32GB RAM, 1TB NVMe SSD, 24-inch Full HD monitor, keyboard & mouse.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 112,
    user_id: 1,
    title: 'MacBook Pro M2 (16GB RAM / 512GB SSD)',
    category: 'Electronics & Phones',
    mode: 'Pawn / Quick Sale',
    item_condition: 'Neatly Used',
    location: 'Yaba, Lagos',
    wanted: '21-Day Buyback Pawn (₦450k) OR iPad Pro M2',
    est_value: 1150000,
    pawn_advance: 450000,
    pawn_buyback: 495000,
    pawn_due_date: '2026-12-11',
    serial_imei: 'C02ZW123MD6R',
    receipt_path: 'assets/img/m2-mac.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/m2-mac.jpg',
    gallery: ['assets/img/m2-mac.jpg'],
    description: 'Fast Apple Silicon laptop ideal for developers, video editors, and traders; eligible for digital pawn ticket.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 113,
    user_id: 1,
    title: 'Custom RTX 4060 Gaming & Video Editing PC System',
    category: 'Electronics & Phones',
    mode: 'Cash or Swap',
    item_condition: 'Brand New',
    location: 'Lekki, Lagos',
    wanted: 'MacBook Pro M3 OR iPhone 15 Pro Max + Cash',
    est_value: 1450000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'SYS-90481234',
    receipt_path: 'assets/img/gpc.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/gpc.jpg',
    gallery: ['assets/img/gpc.jpg'],
    description: 'Ryzen 7, 32GB DDR5, 1TB Gen4 SSD, RTX 4060 8GB GPU, tempered glass RGB case.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 114,
    user_id: 1,
    title: 'HP Spectre x360 14" 2-in-1 Touchscreen Laptop',
    category: 'Electronics & Phones',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Abuja',
    wanted: 'iPad Pro 12.9" + Magic Keyboard OR ₦760,000 Cash',
    est_value: 790000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: '5CD31982KL',
    receipt_path: 'assets/img/hp-spec.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/hp-spec.jpg',
    gallery: ['assets/img/hp-spec.jpg'],
    description: 'Convertible 360-degree OLED touchscreen laptop with stylus pen and backlit keyboard.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 115,
    user_id: 1,
    title: 'PlayStation 5 Disc Edition + 2 DualSense Pads',
    category: 'Electronics & Phones',
    mode: 'Barter Only',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'Gaming Laptop OR iPad Air + Cash',
    est_value: 620000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'S01-9928374',
    receipt_path: 'assets/img/ps-pad.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/ps-pad.jpg',
    gallery: ['assets/img/ps-pad.jpg'],
    description: 'Comes with two wireless controllers, HDMI & power cables, tested and running quietly.',
    owner_name: "DFQ Gadjet",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 116,
    user_id: 1,
    title: 'Toyota Corolla LE (Clean Title, Smooth Engine & AC)',
    category: 'Vehicles & Bikes',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'SUV Swap + Cash Top-Up OR Direct Cash Offer',
    est_value: 6800000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'VIN-2T1BURHE8FC294810',
    receipt_path: 'assets/img/ty-cr.jpg',
    is_featured: 1,
    status: "Active",
    image_path: 'assets/img/ty-cr.jpg',
    gallery: ['assets/img/ty-cr.jpg'],
    description: 'Well-maintained sedan with crisp gear shifts, chilling AC, intact interior, and complete vehicle papers.',
    owner_name: "DFQ Autos",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 117,
    user_id: 1,
    title: 'Lexus RX 350 SUV (First Body, Panoramic Roof)',
    category: 'Vehicles & Bikes',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Abuja',
    wanted: 'Toyota Camry 2018+ OR ₦14.5M Cash Offer',
    est_value: 14800000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'VIN-2T2BK1BA9FC382910',
    receipt_path: 'assets/img/rx-lx.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/rx-lx.jpg',
    gallery: ['assets/img/rx-lx.jpg'],
    description: 'Accident-free V6 SUV, leather seats, reverse camera, duty paid, ready for inspection.',
    owner_name: "DFQ Autos",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 118,
    user_id: 1,
    title: 'Honda Civic Sport Sedan (2017 Model)',
    category: 'Vehicles & Bikes',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Ikeja, Lagos',
    wanted: 'Toyota RAV4 OR Direct Cash / Bank Transfer',
    est_value: 8900000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'VIN-19XFC2F79HE019283',
    receipt_path: 'assets/img/hd-civ.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/hd-civ.jpg',
    gallery: ['assets/img/hd-civ.jpg'],
    description: 'Fuel-efficient i-VTEC engine, Apple CarPlay screen, alloy wheels, sharp suspension.',
    owner_name: "DFQ Autos",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 119,
    user_id: 1,
    title: '27.5" Alloy Trail & Commuter Bike (21-Speed)',
    category: 'Vehicles & Bikes',
    mode: 'Barter Only',
    item_condition: 'Brand New',
    location: 'Abuja',
    wanted: 'PS5 Console OR iPhone 13 / 14',
    est_value: 265000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'BIKE-992014',
    receipt_path: 'assets/img/bic-alloy.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/bic-alloy.jpg',
    gallery: ['assets/img/bic-alloy.jpg'],
    description: 'Lightweight alloy frame with front suspension, disc brakes, and smooth 21-speed gear shifting.',
    owner_name: "DFQ Autos",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 120,
    user_id: 1,
    title: '250cc Sport & Dispatch Motorbike (Registered)',
    category: 'Vehicles & Bikes',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Yaba, Lagos',
    wanted: 'MacBook Pro M1/M2 OR ₦920,000 Cash',
    est_value: 950000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'MOTO-4491028',
    receipt_path: 'assets/img/reg-bike.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/reg-bike.jpg',
    gallery: ['assets/img/reg-bike.jpg'],
    description: 'Low-mileage 250cc street bike with complete plate number & papers, strong torque.',
    owner_name: "DFQ Autos",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 121,
    user_id: 1,
    title: 'Foldable 48V Electric Commuter E-Bike',
    category: 'Vehicles & Bikes',
    mode: 'Pawn / Quick Sale',
    item_condition: 'Brand New',
    location: 'Lekki, Lagos',
    wanted: '21-Day Pawn (₦280k) OR iPhone 14 Pro',
    est_value: 520000,
    pawn_advance: 280000,
    pawn_buyback: 308000,
    pawn_due_date: '2026-12-11',
    serial_imei: 'EBK-771209',
    receipt_path: 'assets/img/fld-bic.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/fld-bic.jpg',
    gallery: ['assets/img/fld-bic.jpg'],
    description: '55km range per charge, removable lithium battery, LED headlight, folds into car trunk.',
    owner_name: "DFQ Autos",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 122,
    user_id: 1,
    title: '3.5kVA Pure Sine Inverter + 200Ah Battery',
    category: 'Home Appliances',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Abuja',
    wanted: '5kVA Hybrid Inverter OR ₦420,000 Cash',
    est_value: 440000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'INV-8849201',
    receipt_path: 'assets/img/inv.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/inv.jpg',
    gallery: ['assets/img/inv.jpg'],
    description: 'Reliable backup power system for home & office workloads; clean sine-wave output.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 123,
    user_id: 1,
    title: 'Double-Door Inverter Refrigerator (380L)',
    category: 'Home Appliances',
    mode: 'Cash or Swap',
    item_condition: 'Brand New',
    location: 'Ota, Ogun',
    wanted: 'L-Shaped Sofa OR ₦390,000 Cash',
    est_value: 410000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'FRG-551029',
    receipt_path: 'assets/img/fg.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/fg.jpg',
    gallery: ['assets/img/fg.jpg'],
    description: 'Energy-saving frost-free double-door refrigerator with fast cooling and spacious freezer.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 124,
    user_id: 1,
    title: '65" 4K UHD Smart OLED TV (Voice Remote)',
    category: 'Home Appliances',
    mode: 'Barter Only',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'MacBook Pro OR 3.5kVA Solar Inverter Setup',
    est_value: 690000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'TV-8839201',
    receipt_path: 'assets/img/tv-65.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/tv-65.jpg',
    gallery: ['assets/img/tv-65.jpg'],
    description: 'Ultra-thin bezel 4K smart TV with Netflix, YouTube, Dolby Audio, and wall bracket.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 125,
    user_id: 1,
    title: '1.5HP Dual Inverter Split Air Conditioner',
    category: 'Home Appliances',
    mode: 'Cash or Swap',
    item_condition: 'Brand New',
    location: 'Ikeja, Lagos',
    wanted: '6x6 Orthopedic Bed Set OR ₦340,000 Cash',
    est_value: 365000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'AC-1928374',
    receipt_path: 'assets/img/ac-hs.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/ac-hs.jpg',
    gallery: ['assets/img/ac-hs.jpg'],
    description: 'Super fast cooling, low power consumption (works on 2.5kVA+ inverter), complete copper kit.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 126,
    user_id: 1,
    title: '3.8kVA Copper Coil Key-Start Generator',
    category: 'Home Appliances',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Yaba, Lagos',
    wanted: 'Core i7 Laptop System OR ₦275,000 Cash',
    est_value: 295000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'GEN-661209',
    receipt_path: 'assets/img/gen-3.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/gen-3.jpg',
    gallery: ['assets/img/gen-3.jpg'],
    description: '100% copper winding, one-touch key start, low fuel consumption, powers AC & freezer.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 127,
    user_id: 1,
    title: 'Stainless Chronograph & Smartwatch Bundle',
    category: 'Fashion & Watches',
    mode: 'Pawn / Quick Sale',
    item_condition: 'Brand New',
    location: 'Ikeja, Lagos',
    wanted: 'Quick Cash Pawn (₦95k) OR Earbuds + Cash',
    est_value: 135000,
    pawn_advance: 95000,
    pawn_buyback: 104500,
    pawn_due_date: '2026-12-04',
    serial_imei: 'WTC-330192',
    receipt_path: 'assets/img/wt-steel.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/wt-steel.jpg',
    gallery: ['assets/img/wt-steel.jpg'],
    description: 'Classic steel timepiece with presentation box, available for quick swap or 14-day buyback pawn.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 128,
    user_id: 1,
    title: 'Apple Watch Ultra 2 (49mm Titanium + Alpine Loop)',
    category: 'Fashion & Watches',
    mode: 'Cash or Swap',
    item_condition: 'Neatly Used',
    location: 'Lekki, Lagos',
    wanted: 'iPad Mini 6 OR ₦580,000 Cash',
    est_value: 610000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: 'AWU2-991827',
    receipt_path: 'assets/img/wt-apple.jpg',
    is_featured: 0,
    status: "Active",
    image_path: 'assets/img/wt-apple.jpg',
    gallery: ['assets/img/wt-apple.jpg'],
    description: 'Sapphire crystal display, 36-hour battery life, dual-frequency GPS, original box & charger.',
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 129,
    user_id: 1,
    title: "Nintendo Switch OLED + Mario Kart 8 & 2 Joy-Cons",
    category: "Electronics & Phones",
    mode: "Barter Only",
    item_condition: "Neatly Used",
    location: "Lekki, Lagos",
    wanted: "iPad 9th/10th Gen OR Alloy Trail Bicycle",
    est_value: 340000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: "XTJ104829104",
    receipt_path: "assets/img/nineto.jpg",
    is_featured: 1,
    status: "Active",
    image_path: "assets/img/nineto.jpg",
    gallery: ["assets/img/nineto.jpg"],
    description: "Family-friendly 7-inch vibrant OLED gaming console with dock, HDMI cable, and Mario Kart 8 Deluxe.",
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  },
  {
    id: 130,
    user_id: 1,
    title: "2020 Hyundai Elantra SEL (Clean Sedan, Low Mileage)",
    category: "Vehicles & Bikes",
    mode: "Cash or Swap",
    item_condition: "Neatly Used",
    location: "Abuja",
    wanted: "Lexus RX 350 Top-Up Swap OR Direct Bank Transfer",
    est_value: 11200000,
    pawn_advance: null,
    pawn_buyback: null,
    pawn_due_date: null,
    serial_imei: "VIN-5NPD84LF4LH582910",
    receipt_path: "assets/img/hy-car.jpg",
    is_featured: 0,
    status: "Active",
    image_path: "assets/img/hy-car.jpg",
    gallery: ["assets/img/hy-car.jpg"],
    description: "Fuel-saving 2.0L engine, reverse camera, blind-spot monitor, cold AC, and verified customs papers.",
    owner_name: "DFQ Demo Trader",
    owner_phone: "08030001111",
    owner_rating: "5.0",
    review_count: 12
  }
];

const listingsGrid = document.getElementById("listingsGrid");
const emptyState = document.getElementById("emptyState");
const itemCount = document.getElementById("itemCount");
const bsToast = new bootstrap.Toast(document.getElementById("liveToast"));
const authModal = new bootstrap.Modal(document.getElementById("authModal"));

function showToast(msg) {
  document.getElementById("toastMessage").textContent = msg;
  bsToast.show();
}

function formatNaira(amount) {
  return "₦" + (Number(amount) || 0).toLocaleString("en-NG");
}

function cleanPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.startsWith("0") ? "234" + digits.slice(1) : (digits || "2348000000000");
}

function getBadgeClass(mode) {
  if (mode === "Barter Only") return "badge-barter";
  if (mode === "Cash or Swap") return "badge-cash-swap";
  return "badge-pawn";
}

// Auto-fill and recognize referral invitation banner if ?ref= is in URL
const urlParams = new URLSearchParams(window.location.search);
const initialRefCode = urlParams.get("ref");
if (initialRefCode) {
  const regRefInput = document.getElementById("regRefCode");
  if (regRefInput) regRefInput.value = initialRefCode;
  fetch(`/api/auth/referral-info?code=${encodeURIComponent(initialRefCode)}`)
    .then((r) => r.json())
    .then((res) => {
      const banner = document.getElementById("referralInviteBanner");
      const inviterText = document.getElementById("referralInviterText");
      if (res.success && res.data && banner && inviterText) {
        inviterText.textContent = `You were invited by ${res.data.inviter_name}! 1 Free Spotlight Credit unlocked upon sign-up.`;
        banner.classList.remove("d-none");
      }
    })
    .catch(() => {});
}

// First-Action Onboarding Selector
window.selectFirstAction = function (choice) {
  const modalEl = document.getElementById("firstActionModal");
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
  localStorage.setItem("dfq_first_action_done", "true");

  if (choice === "swap") {
    const btn = document.querySelector('.mode-pill[data-mode="Barter Only"]') || document.querySelector('.mode-pill[data-mode="all"]');
    if (btn) btn.click();
    const market = document.getElementById("marketplace");
    if (market) market.scrollIntoView({ behavior: "smooth" });
    showToast("Showing items available for direct Swap!");
  } else if (choice === "pawn") {
    const btn = document.querySelector('.mode-pill[data-mode="Pawn / Quick Sale"]');
    if (btn) btn.click();
    const market = document.getElementById("marketplace");
    if (market) market.scrollIntoView({ behavior: "smooth" });
    showToast("Showing collateral and pawn quick-cash items!");
  } else if (choice === "browse") {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.focus();
    const market = document.getElementById("marketplace");
    if (market) market.scrollIntoView({ behavior: "smooth" });
  }
};

window.openFirstActionModal = function () {
  const fam = document.getElementById("firstActionModal");
  if (fam) new bootstrap.Modal(fam).show();
};

document.getElementById("postModeSelect").addEventListener("change", (e) => {
  document.getElementById("pawnFieldsBox").classList.toggle("d-none", e.target.value !== "Pawn / Quick Sale");
});

document.getElementById("pawnAdvanceInput").addEventListener("input", (e) => {
  const adv = Number(e.target.value) || 0;
  document.getElementById("pawnBuybackPreview").textContent = formatNaira(Math.round(adv * 1.1));
});

window.openAuthModal = function (mode = "login") {
  switchAuthTab(mode);
  authModal.show();
};

window.switchAuthTab = function (mode) {
  const isLogin = mode === "login";
  document.getElementById("tabLoginBtn").classList.toggle("active", isLogin);
  document.getElementById("tabRegisterBtn").classList.toggle("active", !isLogin);
  document.getElementById("loginForm").classList.toggle("d-none", !isLogin);
  document.getElementById("registerForm").classList.toggle("d-none", isLogin);
  document.getElementById("authModalTitle").textContent = isLogin
    ? "Log In to DFQ Trade Crow"
    : "Create Your DFQ Trade Crow Account";
};

function updateAuthUI() {
  const guestBtns = document.getElementById("guestNavBtns");
  const userBadge = document.getElementById("userNavBadge");
  const adminLink = document.getElementById("adminNavLink");
  if (currentUser) {
    guestBtns.classList.add("d-none");
    userBadge.classList.remove("d-none");
    userBadge.classList.add("d-flex");
    const tier = Number(currentUser.kyc_tier || (currentUser.kyc_verified ? 2 : 1));
    let kycChip = "";
    if (tier === 3) {
      kycChip = ` <span class="badge bg-warning-subtle text-warning-emphasis border border-warning ms-1" title="Tier 3 Pro Storefront / Pawn Merchant"><i class="bi bi-award-fill"></i> Gold Seal</span>`;
    } else if (tier === 2) {
      kycChip = ` <span class="badge bg-primary-subtle text-primary border border-primary ms-1" title="Tier 2 Verified Trader"><i class="bi bi-shield-fill-check"></i> Blue Shield</span>`;
    }
    const firstName = String(currentUser.full_name || "Trader").split(" ")[0];
    document.getElementById("navUserName").innerHTML = `<i class="bi bi-person-check-fill"></i> <span class="d-none d-md-inline">${firstName}</span>${kycChip}`;
    adminLink.classList.toggle("d-none", Number(currentUser.is_admin) !== 1);
    const kycNavText = document.getElementById("kycNavText");
    if (kycNavText) {
      if (tier === 3) kycNavText.textContent = "Tier 3: Gold Seal Active";
      else if (tier === 2) kycNavText.textContent = "Tier 2: Blue Shield Active";
      else kycNavText.textContent = "Verify KYC / OTP";
    }
  } else {
    guestBtns.classList.remove("d-none");
    userBadge.classList.add("d-none");
    userBadge.classList.remove("d-flex");
    adminLink.classList.add("d-none");
    const kycNavText = document.getElementById("kycNavText");
    if (kycNavText) kycNavText.textContent = "Verify KYC / OTP";
  }
}

async function checkSession() {
  try {
    const res = await fetch("api/auth.php?action=me");
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.authenticated === "boolean") {
        currentUser = data.authenticated ? data.user : null;
        updateAuthUI();
        return;
      }
    }
  } catch (_) {}
  currentUser = readLocalStore(LOCAL_KEYS.session, null);
  updateAuthUI();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const origText = submitBtn.textContent;
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const res = await fetch("api/auth.php?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const rawText = await res.text();
    const data = JSON.parse(rawText);
    if (data.success) {
      currentUser = data.user;
      updateAuthUI();
      authModal.hide();
      showToast(data.message);
      checkWishlistMatches();
      if (window.__pendingSwapItemId) {
        const pendingId = window.__pendingSwapItemId;
        window.__pendingSwapItemId = null;
        openSwapModal(pendingId);
      }
      return;
    }
    alert(data.message || "Login failed.");
    return;
  } catch (_) {}

  // Offline / Local VS Code fallback
  const users = readLocalStore(LOCAL_KEYS.users, []);
  const found = users.find((u) => u.email === email && u.password === password);
  if (found) {
    const safeUser = { ...found };
    delete safeUser.password;
    currentUser = safeUser;
    writeLocalStore(LOCAL_KEYS.session, currentUser);
    updateAuthUI();
    authModal.hide();
    showToast("Logged in locally (VS Code offline mode)!");
    if (window.__pendingSwapItemId) {
      const pendingId = window.__pendingSwapItemId;
      window.__pendingSwapItemId = null;
      openSwapModal(pendingId);
    }
  } else {
    alert("No matching local account found. Create a new account first if you haven't yet.");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = origText;
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const origText = submitBtn.textContent;
  const fullName = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const phone = document.getElementById("regPhone").value.trim();
  const location = document.getElementById("regLocation").value;
  const password = document.getElementById("regPassword").value;
  const refCode = document.getElementById("regRefCode").value.trim();

  if (!fullName || !email || !phone || password.length < 6) {
    alert("Please enter your name, email, phone number, and a password of at least 6 characters.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const res = await fetch("api/auth.php?action=register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        location,
        password,
        ref_code: refCode
      })
    });
    const rawText = await res.text();
    const data = JSON.parse(rawText);
    if (data.success) {
      currentUser = data.user;
      updateAuthUI();
      authModal.hide();
      showToast(data.message);
      if (window.__pendingSwapItemId) {
        const pendingId = window.__pendingSwapItemId;
        window.__pendingSwapItemId = null;
        openSwapModal(pendingId);
      } else {
        setTimeout(() => {
          const fam = document.getElementById("firstActionModal");
          if (fam) new bootstrap.Modal(fam).show();
        }, 350);
      }
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
      return;
    }
    alert(data.message || "Could not create account.");
    submitBtn.disabled = false;
    submitBtn.textContent = origText;
    return;
  } catch (_) {}

  // Offline / Local VS Code mode using localStorage
  const users = readLocalStore(LOCAL_KEYS.users, []);
  if (users.some((u) => u.email === email)) {
    alert("An account with this email already exists in local browser storage. Try logging in.");
    submitBtn.disabled = false;
    submitBtn.textContent = origText;
    return;
  }

  const newUser = {
    id: Date.now(),
    full_name: fullName,
    email,
    phone,
    location,
    password,
    referral_code: "DFQ-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    spotlight_credits: 1,
    is_admin: users.length === 0 ? 1 : 0
  };
  users.push(newUser);
  writeLocalStore(LOCAL_KEYS.users, users);

  const safeUser = { ...newUser };
  delete safeUser.password;
  currentUser = safeUser;
  writeLocalStore(LOCAL_KEYS.session, currentUser);
  updateAuthUI();
  authModal.hide();
  showToast("Account created locally in VS Code! Ready to swap & post.");

  if (window.__pendingSwapItemId) {
    const pendingId = window.__pendingSwapItemId;
    window.__pendingSwapItemId = null;
    openSwapModal(pendingId);
  } else {
    setTimeout(() => {
      const fam = document.getElementById("firstActionModal");
      if (fam) new bootstrap.Modal(fam).show();
    }, 350);
  }

  submitBtn.disabled = false;
  submitBtn.textContent = origText;
});

document.getElementById("btnLogout").addEventListener("click", async () => {
  try { await fetch("api/auth.php?action=logout"); } catch (_) {}
  currentUser = null;
  writeLocalStore(LOCAL_KEYS.session, null);
  updateAuthUI();
  document.getElementById("wishlistMatchBanner").classList.add("d-none");
  showToast("Logged out.");
});

window.handlePostClick = function () {
  if (!currentUser) {
    openAuthModal("login");
    showToast("Please log in first to post an item.");
    return;
  }
  new bootstrap.Modal(document.getElementById("postItemModal")).show();
};
document.getElementById("btnOpenPostModal").addEventListener("click", handlePostClick);

async function checkWishlistMatches() {
  if (!currentUser || liveItems.length === 0) return;
  try {
    const res = await fetch("api/items.php?action=wishlist");
    const data = await res.json();
    if (!data.success || !data.keywords.length) return;
    const matched = liveItems.filter((it) =>
      data.keywords.some((k) => (it.title + " " + it.description).toLowerCase().includes(k.keyword.toLowerCase()))
    );
    if (matched.length > 0) {
      document.getElementById("wishlistMatchText").textContent =
        `${matched.length} active item(s) match your saved wishlist alerts (e.g., "${matched[0].title}")!`;
      document.getElementById("wishlistMatchBanner").classList.remove("d-none");
    }
  } catch (_) {}
}

function applyClientFilters(items) {
  const favIds = getFavoriteIds();
  return items.filter((it) => {
    const matchMode =
      activeMode === "all" ||
      (activeMode === "favorites" ? favIds.includes(Number(it.id)) : it.mode === activeMode);
    const matchCat = activeCategory === "all" || it.category === activeCategory;
    const matchLoc = activeLocation === "all" || it.location === activeLocation;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      String(it.title || "").toLowerCase().includes(q) ||
      String(it.wanted || "").toLowerCase().includes(q) ||
      String(it.description || "").toLowerCase().includes(q) ||
      String(it.serial_imei || "").toLowerCase().includes(q);
    return matchMode && matchCat && matchLoc && matchSearch;
  });
}

async function loadLiveItems() {
  // Always render local + 30-item built-in catalog immediately so products are never empty or slow
  const baseMerged = getAllCatalogItems();
  liveItems = applyClientFilters(baseMerged);
  renderListings();
  checkWishlistMatches();

  const params = new URLSearchParams({
    action: "list",
    mode: activeMode,
    category: activeCategory,
    location: activeLocation,
    search: searchQuery.trim()
  });
  try {
    const res = await fetch(`api/items.php?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        const existingTitles = new Set(data.items.map((x) => String(x.title || "").toLowerCase()));
        const extraCatalog = applyClientFilters(baseMerged).filter(
          (x) => !existingTitles.has(String(x.title || "").toLowerCase())
        );
        liveItems = [...data.items, ...extraCatalog];
        renderListings();
        checkWishlistMatches();
      }
    }
  } catch (_) {}
}

function renderListings() {
  itemCount.textContent = liveItems.length;
  listingsGrid.innerHTML = "";
  if (liveItems.length === 0) {
    emptyState.classList.remove("d-none");
    return;
  }
  emptyState.classList.add("d-none");

  const favIds = getFavoriteIds();
  updateFavBadgeCount();

  liveItems.forEach((item, idx) => {
    const photoCount = item.gallery && item.gallery.length ? item.gallery.length : 1;
    const isFeatured = Number(item.is_featured) === 1;
    const hasReceipt = Boolean(item.receipt_path);
    const isFav = favIds.includes(Number(item.id));
    const ownerTier = Number(item.owner_kyc_tier || (item.owner_kyc_verified !== false ? 2 : 1));
    const escrowTag = item.status === "In Escrow" ? `<span class="badge badge-escrow ms-1">Inspection Hold</span>` : "";
    const spotlightTag = isFeatured ? `<span class="badge bg-sky-primary ms-1"><i class="bi bi-lightning-fill"></i> Spotlight</span>` : "";
    let kycBadgeHtml = "";
    if (ownerTier === 3) {
      kycBadgeHtml = `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning ms-1" title="Tier 3 Pro Storefront / Pawn Merchant"><i class="bi bi-award-fill"></i> Gold Seal Pro</span>`;
    } else if (ownerTier === 2) {
      kycBadgeHtml = `<span class="badge bg-primary-subtle text-primary border border-primary ms-1" title="Tier 2 Verified Trader"><i class="bi bi-shield-fill-check"></i> Blue Shield</span>`;
    }

    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";
    col.innerHTML = `
      <article class="item-card ${isFeatured ? "featured-card" : ""}" style="animation-delay: ${Math.min(idx * 45, 450)}ms;">
        <div class="item-img-wrap">
          <img src="${item.image_path}" alt="${item.title}" loading="lazy" onerror="this.src='assets/img/couch.svg'" />
          <button type="button" class="btn-fav-heart ${isFav ? "is-favorited" : ""}" onclick="toggleFavoriteItem(${item.id}, this)" title="Save to Favorites Watchlist" aria-label="Save to Favorites">
            <i class="bi ${isFav ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>
          <span class="badge-trade-type ${getBadgeClass(item.mode)}">${item.mode}</span>
          ${photoCount > 1 ? `<span class="badge-photo-count"><i class="bi bi-images me-1"></i>${photoCount}</span>` : ""}
          ${hasReceipt ? `<span class="badge-verified-rec"><i class="bi bi-patch-check-fill me-1"></i>Receipt Verified</span>` : ""}
          <span class="badge-condition">${item.item_condition}</span>
        </div>
        <div class="p-3.5 p-4 d-flex flex-column flex-grow-1">
          <div class="d-flex justify-content-between align-items-center text-muted small mb-1 flex-wrap gap-1">
            <span><i class="bi bi-geo-alt-fill text-sky me-1"></i>${item.location}${kycBadgeHtml}</span>
            <a href="trader.html?id=${item.user_id}" class="text-decoration-none text-warning-emphasis fw-semibold">
              <i class="bi bi-star-fill text-warning me-1"></i>${item.owner_rating} (${item.review_count})
            </a>
          </div>
          <h5 class="fw-bold mb-2 text-dark">${item.title} ${spotlightTag} ${escrowTag}</h5>
          <p class="small text-secondary mb-3 flex-grow-1">${item.description}</p>
          <div class="exchange-box mb-3">
            <span class="exchange-label"><i class="bi bi-arrow-left-right me-1"></i>Looking For in Return</span>
            <div class="exchange-value">${item.wanted}</div>
          </div>
          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            <div>
              <span class="d-block text-muted" style="font-size: 0.72rem;">Est. Value</span>
              <span class="fw-bold text-dark">${formatNaira(item.est_value)}</span>
            </div>
            <div class="d-flex gap-1.5 align-items-center">
              <button type="button" class="btn btn-light border btn-sm px-2 text-sky" onclick="openInquiryDrawer(${item.id})" title="Chat / Inquire with Trader" aria-label="Chat with Trader">
                <i class="bi bi-chat-dots-fill"></i>
              </button>
              <button type="button" class="btn btn-outline-sky btn-sm px-2.5" onclick="openDetails(${item.id})">Details</button>
              <button type="button" class="btn btn-sky btn-sm px-3" onclick="openSwapModal(${item.id})">Propose Swap</button>
            </div>
          </div>
        </div>
      </article>
    `;
    listingsGrid.appendChild(col);
  });
}

document.getElementById("postItemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitItem");
  btn.disabled = true;
  btn.textContent = "Uploading...";

  try {
    const res = await fetch("api/items.php?action=create", { method: "POST", body: new FormData(e.target) });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        e.target.reset();
        document.getElementById("pawnFieldsBox").classList.add("d-none");
        bootstrap.Modal.getInstance(document.getElementById("postItemModal")).hide();
        showToast(result.message);
        loadLiveItems();
        btn.disabled = false;
        btn.textContent = "Publish Listing";
        return;
      }
      alert(result.message || "Could not publish listing.");
      btn.disabled = false;
      btn.textContent = "Publish Listing";
      return;
    }
  } catch (_) {}

  // Offline / Local VS Code mode using localStorage + FileReader image preview
  const fd = new FormData(e.target);
  const photoFiles = Array.from(e.target.querySelector('input[name="photos[]"]')?.files || []).slice(0, 4);
  const dataUrls = [];
  for (const pf of photoFiles) {
    const url = await fileToDataUrl(pf);
    if (url) dataUrls.push(url);
  }
  const coverImg = dataUrls[0] || "assets/img/phone.svg";
  const galleryImgs = dataUrls.length > 0 ? dataUrls : [coverImg];

  const mode = String(fd.get("mode") || "Barter Only");
  const pawnAdv = Number(fd.get("pawn_advance") || 0) || null;
  const pawnBuy = pawnAdv ? Math.round(pawnAdv * 1.1) : null;

  const newItem = {
    id: Date.now(),
    user_id: currentUser ? currentUser.id : 1,
    title: String(fd.get("title") || "").trim(),
    category: String(fd.get("category") || "Electronics & Phones"),
    mode,
    item_condition: String(fd.get("item_condition") || "Neatly Used"),
    location: String(fd.get("location") || "Lekki, Lagos"),
    wanted: String(fd.get("wanted") || "").trim(),
    est_value: Number(fd.get("est_value") || 0),
    pawn_advance: pawnAdv,
    pawn_buyback: pawnBuy,
    pawn_due_date: pawnAdv ? "2026-12-15" : null,
    serial_imei: String(fd.get("serial_imei") || "").trim(),
    receipt_path: "",
    is_featured: 1,
    status: "Active",
    image_path: coverImg,
    gallery: galleryImgs,
    description: String(fd.get("description") || "").trim(),
    owner_name: currentUser ? currentUser.full_name : "Local Trader",
    owner_phone: currentUser ? currentUser.phone : "08030001111",
    owner_rating: "5.0",
    review_count: 1
  };

  const customItems = readLocalStore(LOCAL_KEYS.customItems, []);
  customItems.unshift(newItem);
  writeLocalStore(LOCAL_KEYS.customItems, customItems);

  e.target.reset();
  document.getElementById("pawnFieldsBox").classList.add("d-none");
  bootstrap.Modal.getInstance(document.getElementById("postItemModal")).hide();
  showToast("Item added locally in VS Code!");
  loadLiveItems();

  btn.disabled = false;
  btn.textContent = "Publish Listing";
});

window.openSwapModal = function (id) {
  if (!currentUser) {
    window.__pendingSwapItemId = id;
    openAuthModal("register");
    showToast("Create a free account or log in to send your swap offer.");
    return;
  }
  const item = liveItems.find((i) => Number(i.id) === Number(id));
  if (!item) return;
  document.getElementById("offerTargetItemId").value = item.id;
  document.getElementById("offerTargetTitle").textContent = item.title;
  document.getElementById("offerTargetWanted").textContent = "Owner wants: " + item.wanted;
  new bootstrap.Modal(document.getElementById("swapOfferModal")).show();
};

document.getElementById("swapOfferForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    item_id: Number(document.getElementById("offerTargetItemId").value),
    offered_item: document.getElementById("offerItem").value.trim(),
    cash_topup: document.getElementById("offerCash").value.trim() || "₦0 (Straight Swap)",
    note: document.getElementById("offerNote").value.trim()
  };

  try {
    const res = await fetch("api/offers.php?action=create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        e.target.reset();
        bootstrap.Modal.getInstance(document.getElementById("swapOfferModal")).hide();
        showToast(result.message);
        return;
      }
      alert(result.message || "Could not send offer.");
      return;
    }
  } catch (_) {}

  const offers = readLocalStore(LOCAL_KEYS.offers, []);
  offers.unshift({
    id: Date.now(),
    ...payload,
    proposer_name: currentUser ? currentUser.full_name : "Local Trader",
    status: "Pending",
    created_at: new Date().toLocaleString()
  });
  writeLocalStore(LOCAL_KEYS.offers, offers);

  e.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("swapOfferModal")).hide();
  showToast("Swap proposal saved locally in VS Code!");
});

window.openDetails = function (id) {
  const item = liveItems.find((i) => Number(i.id) === Number(id));
  if (!item) return;

  const photos = item.gallery && item.gallery.length ? item.gallery : [item.image_path];
  document.getElementById("detailCarouselInner").innerHTML = photos
    .map(
      (src, idx) => `
      <div class="carousel-item ${idx === 0 ? "active" : ""}">
        <img src="${src}" class="detail-carousel-img d-block w-100" alt="Item photo ${idx + 1}" />
      </div>
    `
    )
    .join("");

  const badge = document.getElementById("detailBadge");
  badge.textContent = item.mode;
  badge.className = "badge " + getBadgeClass(item.mode);

  document.getElementById("detailReceiptBadge").classList.toggle("d-none", !item.receipt_path);
  document.getElementById("detailTitle").textContent = item.title;
  document.getElementById("detailLocation").textContent = item.location;
  document.getElementById("detailCondition").textContent = item.item_condition;

  const traderLink = document.getElementById("detailTraderLink");
  traderLink.href = `trader.html?id=${item.user_id}`;
  traderLink.textContent = `${item.owner_name}'s Storefront`;
  document.getElementById("detailRatingBadge").innerHTML = `<i class="bi bi-star-fill text-warning"></i> ${item.owner_rating} (${item.review_count})`;

  document.getElementById("detailWanted").textContent = item.wanted;

  const pawnBox = document.getElementById("detailPawnInfo");
  if (item.mode === "Pawn / Quick Sale" && item.pawn_advance) {
    pawnBox.classList.remove("d-none");
    pawnBox.innerHTML = `<strong>Pawn Terms:</strong> Advance ${formatNaira(item.pawn_advance)} &bull; Buyback ${formatNaira(item.pawn_buyback)} (Due: ${item.pawn_due_date}) &bull; <a href="ticket.html?id=${item.id}" target="_blank" class="fw-bold">View Pawn Ticket</a>`;
  } else {
    pawnBox.classList.add("d-none");
  }

  document.getElementById("detailDesc").textContent = item.description;
  document.getElementById("detailValue").textContent = formatNaira(item.est_value);
  document.getElementById("detailSerial").textContent = item.serial_imei || "Not provided";

  const waText = encodeURIComponent(
    `Hi ${item.owner_name}! I saw your "${item.title}" on DFQ Trade Crow and would like to propose a swap/offer.`
  );
  document.getElementById("detailWhatsappBtn").href = `https://wa.me/${cleanPhone(item.owner_phone)}?text=${waText}`;

  document.getElementById("detailProposeBtn").onclick = function () {
    bootstrap.Modal.getInstance(document.getElementById("itemDetailModal")).hide();
    openSwapModal(item.id);
  };

  const detailInquireBtn = document.getElementById("detailInquireBtn");
  if (detailInquireBtn) {
    detailInquireBtn.onclick = function () {
      bootstrap.Modal.getInstance(document.getElementById("itemDetailModal"))?.hide();
      openInquiryDrawer(item.id);
    };
  }

  document.getElementById("detailShareBtn").onclick = function () {
    const shareText = `SWAP ALERT on DFQ Trade Crow: ${item.title} (${item.location}) -> Looking for: ${item.wanted}. Check it out: ${window.location.href}`;
    navigator.clipboard?.writeText(shareText);
    showToast("Swap alert copied! Ready to paste on WhatsApp Status or X.");
  };

  document.getElementById("detailReportBtn").onclick = async function () {
    const reason = prompt("Why are you reporting this listing? (e.g., Suspected stolen item, fake price)");
    if (!reason) return;
    const r = await fetch("api/items.php?action=report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: item.id, reason })
    });
    const j = await r.json();
    showToast(j.message);
  };

  new bootstrap.Modal(document.getElementById("itemDetailModal")).show();
};

document.getElementById("serialCheckForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = document.getElementById("serialQueryInput").value.trim();
  const res = await fetch(`api/items.php?action=check_serial&serial=${encodeURIComponent(q)}`);
  const data = await res.json();
  const box = document.getElementById("serialCheckResult");
  if (data.flagged) {
    box.innerHTML = `<div class="alert alert-danger mb-0"><strong>WARNING:</strong> This Serial/IMEI has been flagged or removed on DFQ Trade Crow. Do NOT proceed with this trade!</div>`;
  } else if (data.matches && data.matches.length > 0) {
    box.innerHTML = `<div class="alert alert-success mb-0"><strong>Verified Clean:</strong> Found on DFQ Trade Crow (${data.matches[0].title}) with zero theft flags.</div>`;
  } else {
    box.innerHTML = `<div class="alert alert-info mb-0"><strong>No Theft Reports Found:</strong> This Serial/IMEI has no negative flags on DFQ Trade Crow.</div>`;
  }
});

document.querySelectorAll(".mode-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeMode = btn.dataset.mode;
    loadLiveItems();
  });
});

document.querySelectorAll(".cat-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    loadLiveItems();
  });
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  loadLiveItems();
});

document.getElementById("locationFilter").addEventListener("change", (e) => {
  activeLocation = e.target.value;
  loadLiveItems();
});

document.getElementById("btnSearchNow").addEventListener("click", () => {
  document.getElementById("marketplace").scrollIntoView({ behavior: "smooth" });
  loadLiveItems();
});

(async function init() {
  await checkSession();
  await loadLiveItems();
})();


// === TIERED TRUST & IDENTITY VERIFICATION (KYC) CONTROLLER ===
let generatedDemoOtp = "";

window.toggleKycTierFields = function () {
  const isTier3 = document.getElementById("tierChoice3")?.checked;
  const t2Wrap = document.getElementById("kycTier2Fields");
  const t3Wrap = document.getElementById("kycTier3Fields");
  const btn = document.getElementById("btnSubmitKycTier");
  if (t2Wrap && t3Wrap) {
    t2Wrap.classList.toggle("d-none", Boolean(isTier3));
    t3Wrap.classList.toggle("d-none", !isTier3);
  }
  if (btn) {
    btn.innerHTML = isTier3
      ? `<i class="bi bi-award-fill me-1"></i> Activate Tier 3 Pro Merchant Badge`
      : `<i class="bi bi-patch-check-fill me-1"></i> Verify & Unlock Blue Shield Badge`;
  }
};

window.openKycModal = function () {
  if (!currentUser) {
    openAuthModal("login");
    showToast("Create or log into your account first to verify your KYC / OTP badge.");
    return;
  }
  const phoneField = document.getElementById("kycPhoneInput");
  if (phoneField && currentUser.phone) {
    phoneField.value = currentUser.phone;
  }
  const verifiedBox = document.getElementById("kycAlreadyVerifiedBox");
  const summaryEl = document.getElementById("kycVerifiedSummary");
  const titleBadge = document.getElementById("kycTierTitleBadge");
  const tier = Number(currentUser.kyc_tier || (currentUser.kyc_verified ? 2 : 1));

  if (tier >= 2) {
    if (verifiedBox) verifiedBox.classList.remove("d-none");
    if (titleBadge) {
      titleBadge.textContent = tier === 3
        ? "Tier 3: Gold Seal Pro Merchant Active!"
        : "Tier 2: Blue Shield Verified Trader Active!";
    }
    if (summaryEl) {
      summaryEl.textContent = tier === 3
        ? `Registered Store: ${currentUser.business_name || "Verified Storefront"}. High-volume collateral & zero escrow wait enabled.`
        : `Verified via ${currentUser.kyc_method || "Phone OTP & NIN"} (${currentUser.kyc_masked_id || "ID Confirmed"}). Trade limits unlocked.`;
    }
  } else {
    if (verifiedBox) verifiedBox.classList.add("d-none");
  }
  window.toggleKycTierFields();
  new bootstrap.Modal(document.getElementById("kycVerifyModal")).show();
};

const kycMethodSelect = document.getElementById("kycMethodSelect");
if (kycMethodSelect) {
  kycMethodSelect.addEventListener("change", () => {
    const idWrap = document.getElementById("kycIdFieldWrap");
    if (idWrap) {
      idWrap.classList.toggle("d-none", kycMethodSelect.value === "Phone SMS OTP Only");
    }
  });
}

const btnSendKycOtp = document.getElementById("btnSendKycOtp");
if (btnSendKycOtp) {
  btnSendKycOtp.addEventListener("click", () => {
    const phoneVal = document.getElementById("kycPhoneInput").value.trim();
    if (phoneVal.length < 10) {
      alert("Enter a valid phone number first.");
      return;
    }
    generatedDemoOtp = String(Math.floor(100000 + Math.random() * 900000));
    const hint = document.getElementById("kycOtpHint");
    hint.textContent = `OTP sent to ${phoneVal}! (Test preview code: ${generatedDemoOtp})`;
    hint.classList.remove("d-none");
    showToast(`OTP code ${generatedDemoOtp} sent!`);
  });
}

const kycVerifyForm = document.getElementById("kycVerifyForm");
if (kycVerifyForm) {
  kycVerifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const isTier3 = document.getElementById("tierChoice3")?.checked;
    const tierNum = isTier3 ? 3 : 2;

    let payload = { tier: tierNum };

    if (tierNum === 2) {
      const method = document.getElementById("kycMethodSelect").value;
      const idNum = document.getElementById("kycIdNumberInput").value.trim();
      const otpVal = document.getElementById("kycOtpCodeInput").value.trim();

      if (method !== "Phone SMS OTP Only" && !/^\d{11}$/.test(idNum)) {
        alert("Please enter a valid 11-digit NIN or BVN number.");
        return;
      }
      if (!/^\d{6}$/.test(otpVal)) {
        alert("Please enter the 6-digit OTP code.");
        return;
      }
      if (generatedDemoOtp && otpVal !== generatedDemoOtp) {
        alert("Invalid OTP code. Click 'Send OTP' and enter the 6-digit code.");
        return;
      }
      payload.nin_bvn = idNum || "NIN-VERIFIED";
    } else {
      const bName = document.getElementById("kycBusinessName")?.value.trim();
      const bAddr = document.getElementById("kycBusinessAddress")?.value.trim();
      if (!bName) {
        alert("Please enter your Merchant / Business Store Name.");
        return;
      }
      payload.business_name = bName;
      payload.business_address = bAddr;
    }

    try {
      const res = await fetch("/api/kyc/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        currentUser.kyc_tier = data.data.kyc_tier;
        currentUser.kyc_verified = true;
        if (payload.business_name) currentUser.business_name = payload.business_name;
        writeLocalStore(LOCAL_KEYS.session, currentUser);
        updateAuthUI();
        loadLiveItems();
        bootstrap.Modal.getInstance(document.getElementById("kycVerifyModal"))?.hide();
        triggerConfettiBurst(document.getElementById("btnOpenKycModal") || document.body);
        showToast(data.message || "KYC Verified Trader Badge activated!");
        return;
      } else {
        alert(data.message || "Verification failed.");
        return;
      }
    } catch (_) {
      // Local fallback
      currentUser.kyc_tier = tierNum;
      currentUser.kyc_verified = true;
      writeLocalStore(LOCAL_KEYS.session, currentUser);
      updateAuthUI();
      loadLiveItems();
      bootstrap.Modal.getInstance(document.getElementById("kycVerifyModal"))?.hide();
      triggerConfettiBurst(document.getElementById("btnOpenKycModal") || document.body);
      showToast(tierNum === 3 ? "Tier 3 Pro Merchant Badge activated!" : "Tier 2 Blue Shield Badge activated!");
    }
  });
}

// Listing Photos Thumbnail Previewer
const postPhotosInput = document.getElementById("postPhotosInput");
if (postPhotosInput) {
  postPhotosInput.addEventListener("change", (e) => {
    const container = document.getElementById("photosPreviewContainer");
    if (!container) return;
    container.innerHTML = "";
    const files = Array.from(e.target.files || []).slice(0, 4);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const thumb = document.createElement("div");
        thumb.className = "position-relative border rounded-3 overflow-hidden shadow-sm";
        thumb.style.width = "72px";
        thumb.style.height = "72px";
        thumb.innerHTML = `
          <img src="${evt.target.result}" style="width:100%;height:100%;object-fit:cover;" alt="preview" />
          <span class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white small px-1 py-0.5 text-truncate text-center" style="font-size:0.65rem;">
            ${file.name}
          </span>
        `;
        container.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    });
  });
}

updateFavBadgeCount();


// === LEGAL & REFUND POLICY MODAL CONTROLLER ===
window.openLegalModal = function (tabKey) {
  const modalEl = document.getElementById("legalPolicyModal");
  if (!modalEl) {
    window.location.href = "legal.html" + (tabKey ? "#" + tabKey : "");
    return;
  }
  const tabBtn = document.getElementById("tab-" + (tabKey || "refund"));
  if (tabBtn && window.bootstrap && bootstrap.Tab) {
    new bootstrap.Tab(tabBtn).show();
  }
  new bootstrap.Modal(modalEl).show();
};


document.querySelectorAll('[data-bs-toggle="tooltip"], .nav-icon-btn[title]').forEach((el) => {
  if (window.bootstrap && bootstrap.Tooltip) {
    new bootstrap.Tooltip(el);
  }
});


// =========================================================
// IN-APP CHAT & DIRECT INQUIRIES DRAWER
// =========================================================

let currentChat = {
  itemId: null,
  partnerId: null,
  pollTimer: null
};

window.openInquiryDrawer = async function (itemId) {
  const item = liveItems.find((i) => Number(i.id) === Number(itemId));
  if (!item) return;

  // Check login
  if (!currentUser) {
    showToast("Please log in to chat with the owner.");
    openAuthModal("login");
    return;
  }

  // Prevent chatting with yourself
  if (currentUser.id === Number(item.user_id)) {
    showToast("This is your own listing! Check your Trade Desk for incoming offers.");
    return;
  }

  currentChat.itemId = Number(itemId);
  currentChat.partnerId = Number(item.user_id);

  // Set header info
  const chatItemImg = document.getElementById("chatItemImg");
  const chatItemTitle = document.getElementById("chatItemTitle");
  const chatPartnerInfo = document.getElementById("chatPartnerInfo");

  if (chatItemImg) chatItemImg.src = item.image_path || "assets/img/phone.svg";
  if (chatItemTitle) chatItemTitle.textContent = item.title;
  if (chatPartnerInfo) chatPartnerInfo.textContent = `Chatting with ${item.owner_name} • ${item.mode}`;

  const drawerEl = document.getElementById("chatDrawer");
  if (drawerEl && window.bootstrap && bootstrap.Offcanvas) {
    const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(drawerEl);
    offcanvas.show();
  }

  await loadChatThread();

  // Start polling while drawer is open
  if (currentChat.pollTimer) clearInterval(currentChat.pollTimer);
  currentChat.pollTimer = setInterval(loadChatThread, 4000);
};

async function loadChatThread() {
  if (!currentChat.itemId) return;

  const container = document.getElementById("chatMessagesThread");
  if (!container) return;

  try {
    const res = await fetch(`/api/messages/thread?item_id=${currentChat.itemId}&other_user_id=${currentChat.partnerId || 0}`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<div class="text-danger small text-center my-auto">${data.message}</div>`;
      return;
    }

    const messages = data.messages || [];
    if (messages.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted small my-auto p-3">
          <i class="bi bi-chat-heart text-sky fs-3 d-block mb-2"></i>
          <strong>No messages yet!</strong><br />
          Ask about the item's condition, exchange preferences, or propose a meetup.
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map((m) => {
      const isMine = currentUser && m.sender_id === currentUser.id;
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
    console.error("Chat load error:", err);
  }
}

window.sendQuickChip = function (text) {
  const input = document.getElementById("chatInputMessage");
  if (input) {
    input.value = text;
    document.getElementById("btnChatSend")?.click();
  }
};

const chatSendForm = document.getElementById("chatSendForm");
if (chatSendForm) {
  chatSendForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInputMessage");
    const msg = (input?.value || "").trim();
    if (!msg || !currentChat.itemId) return;

    input.value = "";
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: currentChat.itemId,
          recipient_id: currentChat.partnerId,
          message: msg
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadChatThread();
        updateNavUnreadCount();
      } else {
        showToast(data.message || "Failed to deliver message.");
      }
    } catch (err) {
      showToast("Error sending message: " + err.message);
    }
  });
}

// Conversations List Drawer
window.openConversationsList = async function () {
  if (!currentUser) {
    showToast("Please log in to view your inquiries & messages.");
    openAuthModal("login");
    return;
  }

  const drawerEl = document.getElementById("conversationsDrawer");
  const content = document.getElementById("conversationsListContent");
  if (drawerEl && window.bootstrap && bootstrap.Offcanvas) {
    bootstrap.Offcanvas.getOrCreateInstance(drawerEl).show();
  }

  try {
    const res = await fetch("/api/messages/conversations");
    const data = await res.json();

    if (!data.success || !data.conversations || data.conversations.length === 0) {
      content.innerHTML = `
        <div class="text-center py-5 text-muted p-4">
          <i class="bi bi-chat-square-text text-sky fs-2 d-block mb-2"></i>
          <strong>No inquiries yet.</strong><br />
          Click the chat button on any item card to start an inquiry with the owner!
        </div>
      `;
      return;
    }

    content.innerHTML = data.conversations.map((c) => {
      const timeStr = new Date(c.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `
        <a href="#" class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" onclick="openChatFromList(${c.item_id}, ${c.partner_id}, '${escapeHtml(c.item_title)}'); return false;">
          <img src="${c.item_image || 'assets/img/phone.svg'}" style="width:48px;height:48px;object-fit:cover;border-radius:10px;" alt="" />
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-dark small text-truncate" style="max-width:180px;">${c.partner_name}</strong>
              <small class="text-muted" style="font-size:0.7rem;">${timeStr}</small>
            </div>
            <div class="small text-sky fw-semibold text-truncate mb-1">${c.item_title}</div>
            <p class="small text-secondary text-truncate mb-0" style="font-size:0.8rem;">${c.last_message}</p>
          </div>
          ${c.unread_count > 0 ? `<span class="badge bg-danger rounded-pill">${c.unread_count}</span>` : ''}
        </a>
      `;
    }).join("");
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger m-3">${err.message}</div>`;
  }
};

window.openChatFromList = function (itemId, partnerId, itemTitle) {
  bootstrap.Offcanvas.getInstance(document.getElementById("conversationsDrawer"))?.hide();
  currentChat.itemId = itemId;
  currentChat.partnerId = partnerId;
  const drawerEl = document.getElementById("chatDrawer");
  if (drawerEl && window.bootstrap && bootstrap.Offcanvas) {
    bootstrap.Offcanvas.getOrCreateInstance(drawerEl).show();
    loadChatThread();
  }
};

async function updateNavUnreadCount() {
  try {
    const res = await fetch("/api/messages/unread-count");
    const data = await res.json();
    const badge = document.getElementById("navChatUnreadBadge");
    if (badge) {
      const count = Number(data.count || 0);
      badge.textContent = count;
      badge.classList.toggle("d-none", count === 0);
    }
  } catch (_) {}
}

setInterval(updateNavUnreadCount, 15000);
setTimeout(updateNavUnreadCount, 1500);

// =========================================================
// 3-STEP GUIDED LISTING WIZARD
// =========================================================

let currentWizardStep = 1;

window.goToWizardStep = function (step) {
  if (step < 1 || step > 3) return;
  // If moving forward, validate current step
  if (step > currentWizardStep && !validateWizardStep(currentWizardStep)) {
    return;
  }
  setWizardStep(step);
};

window.wizardStepNext = function () {
  if (!validateWizardStep(currentWizardStep)) return;
  if (currentWizardStep < 3) {
    setWizardStep(currentWizardStep + 1);
  }
};

window.wizardStepPrev = function () {
  if (currentWizardStep > 1) {
    setWizardStep(currentWizardStep - 1);
  }
};

function setWizardStep(step) {
  currentWizardStep = step;

  // Toggle step panes
  document.getElementById("wizardStep1").classList.toggle("d-none", step !== 1);
  document.getElementById("wizardStep2").classList.toggle("d-none", step !== 2);
  document.getElementById("wizardStep3").classList.toggle("d-none", step !== 3);

  // Update step nodes
  for (let s = 1; s <= 3; s++) {
    const node = document.getElementById(`wizardNode${s}`);
    if (node) {
      node.classList.toggle("active", s === step);
      node.classList.toggle("completed", s < step);
    }
  }

  // Update footer buttons
  const prevBtn = document.getElementById("btnWizardPrev");
  const nextBtn = document.getElementById("btnWizardNext");
  const submitBtn = document.getElementById("btnSubmitItem");

  if (prevBtn) prevBtn.style.visibility = step > 1 ? "visible" : "hidden";
  if (nextBtn) {
    nextBtn.classList.toggle("d-none", step === 3);
    if (step === 1) nextBtn.innerHTML = `Next: Trade Terms <i class="bi bi-arrow-right ms-1"></i>`;
    if (step === 2) nextBtn.innerHTML = `Next: Verification <i class="bi bi-arrow-right ms-1"></i>`;
  }
  if (submitBtn) submitBtn.classList.toggle("d-none", step !== 3);
}

function validateWizardStep(step) {
  if (step === 1) {
    const title = document.getElementById("postTitleInput")?.value.trim();
    const desc = document.getElementById("postDescInput")?.value.trim();
    if (!title) {
      showToast("Please enter an item title.");
      document.getElementById("postTitleInput")?.focus();
      return false;
    }
    if (!desc) {
      showToast("Please provide a brief item description.");
      document.getElementById("postDescInput")?.focus();
      return false;
    }
  }
  if (step === 2) {
    const wanted = document.getElementById("postWantedInput")?.value.trim();
    const estVal = document.getElementById("postEstValInput")?.value.trim();
    if (!wanted) {
      showToast("Please specify what you want in exchange.");
      document.getElementById("postWantedInput")?.focus();
      return false;
    }
    if (!estVal || Number(estVal) <= 0) {
      showToast("Please enter an estimated market value in Naira.");
      document.getElementById("postEstValInput")?.focus();
      return false;
    }
  }
  return true;
}

window.verifyWizardSerial = async function () {
  const serial = document.getElementById("wizardSerialInput")?.value.trim();
  const statusEl = document.getElementById("wizardSerialStatus");
  if (!serial) {
    showToast("Enter a serial number or IMEI to check.");
    return;
  }
  if (statusEl) statusEl.innerHTML = `<span class="spinner-border spinner-border-sm text-sky"></span> Checking anti-theft database...`;
  try {
    const res = await fetch(`/api/items/check_serial?serial=${encodeURIComponent(serial)}`);
    const data = await res.json();
    if (data.flagged) {
      statusEl.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> WARNING: This Serial/IMEI is flagged as reported/stolen!</span>`;
    } else {
      statusEl.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle-fill"></i> Serial clean &amp; verified! Zero security flags found.</span>`;
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<span class="text-muted">Verification check error.</span>`;
  }
};

// =========================================================
// STRUCTURED BARTER NEGOTIATOR (SWAP MODAL HELPERS)
// =========================================================

window.populateUserInventoryForOffers = async function () {
  const select = document.getElementById("offerInventorySelect");
  if (!select) return;

  select.innerHTML = `<option value="custom">-- Type a custom / unlisted item --</option>`;
  if (!currentUser) return;

  try {
    const res = await fetch("/api/items?mine=1");
    const data = await res.json();
    if (data.success && data.items && data.items.length > 0) {
      data.items.forEach((it) => {
        const opt = document.createElement("option");
        opt.value = it.title;
        opt.textContent = `My Listed Item: ${it.title} (${formatNaira(it.est_value)})`;
        select.appendChild(opt);
      });
    }
  } catch (_) {}
};

window.handleInventorySelect = function (val) {
  const offerInput = document.getElementById("offerItem");
  if (val === "custom") {
    if (offerInput) offerInput.value = "";
  } else {
    if (offerInput) offerInput.value = val;
  }
  updateOfferPreview();
};

window.setCashTopup = function (val) {
  const cashInput = document.getElementById("offerCash");
  if (cashInput) {
    cashInput.value = val;
    updateOfferPreview();
  }
};

window.updateOfferPreview = function () {
  const itemVal = document.getElementById("offerItem")?.value.trim() || "Specify Offered Item";
  const cashVal = document.getElementById("offerCash")?.value.trim() || "₦0 (Straight Swap)";
  const previewTitle = document.getElementById("offerPreviewTitle");
  const previewCash = document.getElementById("offerPreviewCash");

  if (previewTitle) previewTitle.textContent = itemVal;
  if (previewCash) previewCash.textContent = cashVal;
};

// Hook inventory loader on openSwapModal
const origOpenSwapModal = window.openSwapModal;
window.openSwapModal = function (id) {
  if (typeof origOpenSwapModal === "function") {
    origOpenSwapModal(id);
  }
  populateUserInventoryForOffers();
  updateOfferPreview();
};

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}
