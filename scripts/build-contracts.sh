#!/bin/sh
set -eu
if command -v stellar >/dev/null 2>&1; then
  stellar_cmd=stellar
else
  stellar_cmd=.toolchain/bin/stellar
fi
if ! command -v rustup >/dev/null 2>&1; then
  # Local compatibility path for this machine's Homebrew Rust installation.
  # A conventional rustup + wasm32v1-none installation needs none of these.
  export RUSTC_BOOTSTRAP=1
  export CARGO_UNSTABLE_BUILD_STD=core,alloc
  export CARGO_TARGET_WASM32V1_NONE_LINKER="$(command -v wasm-ld)"
fi
exec "$stellar_cmd" contract build "$@"
