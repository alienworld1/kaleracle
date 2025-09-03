#!/bin/bash

# Build script for Collaborative DAO Soroban contract

set -e

echo "Building Collaborative DAO contract..."

# Build the contract
cargo build --target wasm32v1-none --release

# Optimize the WASM file (if soroban CLI is available)
if command -v stellar &> /dev/null; then
    echo "Optimizing contract..."
    stellar contract optimize --wasm target/wasm32v1-none/release/dao.wasm
    echo "Contract built and optimized successfully!"
    echo "Output: target/wasm32v1-none/release/dao.wasm"
else
    echo "Stellar CLI not found. Contract built but not optimized."
    echo "Output: target/wasm32v1-none/release/dao.wasm"
fi

echo "Contract build complete!"
