# Zypherscan - Premium ZCash Privacy Explorer

**Zypherscan** is a high-performance, privacy-first blockchain explorer and shielded wallet companion for **Zcash**. It bridges the gap between public blockchain data and private user activity, allowing users to "unlock" and view their own **shielded transaction history**, balances, and encrypted memos using **Unified Viewing Keys (UVKs)** in a safe, view-only environment.

## 🌟 Core Features

### 1. Advanced Blockchain Explorer

- **Network Intelligence:** Real-time visibility into blocks, transactions, mempool size, and network statistics.
- **Whale Alert Tracker:** A real-time, high-density slider showing mega-whale movements, block values, and network vitals.
- **Transaction Analysis:** Detailed breakdown of transaction types with visual badges:
  - 🛡️ **Fully Shielded (z-to-z)**
  - 🔓 **Deshielding (z-to-t)**
  - 🔒 **Shielding (t-to-z)**
  - 🧊 **Transparent (t-to-t)**
- **Shielded Support:** Native support for viewing complex shielded pools (Orchard actions, Sapling spends/outputs).

### 2. Cypherpunk Design System

- **Premium Aesthetic:** Modern "Ghost-like" Matrix rain background with 0.10 opacity for a deep technical feel.
- **Consistent Theme:** Standardized `bg-card/50` transparency and `border-white/10` across all pages (Dashboard, Transaction Details, Network Stats, etc.).
- **Responsive Animations:** Subtle micro-animations and transitions that maintain visibility of the global matrix effect.

### 3. ZEC Flow (Cross-Chain Stats)

- **Bridge Visibility:** Real-time tracking of ZEC moving through cross-chain bridges and swaps.
- **Inflow/Outflow Data:** Integrated analytics for ZEC liquidity movement across the broader crypto ecosystem.

### 4. Shielded Wallet Integration

- **Connect via View Key:** Connect using a Unified Viewing Key (UVK) to permit the application to scan the chain for your specific data without exposing spending keys.
- **Zucchini Wallet Support:** Built-in integration to auto-connect with the Zucchini browser wallet.
- **Private Dashboard:**
  - Aggregated balances (Total, Shielded, Transparent).
  - Decryptable transaction history with historical pricing.
  - Activity charts and usage analytics.
- **Decrypt Tool:** A dedicated utility for manually decrypting specific transaction outputs and memos.

## 🏗️ Technical Architecture

### Frontend

- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI + Lucide Icons.
- **Rendering:** High-performance Canvas-based Matrix rain for minimal CPU overhead.

### Backend & Data

- **Proxy Layer:** Node.js (Express) server securely routing traffic to `lightwalletd`, Zypher backend, and Zebra nodes.
- **Server-Side Scanning:** Powered by a trusted backend service via the `/api/zypher` proxy for complex trial-decryption.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Setup

1. **Clone and install:**

   ```bash
   git clone <repo-url>
   cd zypherscan
   pnpm install
   ```

2. **Configure environment:**
   Create a `.env` file (copy from `.env.example`):

   ```env
   VITE_MAINNET_RPC_API_URL=""
   VITE_BACKEND_API=https://your-backend-service.com/api
   ```

3. **Run Locally:**
   ```bash
   pnpm run dev
   ```

## 🐳 Docker Deployment

```bash
docker-compose up -d --build
```

Access the application at `http://localhost:3000`.

## 🔒 Privacy & Security Model

- **View-Only Access:** The application only requires **viewing keys**, never spending keys. It cannot move funds.
- **Local Decryption:** Sensitive decryption of basic wallet data happens local to the user's session when possible.
- **Minimal Footprint:** No personal data is stored beyond the session cache in Local Storage.

## 📄 License

MIT
