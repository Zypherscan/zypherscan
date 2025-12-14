# Scanner Architecture Guide

## Overview

Your ZypherScan project has multiple scanner implementations. Here's what works where:

## ✅ What Works on Vercel (Production)

### 1. **WASM Scanner** (Client-Side in Browser)

- **Location**: `zypherscan-decrypt/` → compiled to `lib/wasm/zypherscan_decrypt_bg.wasm`
- **How it works**: Runs entirely in the user's browser
- **Pros**:
  - ✅ Works on Vercel (static deployment)
  - ✅ Private - user's keys never leave their browser
  - ✅ No server costs
- **Cons**:
  - ⚠️ Slower than native
  - ⚠️ Limited by browser resources

**Build Command**:

```bash
cd zypherscan-decrypt
wasm-pack build --target web --out-dir ../lib/wasm
```

**Usage in React**:

```typescript
import init, { ZypherScanner } from "@/lib/wasm/zypherscan_decrypt";

// Initialize WASM
await init();

// Create scanner
const scanner = await ZypherScanner.new_from_uvk(uvk, birthday);

// Sync
await scanner.start_sync();

// Get data
const balances = await scanner.get_balances();
const history = await scanner.get_transaction_history();
```

---

## ✅ What Works Locally (Development)

### 2. **Native Binary + Node.js Proxy**

- **Location**: `zypherscan-decrypt/scanner_client.js`
- **How it works**: Spawns native Rust binary, wraps in Node.js
- **Pros**:
  - ✅ Much faster than WASM
  - ✅ Full Rust performance
- **Cons**:
  - ❌ Won't work on Vercel (no Rust runtime)
  - ❌ Requires building native binary for each platform

**Build Command**:

```bash
cd zypherscan-decrypt
cargo build --release
```

**Usage in Node.js**:

```javascript
import { runZypherScanner } from "./zypherscan-decrypt/scanner_client.js";

const result = await runZypherScanner(uvk, birthday, "all");
console.log(result.balances);
console.log(result.history);
```

---

## ❌ What Doesn't Work

### 3. **Vercel Rust Function** (Attempted)

- **Location**: `api/scan.rs`
- **Status**: ❌ **Not supported by Vercel**
- **Why**: Vercel only supports Node.js, Python, Go, Ruby serverless functions
- **Solution**: Use WASM instead (option #1)

---

## Recommended Architecture

### For Production (Vercel):

```
┌─────────────────────────────────────────┐
│  Vercel (Static Hosting)                │
│  ├─ index.html                          │
│  ├─ React App (Vite build)              │
│  └─ WASM files (lib/wasm/*.wasm)        │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  User's Browser                         │
│  ├─ Loads WASM module                   │
│  ├─ Enters viewing key                  │
│  ├─ WASM scans blockchain               │
│  └─ Displays results                    │
└─────────────────────────────────────────┘
```

### For Development (Local):

You can use either:

- **WASM** (same as production)
- **Native Binary** (faster for testing)

---

## How to Deploy to Vercel

### Step 1: Build WASM Module

```bash
# Install wasm-pack if needed
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build WASM
cd zypherscan-decrypt
wasm-pack build --target web --out-dir ../lib/wasm
cd ..
```

### Step 2: Ensure WASM Files Are Included

The `.vercelignore` file should **NOT** ignore:

- `lib/wasm/*.wasm`
- `lib/wasm/*.js`

It **SHOULD** ignore:

- `api/scan.rs` (Vercel Rust function)
- `zypherscan-decrypt/src/` (source code)
- `zypherscan-decrypt/target/` (build artifacts)

### Step 3: Deploy

```bash
git add .
git commit -m "Deploy with WASM scanner"
git push origin staging
```

Vercel will:

1. ✅ Run `pnpm install`
2. ✅ Run `pnpm run build` (Vite build)
3. ✅ Deploy `dist/` folder with WASM files
4. ✅ Serve everything as static files

---

## Current Status

✅ **WASM files exist**:

- `lib/wasm/zypherscan_decrypt_bg.wasm`
- `dist/wasm/zcash_wasm_bg.wasm`

❌ **Not currently used in React app**:

- No imports of WASM module found in `src/`

---

## Next Steps

1. **Integrate WASM into React app**:

   - Import WASM module in `DecryptTool.tsx`
   - Initialize WASM on component mount
   - Use WASM methods instead of API calls

2. **Remove Vercel Rust function**:

   - Delete `api/scan.rs` and `api/Cargo.toml` (not needed)
   - Keep only Node.js proxy files (`api/proxy-*.js`)

3. **Update build process**:
   - Add WASM build to CI/CD pipeline
   - Ensure WASM files are committed to git or built during deployment

---

## FAQ

**Q: Why can't I use Rust on Vercel?**
A: Vercel serverless functions only support Node.js, Python, Go, and Ruby. Rust must be compiled to WASM to run in the browser.

**Q: Is WASM slower than native Rust?**
A: Yes, but it's still very fast and runs at near-native speed. For blockchain scanning, the network latency is usually the bottleneck, not WASM performance.

**Q: Can I use the native binary for some users?**
A: Not on Vercel. You'd need a separate backend server (e.g., Railway, Fly.io) that can run native binaries.

**Q: Where are my viewing keys stored?**
A: With WASM, keys stay in the browser's memory and are never sent to any server. This is the most private option.
