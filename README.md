# ZShield Explorer

A privacy-first Zcash blockchain explorer with client-side shielded transaction viewing. Built with React, TypeScript, and modern web technologies.

**Zero trust architecture** - Your viewing keys never leave your device. All transaction decryption happens client-side in your browser.

![ZShield Explorer](https://img.shields.io/badge/Zcash-Privacy%20Explorer-F4A21B?style=for-the-badge&logo=zcash)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)

## ✨ Features

### 🔐 Client-Side Privacy

- **Viewing Key Decryption** - Import your unified viewing key (UVK) to decrypt shielded transactions
- **Local-Only Processing** - All cryptographic operations happen in your browser
- **QR Code Import** - Scan viewing keys from your mobile wallet
- **File Import** - Import keys from JSON or text files
- **No Server Storage** - Keys are stored only in localStorage, never transmitted

### 📊 Personal Analytics Dashboard

- **Balance Overview** - Total, shielded, and pending balances with Sapling/Orchard breakdown
- **Transaction History** - Filterable, searchable decrypted transaction list
- **Volume Charts** - 30-day incoming/outgoing volume visualization
- **Pool Distribution** - Visual breakdown by shielded pool
- **Quick Stats** - Transaction count, averages, most active day, total fees

### 🔍 Block Explorer

- **Block Details** - Comprehensive block info with transaction lists
- **Transaction Details** - Shielded and transparent input/output inspection
- **Search** - Find blocks, transactions by height, hash, or ID
- **Real-time Updates** - Live block data from Zebra node

### 📈 Network Privacy Dashboard

- **Shielded Pool Stats** - Total ZEC in Sapling and Orchard pools
- **Pool Growth Charts** - Historical trend visualization
- **Network Health** - Block height, difficulty, chain status

### 💾 Data Management

- **CSV/JSON Export** - Download transaction history with customizable filters
- **Address Book** - Label and save addresses for easy identification
- **Tax Reporting** - Generate yearly summaries by month
- **Import/Export** - Backup and restore address book data

### 🔄 Blockchain Sync

- **Lightwalletd Integration** - Efficient blockchain scanning via gRPC
- **Progress Tracking** - Real-time sync status with ETA
- **Background Sync** - Non-blocking wallet synchronization
- **Resume Capability** - Continue from last synced block

## 🛠 Tech Stack

| Category       | Technologies                      |
| -------------- | --------------------------------- |
| **Frontend**   | React 18, TypeScript, Vite        |
| **Styling**    | Tailwind CSS, shadcn/ui           |
| **State**      | TanStack Query (React Query)      |
| **Charts**     | Recharts                          |
| **Backend**    | Supabase Edge Functions           |
| **Blockchain** | Zebra JSON-RPC, Lightwalletd gRPC |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/zshield-explorer.git
cd zshield-explorer

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
pnpm run dev
```

### Environment Variables

Create a `.env` file:

```env
# Supabase (for caching)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"

# Zcash Infrastructure
VITE_ZEBRA_RPC_URL="https://zebra.up.railway.app"
VITE_LIGHTWALLETD_GRPC_URL="http://yamanote.proxy.rlwy.net:54918"
```

## 📱 Routes

| Route        | Description                                             |
| ------------ | ------------------------------------------------------- |
| `/`          | Main explorer with search, network stats, recent blocks |
| `/auth`      | Connect wallet via viewing key                          |
| `/dashboard` | Personal analytics with transactions and address book   |
| `/privacy`   | Network-wide privacy statistics                         |
| `/block/:id` | Block details                                           |
| `/tx/:txid`  | Transaction details                                     |

## 🔧 Project Structure

```
src/
├── components/
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionList.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   ├── PoolDistribution.tsx
│   │   └── QuickStats.tsx
│   ├── ui/                  # shadcn/ui components
│   ├── AddressBook.tsx      # Address labeling
│   ├── ExportDialog.tsx     # Data export
│   ├── SyncStatus.tsx       # Sync progress
│   └── ...
├── hooks/
│   ├── useAuth.ts           # Authentication state
│   ├── useWalletData.ts     # Wallet data management
│   ├── useSync.ts           # Blockchain sync
│   ├── useAddressBook.ts    # Address book state
│   └── useZcashAPI.ts       # Zebra RPC wrapper
├── lib/
│   ├── zcash-crypto.ts      # Crypto utilities + WASM interface
│   ├── lightwalletd.ts      # gRPC client
│   ├── address-book.ts      # Address book service
│   ├── export.ts            # Export functionality
│   └── config.ts            # App configuration
├── pages/
│   ├── Index.tsx            # Home/Explorer
│   ├── Auth.tsx             # Wallet connection
│   ├── Dashboard.tsx        # Personal dashboard
│   ├── PrivacyDashboard.tsx # Network stats
│   ├── BlockDetails.tsx     # Block view
│   └── TransactionDetails.tsx
└── App.tsx                  # Route definitions
```

## 🔐 Security Architecture

ZShield is designed with a zero-trust security model:

1. **No Server-Side Keys** - Viewing keys are stored only in the browser's localStorage
2. **Client-Side Decryption** - All Zcash cryptography runs in WASM in the browser
3. **No Analytics** - No third-party tracking or data collection
4. **Open Source** - Full codebase transparency for auditing
5. **Minimal Data Transmission** - Only block/transaction metadata fetched from servers

### Viewing Key Types

- **Unified Viewing Key (uview)** - Can view Sapling and Orchard transactions
- **Sapling Viewing Key (zview)** - Can view Sapling transactions only

## 🎨 Design System

The interface follows a dark cypherpunk aesthetic:

- **Colors**: Dark background with orange (#F4A21B) accents
- **Typography**: JetBrains Mono (code), Outfit (UI)
- **Effects**: Glassmorphism, subtle glows, smooth animations
- **Theme**: Privacy-focused, professional, modern

## 📦 Building

```bash
# Production build
pnpm run build

# Preview production build
pnpm run preview

# Type checking
pnpm run lint
```

## 🔌 API Integration

### Zebra JSON-RPC (Block/Transaction Data)

```
Endpoint: https://zebra.up.railway.app
Methods: getblockchaininfo, getblock, getrawtransaction, etc.
```

### Lightwalletd gRPC (Wallet Sync)

```
Endpoint: http://yamanote.proxy.rlwy.net:54918
Service: CompactTxStreamer
Methods: GetLatestBlock, GetBlockRange, GetTransaction
```

## 🔮 Architecture Notes

### WASM Integration

The `zcash-crypto.ts` module provides an interface for librustzcash WASM bindings:

```typescript
// When WASM is loaded:
await initZcashWasm();
const decrypted = await decryptTransactions(viewingKey, compactBlocks);
```

Currently uses simulation mode for demo. Production deployment would load:

- `zcash_client_backend` for wallet operations
- `zcash_primitives` for crypto primitives
- Protocol buffers for gRPC communication

### Sync Architecture

```
[Lightwalletd] → [gRPC-Web] → [Sync Service] → [WASM Decryption] → [Local State]
```

## 📚 Zcash Concepts

### Shielded Pools

- **Sapling** (2018) - Efficient zk-SNARKs, widely adopted
- **Orchard** (2022) - Halo2 proofs, enhanced privacy

### Transaction Types

| Type   | Flow                   | Privacy     |
| ------ | ---------------------- | ----------- |
| z-to-z | Shielded → Shielded    | Maximum     |
| t-to-z | Transparent → Shielded | Shielding   |
| z-to-t | Shielded → Transparent | Deshielding |
| t-to-t | Transparent only       | Minimal     |

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

_Built with the cypherpunk ethos. Privacy is a right, not a privilege._

**🔗 Links:**

- [Zcash Foundation](https://zfnd.org/)
- [Electric Coin Company](https://electriccoin.co/)
- [Zcash Documentation](https://zcash.readthedocs.io/)
