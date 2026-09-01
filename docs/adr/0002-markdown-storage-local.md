# 0002. 正本は Markdown 文字列、永続化は chrome.storage.local

Date: 2026-09-01
Status: Accepted

## Context

ブックマークの閲覧メニューと8エリアへの保存は同じデータを共有する。インポート・エクスポートは Markdown ファイル。`chrome.storage.sync` はおおよそ 100KB 制限があり、書庫が育つとすぐ足りない。個人用途なので端末内に置けばよく、バックアップはファイル export で足りる。

## Decision

- 正本は1本の Markdown 文字列とする。パース結果の AST はキャッシュ用途に留め、書き込みは常に Markdown へ戻す。
- 永続化は `chrome.storage.local`（キーはブックマーク本文と、将来のスロット色など付属設定）。
- 同期はブラウザ sync にもクラウドにもしない。バックアップはオプション画面からの `.md` export。
- Markdown の変更（保存・オプション編集・import）は storage に書き、`storage.onChanged` で contextMenus を作り直す。

## Consequences

- 大きな書庫でも sync 上限にぶつからない。別マシンへは export/import が必要。
- 拡張を消すと local も消える。export を運用の一部にする。
- 正本がテキストなので、オプションの textarea とファイル I/O がそのまま編集手段になる。
