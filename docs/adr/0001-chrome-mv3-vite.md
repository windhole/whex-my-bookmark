# 0001. Chrome MV3 先行、Vite + Vanilla TypeScript、Makefile で他ブラウザ成果物

Date: 2026-09-01
Status: Accepted

## Context

個人用ブックマーク拡張をまず自分が毎日使う Chrome で動かす。いずれ Safari / Firefox にも同じソースから出したい。UI は色付き8ボタンとオプションのテキストエリアが中心で、コンポーネントフレームワークは過剰。成果物の入口は `make` にしたい。

## Decision

- Manifest V3 の Chrome 拡張を第一ターゲットにする。
- UI と service worker は Vanilla TypeScript。React / Preact は使わない。
- バンドルは Vite。開発時のエントリ分割（background / popup / options）を Vite に任せる。
- 共有ソースは `src/`。`make chrome` が配布用ディレクトリを出す。`make firefox` / `make safari` は今は stub とし、後でマニフェスト差分と `safari-web-extension-converter` を足す。

## Consequences

- Chrome ではすぐ使える。他ブラウザは Makefile の差し込み口があるので、後からビルドターゲットだけ足せる。
- フレームワークを置かないのでポップアップの見た目は自前 CSS になる。
- Vite プラグインや出力レイアウトが Chrome 向けに寄る。Firefox 対応時に `browser_specific_settings` などの差分を Makefile 側で吸収する必要がある。
