# DFQ Trade Crow — Peer-to-Peer Barter, Pawn & Escrow Marketplace

DFQ Trade Crow is a full-stack web marketplace built for item swaps, trade by barter, and digital pawn/collateral agreements with escrow protection.

---

## 🚀 Tech Stack

- **Frontend:** Multi-Page Application (MPA) bundled with **Vite 8**, HTML5, Vanilla JavaScript (ESM), and Bootstrap 5.
- **Backend:** Standalone **Node.js** server powered by **Express 5**, Multer (file uploads), Bcrypt (password security), and Sessions.
- **Database:** Embedded relational **SQLite** (using Node.js native `node:sqlite`), pre-seeded with 30 realistic marketplace listings and user data.
- **Testing:** Automated end-to-end test suite (`test-e2e.js`) validating all core flows.

---

## 📁 Project Structure

```text
├── admin.html          # Moderation dashboard (listing removal, flag clearing, admin roles)
├── dashboard.html      # Trader workspace (incoming/outgoing swap offers, inventory)
├── index.html          # Marketplace frontend (search, category filters, item modals)
├── legal.html          # Legal terms, escrow policies & NDPR privacy compliance
├── ticket.html         # Official printable digital pawn ticket & receipt generator
├── trader.html         # Public trader storefront & reputation profile
├── assets/
│   ├── css/style.css   # Responsive stylesheets with light & dark theme support
│   ├── js/app.js       # Marketplace client logic & modal handlers
│   └── js/dashboard.js # Trader workspace logic
├── server/
│   ├── app.js          # Express app, middleware, & RESTful API routes
│   ├── db.js           # SQLite database schema, seeding, & query engine
│   └── server.js       # Production server runner (serves Vite build or static files)
├── public/             # Static public assets (images, icons)
├── uploads/            # User item photos and receipt storage
├── vite.config.mjs     # Vite MPA bundler configuration & dev server proxy
└── package.json        # NPM dependencies and scripts
```

---

## 🛠️ Quick Start

### 1. Installation

Ensure Node.js (v20+ recommended, v24 supported) is installed:

```bash
npm install
```

### 2. Development Mode

Runs the backend server on `http://localhost:5000` and the Vite dev server on `http://localhost:3000` with hot-reloading:

```bash
npm run dev
```

### 3. Production Build & Run

```bash
# Build the frontend assets with Vite
npm run build

# Start the standalone Node.js production server
npm start
```

Access the application in your browser at:
**`http://localhost:5000`**

---

## 🔐 Default Accounts

- **Admin Account:** `demo@dfqtradecrow.com`
- **Password:** `password`
- **Referral Code:** `DFQ-MASTER`
- **Spotlight Credits:** `5`

---

## 🧪 Testing

Run the automated test suite to verify database connectivity, authentication, item creation, serial checks, and swap proposals:

```bash
node test-e2e.js
```
