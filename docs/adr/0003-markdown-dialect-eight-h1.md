# 0003. 制限付き Markdown 方言と先頭8つの H1 が保存スロット

Date: 2026-09-01
Status: Accepted (save-slot mapping superseded by ADR-0006)

## Context

階層メニューと色付き8保存先を1本の Markdown で表したい。汎用 Markdown パーサはラウンドトリップが弱く、見出し・リンク・注釈以外の記法は今は要らない。保存先は「見てすぐ選ぶ8枠」なので、H1 とスロットを固定対応させる。

## Decision

- 自前パーサで次のサブセットだけ扱う。ATX 見出し（`#`〜）、`- [title](url)`、その直後のインデント行を annotation。
- H1 がエリア。H2 以降がメニュー上のフォルダ。リスト項目がブックマーク。
- ワンタッチ保存先と見出しの対応は ADR-0006（inbox は local 配列。Markdown の `# inbox` は export 時の merge 先）。
- 不明な行は serialize で落ちてよい。同一 URL の重複は許可する。
- Chrome の contextMenus 深さ制限に収まるよう、深すぎる見出しは親ラベルへ結合して潰す。

## Consequences

- import した Markdown はメニュー用。保存分との足し方は ADR-0006。
- フル Markdown 互換ではない。不明な行は serialize で落ちてよい。
