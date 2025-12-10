#!/bin/bash

# Build script for WASM module with seed phrase support

echo "🔧 Building WASM module with seed phrase support..."
echo ""

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    echo ""
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    echo ""
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust not found. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Build WASM
echo "📦 Building WASM module..."
cd wasm
wasm-pack build --target web --out-dir ../public/wasm

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ WASM build successful!"
    echo ""
    echo "Generated files:"
    ls -lh ../public/wasm/
    echo ""
    echo "🎉 Seed phrase support is now available!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your dev server (pnpm run dev)"
    echo "2. Test seed phrase derivation at /wasm-diagnostics"
    echo "3. Use seed phrase connect in Auth page"
else
    echo ""
    echo "❌ WASM build failed. Check errors above."
    exit 1
fi
