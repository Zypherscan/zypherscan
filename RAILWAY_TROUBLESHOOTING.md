# Railway Deployment Troubleshooting

## Current Status

✅ **Latest fixes pushed:**

- Server now listens on `0.0.0.0` (required for Railway)
- Added dist folder existence checks
- Added detailed startup logging
- Added error handling

## How to Check Railway Logs

1. Go to [railway.app](https://railway.app)
2. Click on your `zypherscan` project
3. Click on the "Deployments" tab
4. Click on the latest deployment
5. Click "View Logs"

## What to Look For in Logs

### ✅ **Successful Startup:**

```
🚀 ZypherScan Server Running
   Port: 3001
   Host: 0.0.0.0 (listening on all interfaces)
   Scanner API: http://localhost:3001/api/scan
   Health Check: http://localhost:3001/api/health
   Binary: /app/zypherscan-decrypt/target/release/zypherscan-decrypt
   Binary exists: true
   Dist folder: /app/dist
   Dist exists: true

✅ Server ready to accept connections
```

### ❌ **Common Issues:**

#### 1. Binary Not Found

```
Binary exists: false
```

**Solution:** Rust build failed. Check build logs for compilation errors.

#### 2. Dist Folder Missing

```
Dist exists: false
```

**Solution:** Vite build failed. Check if `pnpm run build` completed successfully.

#### 3. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:** Railway should handle this automatically. Check Railway settings.

#### 4. Module Not Found

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'express'
```

**Solution:** Dependencies not installed. Check if `pnpm install` ran successfully.

#### 5. Import Error

```
SyntaxError: Cannot use import statement outside a module
```

**Solution:** Missing `"type": "module"` in package.json (should already be there).

## Environment Variables to Check

Make sure these are set in Railway:

```bash
NODE_ENV=production
PORT=3001  # Railway might override this

# API URLs
VITE_CIPHERSCAN_MAINNET_API_URL=https://api.cipherscan.io
VITE_CIPHERSCAN_TESTNET_API_URL=https://testnet.cipherscan.io
VITE_ZEBRA_RPC_URL=https://mainnet.lightwalletd.com:9067
VITE_LIGHTWALLETD_URL=http://yamanote.proxy.rlwy.net:54918
```

## Build Process

Railway should run these commands in order:

1. **Setup:** Install Node.js, pnpm, Rust, cargo
2. **Install:** `pnpm install`
3. **Build Frontend:** `pnpm run build` → creates `dist/` folder
4. **Build Rust:** `cd zypherscan-decrypt && cargo build --release`
5. **Start:** `pnpm start` → runs `node zypherscan-decrypt/server.js`

## Quick Health Check

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app.railway.app/api/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-12-15T...",
  "binaryPath": "/app/zypherscan-decrypt/target/release/zypherscan-decrypt",
  "binaryExists": true
}
```

## If Still Getting 502 Errors

1. **Check Build Logs:**

   - Did Vite build complete?
   - Did Rust compilation finish?
   - Were dependencies installed?

2. **Check Runtime Logs:**

   - Is the server starting?
   - Are there any error messages?
   - Is it listening on the correct port?

3. **Check Railway Settings:**
   - Is the correct branch deployed (staging)?
   - Is the start command correct?
   - Are environment variables set?

## Manual Test Locally

Before deploying, test locally:

```bash
# Build everything
pnpm run build:all

# Start server
pnpm start

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/network/stats
```

## Common 502 Causes

1. **Server not starting** - Check logs for errors
2. **Wrong port** - Railway expects server to use `process.env.PORT`
3. **Not listening on 0.0.0.0** - Fixed in latest commit ✅
4. **Startup timeout** - Rust build might be too slow (first deploy)
5. **Missing dependencies** - Check if all npm packages installed

## Next Steps

1. Wait for Railway to redeploy (2-3 minutes)
2. Check the deployment logs
3. Test the `/api/health` endpoint
4. If still failing, share the Railway logs

---

**The latest commit should fix the 502 errors!** 🤞
