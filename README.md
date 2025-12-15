# ZypherScan - Zcash Block Explorer & Decryption Tool

ZypherScan is a modern, privacy-focused Zcash block explorer and transaction analyzer. It serves as a frontend interface allowing users to view blockchain data and decrypt shielded transactions using Unified Viewing Keys (UVKs).

## 🏗️ Architecture

This repository contains the **Frontend Application** built with:

- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Server:** Node.js (Express) for serving static assets and proxying API requests in production.

It is designed to connect to external services:

1. **ZypherScan Backend:** A Rust-based scanner service for wallet synchronization and decryption.
2. **Cipherscan APIs:** For public blockchain data access (Mainnet/Testnet).
3. **Zebra/Lightwalletd:** For RPC and light client data.

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
   Create a `.env` file (copy from `.env.example` if available) and configure your API endpoints:

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

The project includes a production-ready `Dockerfile` and `docker-compose.yml`.

### Build & Run

```bash
docker-compose up -d --build
```

Access the application at `http://localhost:3000`.

## 🎯 Key Features

### 🔐 Secure Authentication & Decryption

- **Unified Viewing Keys (UVKs):** Users authenticate using their UVKs.
- **Network Validation:** The app strictly validates keys against the selected network (`uview`/`zview` for Mainnet, `utest`/`ztest` for Testnet).
- **Security:** Private keys are never required. Viewing keys are stored locally for the session and cleared on logout/network switch.

### 🌐 Multi-Network Support

Seamlessly switch between **Mainnet** and **Testnet** via the header menu.

| Feature             | 🟢 Mainnet                                   | 🟡 Testnet                    |
| :------------------ | :------------------------------------------- | :---------------------------- |
| **Dashboard**       | ✅ Full Access (Analytics, History, Balance) | ❌ Disabled (Stability Focus) |
| **Background Sync** | ✅ Continuous                                | ❌ Disabled                   |
| **Decryption**      | ✅ Auto & Manual                             | ✅ Manual (Single TX Only)    |
| **Public Explorer** | ✅ Blocks, Txs, Addresses                    | ✅ Blocks, Txs, Addresses     |

### 📊 Dashboard (Mainnet)

- **Real-time Sync:** Connects to the backend scanner to fetch and decrypt transaction history in the background.
- **Analytics:** View "Most Active Days", portfolio distribution (Orchard, Sapling, Transparent), and total transaction counts.
- **Sync Status:** Visual indicator of block scanning progress.

### 🔍 Transaction Details

- **Decryption:** Manually decrypt specific shielded transactions if you possess the viewing key.
- **Testnet Mode:** On Testnet, use the "Decrypt This TX" button on the Details page to perform a one-off local decryption probe without full wallet sync.

## 📁 Project Structure

```
zypherscan/
This application supports both Zcash Mainnet and Testnet, with specific feature availability for each:

### 🟢 Mainnet

- **Full Dashboard Access**: View complete transaction history, balance summaries, and analytics.
- **Background Sync**: The application continuously syncs your viewing key in the background to keep data fresh.
- **Decryption**: Decrypt incoming and outgoing shielded transactions.

### 🟡 Testnet

- **Transaction Decryption Only**: You can decrypt individual transactions directly on the Transaction Details page using a Testnet Viewing Key.
- **No Dashboard**: To ensure stability and focus on specific debugging, the full dashboard and background sync are **disabled** for Testnet.
- **Usage**: Switch to "Testnet" in the header, navigate to a transaction, and click "Decrypt This TX".

## 📄 License

MIT
```
