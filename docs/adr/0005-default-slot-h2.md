# 0005. ワンタッチ保存は Markdown の # Default Slot 配下の H2

Date: 2026-09-01
Status: Superseded by ADR-0006

## Context

ADR-0004 はワンタッチ先を「先頭6つの H1」とし、メニューだけ `Default Slot` で包んでいた。7個目以降の H1 はトップレベルのメニュー専用フォルダとして残る。正本の Markdown とメニューの形がずれ、旧8エリア文書では余りが見出し階層の外に残る。利用者は余りも含め `# Default Slot` の下に置きたい。

## Decision

- ワンタッチ保存の6枠は、H1 `# Default Slot` 直下の先頭6つの H2。色・番号・ボタン名はその H2。
- `# Default Slot` が無い文書は、既存のトップレベル H1 をすべて H2 に一段下げて `# Default Slot` の子にする（旧 Inbox 等や余りもここに入る）。
- `# Default Slot` が既にある文書では、兄弟の H1 はそのまま（閲覧用の別分類）。H2 が6未満ならデフォルト名で足す。
- 7個目以降の H2 は `Default Slot` 内のメニュー項目で、保存先にはしない。
- 閲覧メニューは Markdown の見出し階層をそのまま出す。メニュー専用の包みフォルダは作らない。

## Consequences

- デフォルト文書は `# Default Slot` と6つの `##` になる。
- 旧形式（H1 が Inbox…）は初回読み込みで `# Default Slot` 配下へ移行する。
- 保存追記は選んだ H2 セクションの末尾。H1 直下へは書かない。
