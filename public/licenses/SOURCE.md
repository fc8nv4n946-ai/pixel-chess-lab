# Stockfish corresponding source

Distributed engine: **stockfish npm 19.0.1**, unmodified
`stockfish-19-lite-single.js` and `stockfish-19-lite-single.wasm`.

The adjacent [source archive](stockfish-js-v19.0.1-source.tar.gz) is the
complete upstream `v19.0.1` tree (commit
`8d9ca57043594a8fa6ae0b73fb685d9105bf51df`), including C++, JavaScript glue,
Makefiles, build scripts, authors, and license. The adjacent
[nn-61e7af4bb97d.nnue](nn-61e7af4bb97d.nnue) is the exact embedded lite
neural network, recovered from the WASM data segments and verified against
its upstream SHA-256 identity:
`61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b`.
No network download is necessary to obtain this corresponding source.

## Rebuild (not required to run the application)

1. Extract `stockfish-js-v19.0.1-source.tar.gz`.
2. Copy `nn-61e7af4bb97d.nnue` to the extracted `src/` directory.
3. Install/activate Emscripten **6.0.9**, Node.js and GNU make as described
   by the archived upstream README. Use normal TLS and checksum validation.
4. In the extracted root, run `npm install --ignore-scripts` (build-tool
   dependency Terser is pinned in upstream package.json), then
   `node build.js --single-threaded --lite --strict-em-check`.
5. Outputs are in `src/`; see `node build.js --help` and the included
   README for output naming and other build options.

The included neural-network data makes upstream's network-fetch step
unnecessary for the lite build. The upstream downloader is preserved verbatim
in the source archive; do not disable TLS verification if fetching other nets.
The rebuild instructions follow upstream; rebuilding the engine itself was
not performed as part of application validation.

Application source and artwork generation:
https://github.com/fc8nv4n946-ai/pixel-chess-lab

All files here and engine checksums are listed in SHA256SUMS.txt.
