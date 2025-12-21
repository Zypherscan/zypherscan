# Zypherscan - Privacy-First ZCash Explorer

**Zypherscan** is a modern, privacy-first blockchain explorer and shielded wallet companion for **ZCash**. It bridges the gap between public blockchain data and private user activity, allowing users to "unlock" and view their own **shielded transaction history**, balances, and encrypted memos using **Unified Viewing Keys (UVKs)** in a safe, view-only environment.

## 🌟 Core Features

### 1. Advanced Blockchain Explorer

- **Network Intelligence:** Real-time visibility into blocks, transactions, mempool size, and network statistics.
- **Transaction Analysis:** Detailed breakdown of transaction types with visual badges:
  - 🛡️ **Fully Shielded (z-to-z)**
  - 🔓 **Deshielding (z-to-t)**
  - 🔒 **Shielding (t-to-z)**
  - 🧊 **Transparent (t-to-t)**
- **Shielded Support:** Native support for viewing complex shielded pools (Orchard actions, Sapling spends/outputs).

### 2. Shielded Wallet Integration

- **Connect via View Key:** Users can connect using a Unified Viewing Key (UVK) to permit the application to scan the chain for their specific data without exposing spending keys.
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
- **Styling:** Tailwind CSS + Radix UI (shadcn/ui) for a "Cyberpunk/Terminal" aesthetic.
- **State Management:** React Context (`WalletDataContext`, `AuthContext`) for global syncing state.

### Backend & Data

- **Server:** Node.js (Express) acting as a unified proxy server (`server.js`).
- **Data Handling:**
  - **Proxy Layer:** Securely routes traffic to external services (`lightwalletd`, Zypher backend, Zebra nodes) to handle CORS and API tokens.
  - **Server-Side Scanning:** The heavy lifting of trial-decrypting the blockchain occurs on a trusted backend service via the `/api/zypher` proxy.
  - **Local Storage:** Session keys are stored locally in the browser for persistence across reloads.
- **WASM Roadmap:** Contains foundational code for future client-side WebAssembly decryption (`lib/wasm`).

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
   Create a `.env` file (copy from `.env.example`) and configure your API endpoints:

   ```env
   PORT=3000

   # External Data Providers
   VITE_MAINNET_RPC_API_URL=""
   VITE_TESTNET_RPC_API_URL=""
   VITE_ZEBRA_RPC_URL=""

   # ZypherScan Backend (Scanner Service)
   VITE_BACKEND_API=https://your-backend-service.com/api
   VITE_BACKEND_API_KEY=your-api-key
   ```

3. **Run Locally:**
   ```bash
   pnpm run dev
   # App runs at http://localhost:3000
   ```

## 🐳 Docker Deployment

The project serves both the React frontend and the Express proxy via a single image.

```bash
docker-compose up -d --build
```

Access the application at `http://localhost:3000`.

## 🔒 Privacy & Security Model

- **View-Only Access:** The application only requires **viewing keys**, never spending keys. It cannot move funds.
- **Server-Side Trust:** Currently, the application relies on the configured backend service to perform decryption. Keys are transmitted securely to this endpoint for scanning purposes.
- **Data Persistence:** Keys depend on browser Local Storage and are cleared upon disconnection.

## 📄 License

MIT
