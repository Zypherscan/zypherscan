# 🚀 Quick Start Guide

## Local Development

### Run Everything Together (Easiest)

```bash
pnpm run dev:all
```

This starts:

- ✅ Backend API on port 8080
- ✅ Frontend on port 3000

**Access:** http://localhost:3000

Press `Ctrl+C` to stop both servers.

---

## Docker

### Run Everything in Docker

```bash
docker-compose up -d
```

This starts everything in a container on port 8080.

**Access:** http://localhost:8080

**View logs:**

```bash
docker-compose logs -f
```

**Stop:**

```bash
docker-compose down
```

---

## Production (Railway)

Just push to GitHub - Railway auto-deploys!

**Required Environment Variables:**

```
PORT=8080
VITE_CIPHERSCAN_MAINNET_API_URL=https://api.cipherscan.io
VITE_CIPHERSCAN_TESTNET_API_URL=https://testnet.cipherscan.io
VITE_ZEBRA_RPC_URL=https://mainnet.lightwalletd.com:9067
```

---

## Testing

### Test the API

```bash
# Health check
curl http://localhost:8080/api/health

# Scan endpoint
curl -X POST http://localhost:8080/api/scan \
  -H "Content-Type: application/json" \
  -d '{"uvk": "test", "birthday": "2000000"}'
```

---

## All Commands

| Command                 | What it does                                 |
| ----------------------- | -------------------------------------------- |
| `pnpm run dev:all`      | 🚀 Run both frontend & backend (development) |
| `pnpm run dev:frontend` | Run only frontend (port 3000)                |
| `pnpm run dev:backend`  | Run only backend (port 8080)                 |
| `pnpm run build:all`    | Build everything for production              |
| `pnpm start`            | Start production server (port 8080)          |
| `docker-compose up -d`  | 🐳 Run in Docker (port 8080)                 |

---

## Ports Reference

| Environment     | Frontend | Backend | Access                       |
| --------------- | -------- | ------- | ---------------------------- |
| **Development** | 3000     | 8080    | http://localhost:3000        |
| **Production**  | -        | 8080    | http://localhost:8080        |
| **Docker**      | -        | 8080    | http://localhost:8080        |
| **Railway**     | -        | 8080    | https://your-app.railway.app |

---

## 🎯 Summary

✅ **Local Dev:** `pnpm run dev:all` → http://localhost:3000  
✅ **Docker:** `docker-compose up -d` → http://localhost:8080  
✅ **Railway:** Push to GitHub → Auto-deploys

That's it! 🚀
