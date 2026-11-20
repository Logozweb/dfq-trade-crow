CREATE DATABASE IF NOT EXISTS dfqtrade_crowdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dfqtrade_crowdb;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL,
    location VARCHAR(80) DEFAULT 'Lekki, Lagos',
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    referred_by INT DEFAULT NULL,
    spotlight_credits INT NOT NULL DEFAULT 0,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category ENUM('Furniture', 'Electronics & Phones', 'Home Appliances', 'Vehicles & Bikes', 'Fashion & Watches') NOT NULL,
    mode ENUM('Barter Only', 'Cash or Swap', 'Pawn / Quick Sale') NOT NULL,
    item_condition ENUM('Brand New', 'Neatly Used', 'Fair / Working') NOT NULL,
    location VARCHAR(80) NOT NULL,
    wanted VARCHAR(255) NOT NULL,
    est_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    pawn_advance DECIMAL(12, 2) DEFAULT NULL,
    pawn_buyback DECIMAL(12, 2) DEFAULT NULL,
    pawn_due_date DATE DEFAULT NULL,
    serial_imei VARCHAR(100) DEFAULT NULL,
    receipt_path VARCHAR(255) DEFAULT NULL,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    is_reported TINYINT(1) NOT NULL DEFAULT 0,
    report_reason VARCHAR(255) DEFAULT NULL,
    image_path VARCHAR(255) NOT NULL,
    gallery_json TEXT DEFAULT NULL,
    description TEXT NOT NULL,
    status ENUM('Active', 'In Escrow', 'Swapped', 'Removed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS swap_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    proposer_id INT NOT NULL,
    owner_id INT NOT NULL,
    offered_item VARCHAR(200) NOT NULL,
    cash_topup VARCHAR(100) DEFAULT '₦0 (Straight Swap)',
    note TEXT,
    status ENUM('Pending', 'In Escrow', 'Accepted', 'Declined') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trader_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offer_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    target_user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_offer_reviewer (offer_id, reviewer_id),
    FOREIGN KEY (offer_id) REFERENCES swap_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Optional Starter Seed Data (Demo Trader + 6 Sample Listings with Built-In Images)
INSERT IGNORE INTO users (id, full_name, email, phone, location, password_hash, referral_code, spotlight_credits, is_admin)
VALUES (1, 'DFQ Demo Trader', 'demo@dfqtradecrow.com', '08030001111', 'Lekki, Lagos', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DFQ-MASTER', 3, 1);

INSERT IGNORE INTO items (id, user_id, title, category, mode, item_condition, location, wanted, est_value, pawn_advance, pawn_buyback, pawn_due_date, serial_imei, receipt_path, is_featured, image_path, gallery_json, description, status)
VALUES
(1, 1, 'iPhone 15 Pro Max (256GB, Natural Titanium)', 'Electronics & Phones', 'Cash or Swap', 'Neatly Used', 'Lekki, Lagos', 'Samsung Galaxy S24 Ultra OR MacBook Pro M2 + Cash', 1120000.00, NULL, NULL, NULL, '358492019485721', 'assets/img/phone.svg', 1, 'assets/img/phone.svg', '["assets/img/phone.svg"]', 'Clean iPhone 15 Pro Max, 92% battery health, Face ID & True Tone working 100%, receipt available.', 'Active'),
(2, 1, 'Samsung Galaxy S24 Ultra (512GB, Titanium Grey)', 'Electronics & Phones', 'Barter Only', 'Brand New', 'Abuja', 'MacBook Pro M2/M3 OR Workstation Desktop System', 1280000.00, NULL, NULL, NULL, '352910485712093', 'assets/img/phone.svg', 1, 'assets/img/phone.svg', '["assets/img/phone.svg"]', 'S-Pen included, 512GB storage, crisp AMOLED display, open for straight barters or high-spec swaps.', 'Active'),
(3, 1, 'iPhone 13 Pro (128GB, Sierra Blue)', 'Electronics & Phones', 'Pawn / Quick Sale', 'Neatly Used', 'Yaba, Lagos', '14-Day Quick Cash Pawn (₦320k) OR iPad Air 5 + Cash', 560000.00, 320000.00, 352000.00, '2026-12-04', '354918273645019', 'assets/img/iphone.svg', 0, 'assets/img/iphone.svg', '["assets/img/iphone.svg"]', 'Factory unlocked, 88% battery health, zero cracks, eligible for verifiable digital pawn ticket.', 'Active'),
(4, 1, 'Google Pixel 8 Pro (256GB, Obsidian Black)', 'Electronics & Phones', 'Cash or Swap', 'Neatly Used', 'Ikeja, Lagos', 'iPhone 14 Pro OR Gaming Laptop', 740000.00, NULL, NULL, NULL, '359102938475610', 'assets/img/phone.svg', 0, 'assets/img/phone.svg', '["assets/img/phone.svg"]', 'Incredible AI camera system, clean screen, comes with fast charger and protective case.', 'Active'),
(5, 1, 'Samsung Galaxy Z Fold 5 (512GB, Phantom Black)', 'Electronics & Phones', 'Cash or Swap', 'Neatly Used', 'Lekki, Lagos', 'iPhone 15 Pro Max OR Toyota Corolla Top-Up Deal', 1190000.00, NULL, NULL, NULL, '357483920192834', 'assets/img/phone.svg', 0, 'assets/img/phone.svg', '["assets/img/phone.svg"]', 'Smooth inner folding screen, zero hinge issues, great for multitasking and trading.', 'Active'),
(6, 1, '6x6 Orthopedic Queen Bed Frame & Mattress', 'Furniture', 'Barter Only', 'Neatly Used', 'Yaba, Lagos', '3-Seater Modern Couch OR Double-Door Fridge', 240000.00, NULL, NULL, NULL, NULL, NULL, 1, 'assets/img/bed.svg', '["assets/img/bed.svg"]', 'Sturdy solid wood 6x6 bed frame with high-density orthopedic mattress. Zero squeaks and super comfortable.', 'Active'),
(7, 1, '3-Seater Modern Grey Fabric Couch', 'Furniture', 'Barter Only', 'Neatly Used', 'Lekki, Lagos', 'Queen Bed Frame OR 55-inch Smart TV', 175000.00, NULL, NULL, NULL, NULL, NULL, 0, 'assets/img/couch.svg', '["assets/img/couch.svg"]', 'Spacious, clean 3-seater couch with firm cushions and sleek slate-grey upholstery.', 'Active'),
(8, 1, 'L-Shaped Executive Sectional Living Room Sofa', 'Furniture', 'Cash or Swap', 'Brand New', 'Abuja', 'King Size Tufted Bed + Mattress OR ₦360,000 Cash', 380000.00, NULL, NULL, NULL, NULL, 'assets/img/couch.svg', 0, 'assets/img/couch.svg', '["assets/img/couch.svg"]', 'Brand new L-shaped sectional sofa with throw pillows and stain-resistant fabric.', 'Active'),
(9, 1, '4.5x6 Semi-Orthopedic Bed Frame & Spring Mattress', 'Furniture', 'Cash or Swap', 'Neatly Used', 'Ota, Ogun', '3.5kVA Generator OR ₦135,000 Cash', 150000.00, NULL, NULL, NULL, NULL, NULL, 0, 'assets/img/bedframe.svg', '["assets/img/bedframe.svg"]', 'Compact and durable 4.5x6 bed setup ideal for studio or guest bedrooms.', 'Active'),
(10, 1, '6-Seater Hardwood Dining Table & Padded Chairs', 'Furniture', 'Barter Only', 'Neatly Used', 'Ikeja, Lagos', '3-Seater Fabric Couch + Center Table OR Inverter Fridge', 260000.00, NULL, NULL, NULL, NULL, NULL, 0, 'assets/img/dining.svg', '["assets/img/dining.svg"]', 'Polished mahogany dining set with six cushioned chairs, zero scratches.', 'Active'),
(11, 1, 'HP / Dell Core i7 Desktop System + 24" IPS Monitor', 'Electronics & Phones', 'Cash or Swap', 'Neatly Used', 'Ikeja, Lagos', 'MacBook Air M1/M2 OR ₦520,000 Cash', 540000.00, NULL, NULL, NULL, 'SYS-77482910', 'assets/img/systems.svg', 1, 'assets/img/systems.svg', '["assets/img/systems.svg"]', 'Complete office/editing system: Intel Core i7, 32GB RAM, 1TB NVMe SSD, 24-inch Full HD monitor, keyboard & mouse.', 'Active'),
(12, 1, 'MacBook Pro M2 (16GB RAM / 512GB SSD)', 'Electronics & Phones', 'Pawn / Quick Sale', 'Neatly Used', 'Yaba, Lagos', '21-Day Buyback Pawn (₦450k) OR iPad Pro M2', 1150000.00, 450000.00, 495000.00, '2026-12-11', 'C02ZW123MD6R', 'assets/img/macbook.svg', 0, 'assets/img/macbook.svg', '["assets/img/macbook.svg"]', 'Fast Apple Silicon laptop ideal for developers, video editors, and traders; eligible for digital pawn ticket.', 'Active'),
(13, 1, 'Custom RTX 4060 Gaming & Video Editing PC System', 'Electronics & Phones', 'Cash or Swap', 'Brand New', 'Lekki, Lagos', 'MacBook Pro M3 OR iPhone 15 Pro Max + Cash', 1450000.00, NULL, NULL, NULL, 'SYS-90481234', 'assets/img/systems.svg', 0, 'assets/img/systems.svg', '["assets/img/systems.svg"]', 'Ryzen 7, 32GB DDR5, 1TB Gen4 SSD, RTX 4060 8GB GPU, tempered glass RGB case.', 'Active'),
(14, 1, 'HP Spectre x360 14" 2-in-1 Touchscreen Laptop', 'Electronics & Phones', 'Cash or Swap', 'Neatly Used', 'Abuja', 'iPad Pro 12.9" + Magic Keyboard OR ₦760,000 Cash', 790000.00, NULL, NULL, NULL, '5CD31982KL', 'assets/img/macbook.svg', 0, 'assets/img/macbook.svg', '["assets/img/macbook.svg"]', 'Convertible 360-degree OLED touchscreen laptop with stylus pen and backlit keyboard.', 'Active'),
(15, 1, 'PlayStation 5 Disc Edition + 2 DualSense Pads', 'Electronics & Phones', 'Barter Only', 'Neatly Used', 'Lekki, Lagos', 'Gaming Laptop OR iPad Air + Cash', 620000.00, NULL, NULL, NULL, 'S01-9928374', 'assets/img/ps5.svg', 0, 'assets/img/ps5.svg', '["assets/img/ps5.svg"]', 'Comes with two wireless controllers, HDMI & power cables, tested and running quietly.', 'Active'),
(16, 1, 'Toyota Corolla LE (Clean Title, Smooth Engine & AC)', 'Vehicles & Bikes', 'Cash or Swap', 'Neatly Used', 'Lekki, Lagos', 'SUV Swap + Cash Top-Up OR Direct Cash Offer', 6800000.00, NULL, NULL, NULL, 'VIN-2T1BURHE8FC294810', 'assets/img/car.svg', 1, 'assets/img/car.svg', '["assets/img/car.svg"]', 'Well-maintained sedan with crisp gear shifts, chilling AC, intact interior, and complete vehicle papers.', 'Active'),
(17, 1, 'Lexus RX 350 SUV (First Body, Panoramic Roof)', 'Vehicles & Bikes', 'Cash or Swap', 'Neatly Used', 'Abuja', 'Toyota Camry 2018+ OR ₦14.5M Cash Offer', 14800000.00, NULL, NULL, NULL, 'VIN-2T2BK1BA9FC382910', 'assets/img/suv.svg', 0, 'assets/img/suv.svg', '["assets/img/suv.svg"]', 'Accident-free V6 SUV, leather seats, reverse camera, duty paid, ready for inspection.', 'Active'),
(18, 1, 'Honda Civic Sport Sedan (2017 Model)', 'Vehicles & Bikes', 'Cash or Swap', 'Neatly Used', 'Ikeja, Lagos', 'Toyota RAV4 OR Direct Cash / Bank Transfer', 8900000.00, NULL, NULL, NULL, 'VIN-19XFC2F79HE019283', 'assets/img/car.svg', 0, 'assets/img/car.svg', '["assets/img/car.svg"]', 'Fuel-efficient i-VTEC engine, Apple CarPlay screen, alloy wheels, sharp suspension.', 'Active'),
(19, 1, '27.5" Alloy Trail & Commuter Bike (21-Speed)', 'Vehicles & Bikes', 'Barter Only', 'Brand New', 'Abuja', 'PS5 Console OR iPhone 13 / 14', 265000.00, NULL, NULL, NULL, 'BIKE-992014', NULL, 0, 'assets/img/bike.svg', '["assets/img/bike.svg"]', 'Lightweight alloy frame with front suspension, disc brakes, and smooth 21-speed gear shifting.', 'Active'),
(20, 1, '250cc Sport & Dispatch Motorbike (Registered)', 'Vehicles & Bikes', 'Cash or Swap', 'Neatly Used', 'Yaba, Lagos', 'MacBook Pro M1/M2 OR ₦920,000 Cash', 950000.00, NULL, NULL, NULL, 'MOTO-4491028', 'assets/img/powerbike.svg', 0, 'assets/img/powerbike.svg', '["assets/img/powerbike.svg"]', 'Low-mileage 250cc street bike with complete plate number & papers, strong torque.', 'Active'),
(21, 1, 'Foldable 48V Electric Commuter E-Bike', 'Vehicles & Bikes', 'Pawn / Quick Sale', 'Brand New', 'Lekki, Lagos', '21-Day Pawn (₦280k) OR iPhone 14 Pro', 520000.00, 280000.00, 308000.00, '2026-12-11', 'EBK-771209', 'assets/img/bike.svg', 0, 'assets/img/bike.svg', '["assets/img/bike.svg"]', '55km range per charge, removable lithium battery, LED headlight, folds into car trunk.', 'Active'),
(22, 1, '3.5kVA Pure Sine Inverter + 200Ah Battery', 'Home Appliances', 'Cash or Swap', 'Neatly Used', 'Abuja', '5kVA Hybrid Inverter OR ₦420,000 Cash', 440000.00, NULL, NULL, NULL, 'INV-8849201', NULL, 0, 'assets/img/inverter.svg', '["assets/img/inverter.svg"]', 'Reliable backup power system for home & office workloads; clean sine-wave output.', 'Active'),
(23, 1, 'Double-Door Inverter Refrigerator (380L)', 'Home Appliances', 'Cash or Swap', 'Brand New', 'Ota, Ogun', 'L-Shaped Sofa OR ₦390,000 Cash', 410000.00, NULL, NULL, NULL, 'FRG-551029', 'assets/img/fridge.svg', 0, 'assets/img/fridge.svg', '["assets/img/fridge.svg"]', 'Energy-saving frost-free double-door refrigerator with fast cooling and spacious freezer.', 'Active'),
(24, 1, '65" 4K UHD Smart OLED TV (Voice Remote)', 'Home Appliances', 'Barter Only', 'Neatly Used', 'Lekki, Lagos', 'MacBook Pro OR 3.5kVA Solar Inverter Setup', 690000.00, NULL, NULL, NULL, 'TV-8839201', 'assets/img/tv.svg', 0, 'assets/img/tv.svg', '["assets/img/tv.svg"]', 'Ultra-thin bezel 4K smart TV with Netflix, YouTube, Dolby Audio, and wall bracket.', 'Active'),
(25, 1, '1.5HP Dual Inverter Split Air Conditioner', 'Home Appliances', 'Cash or Swap', 'Brand New', 'Ikeja, Lagos', '6x6 Orthopedic Bed Set OR ₦340,000 Cash', 365000.00, NULL, NULL, NULL, 'AC-1928374', 'assets/img/ac.svg', 0, 'assets/img/ac.svg', '["assets/img/ac.svg"]', 'Super fast cooling, low power consumption (works on 2.5kVA+ inverter), complete copper kit.', 'Active'),
(26, 1, '3.8kVA Copper Coil Key-Start Generator', 'Home Appliances', 'Cash or Swap', 'Neatly Used', 'Yaba, Lagos', 'Core i7 Laptop System OR ₦275,000 Cash', 295000.00, NULL, NULL, NULL, 'GEN-661209', NULL, 0, 'assets/img/generator.svg', '["assets/img/generator.svg"]', '100% copper winding, one-touch key start, low fuel consumption, powers AC & freezer.', 'Active'),
(27, 1, 'Stainless Chronograph & Smartwatch Bundle', 'Fashion & Watches', 'Pawn / Quick Sale', 'Brand New', 'Ikeja, Lagos', 'Quick Cash Pawn (₦95k) OR Earbuds + Cash', 135000.00, 95000.00, 104500.00, '2026-12-04', 'WTC-330192', NULL, 0, 'assets/img/watch.svg', '["assets/img/watch.svg"]', 'Classic steel timepiece with presentation box, available for quick swap or 14-day buyback pawn.', 'Active'),
(28, 1, 'Apple Watch Ultra 2 (49mm Titanium + Alpine Loop)', 'Fashion & Watches', 'Cash or Swap', 'Neatly Used', 'Lekki, Lagos', 'iPad Mini 6 OR ₦580,000 Cash', 610000.00, NULL, NULL, NULL, 'AWU2-991827', 'assets/img/watch.svg', 0, 'assets/img/watch.svg', '["assets/img/watch.svg"]', 'Sapphire crystal display, 36-hour battery life, dual-frequency GPS, original box & charger.', 'Active');
