# 0009. inbox への URL 重複保存を拒否する

Date: 2026-09-02
Status: Accepted

## Context

同じ URL を inbox に何度も保存するとメニューと export が冗長になる。重複時は保存せず、短いフィードバックで知らせたい。

## Decision

- 保存前に、メニュー表示と同じ merge 後の `# inbox` 配下の URL と比較し、正規化後に一致すれば追加しない。
- 重複時は通知は出さず、ツールバーバッジ背景を短時間エラー色にする（件数数字はそのまま）。

## Consequences

- 書庫 Markdown の `# inbox` に既にある URL も重複とみなす。
