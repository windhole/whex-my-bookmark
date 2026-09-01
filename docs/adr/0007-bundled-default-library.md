# 0007. 初期メニューは data/bookmarks.md をビルド時にバンドルする

Date: 2026-09-01
Status: Accepted

## Context

閲覧メニューの書庫は import した Markdown だが、毎回オプションから読み込むのは手間。個人用のデフォルト書庫をリポジトリの `data/bookmarks.md` に置き、拡張の初回起動でメニューに出したい。中身は個人のリンクなので git には入れない。

## Decision

- ビルド時、`data/bookmarks.md` があればその文字列を拡張に埋め込む。無ければ空文字。
- `chrome.storage.local` に書庫キーがまだ無いときだけ、埋め込んだ Markdown を初期値として書く。すでに import 済みなら触らない。
- `data/bookmarks.md` は gitignore する。フォルダ自体は `.gitkeep` で残す。

## Consequences

- `make chrome` 前に `data/bookmarks.md` を置けば、ロード直後からメニューが使える。
- ファイルを更新したらビルドし直しと、未初期化のプロファイルでの再ロードが必要。既に storage がある環境は import し直すかキーを消す。
- 個人のブックマーク URL が git に乗らない。
