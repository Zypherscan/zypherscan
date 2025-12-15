# ZypherScan - Zcash Block Explorer

A modern Zcash block explorer with transaction decryption capabilities using Unified Viewing Keys.

## 🏗️ Architecture

This application has a unified architecture:

**Development Mode:**

- Frontend (Vite + React): `http://localhost:3000`
- Backend (Express + Rust): `http://localhost:8080`
- Frontend proxies API calls to backend

**Production Mode (Railway):**

- Single Express server on port 8080
- Serves both static frontend files AND API endpoints
- No separate frontend server needed

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Rust and Cargo (for building the scanner binary)

### Setup

1. **Clone and install:**

```bash
git clone <your-repo>
cd zypherscan
pnpm install
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your API URLs and configuration
```

3. **Build Rust binary:**

```bash
pnpm run build:rust
```

### Development

**Option 1: Run both together (Recommended)**

```bash
pnpm run dev:all
```

This starts both backend (port 8080) and frontend (port 3000) in one terminal.
Visit `http://localhost:3000` in your browser.

**Option 2: Run separately**

Run frontend and backend in **separate terminals**:

**Terminal 1 - Backend:**

```bash
pnpm run dev:backend
# Runs on http://localhost:8080
```

**Terminal 2 - Frontend:**

```bash
pnpm run dev:frontend
# Runs on http://localhost:3000
```

Visit `http://localhost:3000` in your browser.

### Production Build (Local Testing)

```bash
# Build everything (Rust binary + frontend)
pnpm run build:all

# Start the production server
pnpm start

# Visit http://localhost:8080
```

## 🚂 Railway Deployment

### How It Works

Railway runs a **single server** that:

1. Builds the Rust scanner binary
2. Builds the React frontend to static files
3. Starts Express server which:
   - Serves API endpoints at `/api/*`
   - Serves static frontend files
   - Handles SPA routing

### Deployment Steps

1. **Push to GitHub**

2. **Create Railway Project:**

   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select your repository

3. **Set Environment Variables:**

   Required:

   ```
   PORT=8080
   VITE_CIPHERSCAN_MAINNET_API_URL=https://api.cipherscan.io
   VITE_CIPHERSCAN_TESTNET_API_URL=https://testnet.cipherscan.io
   VITE_ZEBRA_RPC_URL=https://mainnet.lightwalletd.com:9067
   ```

   Optional (if using Supabase):

   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-key
   ```

4. **Deploy:**

   - Railway auto-detects `nixpacks.toml`
   - Builds Rust binary + frontend
   - Starts server with `pnpm start`

5. **Access:**
   - Railway provides URL: `https://your-app.railway.app`
   - Both frontend and API available at this URL

## 🐳 Docker Deployment

### Using Docker

**Build and run:**

```bash
# Build the image
docker build -t zypherscan .

# Run the container
docker run -p 8080:8080 \
  -e VITE_CIPHERSCAN_MAINNET_API_URL=https://api.cipherscan.io \
  -e VITE_CIPHERSCAN_TESTNET_API_URL=https://testnet.cipherscan.io \
  -e VITE_ZEBRA_RPC_URL=https://mainnet.lightwalletd.com:9067 \
  zypherscan
```

### Using Docker Compose

```bash
# Create .env file with your variables
cp .env.example .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access at `http://localhost:8080`

## 📁 Project Structure

```
zypherscan/
├── src/                    # React frontend source
├── zypherscan-decrypt/     # Rust scanner + Express server
│   ├── src/               # Rust source code
│   ├── server.js          # Express server (serves API + static files)
│   └── scanner_client.js  # Node.js wrapper for Rust binary
├── dist/                   # Built frontend (created by `pnpm build`)
├── vite.config.ts         # Vite configuration
├── nixpacks.toml          # Railway build configuration
└── package.json           # Dependencies and scripts
```

## 🔧 API Endpoints

### Scanner API

- `POST /api/scan` - Scan blockchain with viewing key
  ```json
  {
    "uvk": "unified-viewing-key",
    "birthday": "block-height",
    "action": "all",
    "txid": null
  }
  ```

### Health Check

- `GET /api/health` - Server health status
- `GET /api/debug` - Configuration debug info

## 🐛 Troubleshooting

### Development Issues

**"Connection refused" on /api/scan:**

- Make sure backend is running: `pnpm run dev:backend`
- Backend should be on port 8080

**Frontend not loading:**

- Make sure frontend is running: `pnpm run dev:frontend`
- Frontend should be on port 3000

### Railway Issues

**Build fails:**

- Check Railway logs for errors
- Verify `nixpacks.toml` is present
- Ensure all environment variables are set

**API not working:**

- Check that build completed successfully
- Verify `dist/` folder was created
- Check Railway logs for runtime errors

**Rust binary not found:**

- Ensure `build:rust` ran successfully
- Check that `target/release/zypherscan-decrypt` exists

## 📊 Environment Variables

| Variable                          | Description            | Required | Default               |
| --------------------------------- | ---------------------- | -------- | --------------------- |
| `PORT`                            | Server port            | No       | 8080                  |
| `VITE_CIPHERSCAN_MAINNET_API_URL` | Mainnet API URL        | Yes      | -                     |
| `VITE_CIPHERSCAN_TESTNET_API_URL` | Testnet API URL        | Yes      | -                     |
| `VITE_ZEBRA_RPC_URL`              | Zebra RPC URL          | Yes      | -                     |
| `VITE_BACKEND_URL`                | Backend URL (dev only) | No       | http://localhost:8080 |
| `FRONTEND_URL`                    | Frontend URL (CORS)    | No       | http://localhost:3000 |

## 📝 Scripts

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `pnpm run dev:all`      | Run both frontend and backend together |
| `pnpm run dev:frontend` | Start Vite dev server (port 3000)      |
| `pnpm run dev:backend`  | Start Express server (port 8080)       |
| `pnpm run build`        | Build frontend only                    |
| `pnpm run build:rust`   | Build Rust binary only                 |
| `pnpm run build:all`    | Build everything (Rust + frontend)     |
| `pnpm start`            | Start production server                |

## 🎯 Key Features

- ✅ Unified server architecture for Railway
- ✅ Separate dev/prod configurations
- ✅ Rust-powered transaction scanner
- ✅ React frontend with Vite
- ✅ API proxying in development
- ✅ Static file serving in production
- ✅ CORS configured for all environments

## 📄 License

MIT
