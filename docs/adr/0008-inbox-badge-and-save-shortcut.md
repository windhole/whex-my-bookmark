# 0008. バッジは inbox 件数、保存失敗は通知、ショートカットは mac のみ

Date: 2026-09-02
Status: Accepted

## Context

ツールバーバッジは inbox の件数を示したい。保存に失敗したときは `!` で件数を隠すのではなく、別途エラーを知らせたい。inbox 保存はキーボードからも呼び出したいが、利用環境は macOS の Chrome のみ。

## Decision

- バッジの数字は merge 後の `# inbox` 節のブックマーク数（メニュー表示と同じ）。0 件なら非表示。
- 保存失敗時はバッジの数字はそのまま、背景色をエラー色にし、`chrome.notifications` で理由を表示する。
- inbox 保存は `commands._execute_action` に割り当てる。manifest の `suggested_key` は使わない（Chrome は修飾キー3つなどの ⌃⌥⌘1 を suggested_key で登録できない）。mac では `chrome://extensions/shortcuts` で手動設定する。Windows / Linux も同様に未割り当てのまま始める。

## Consequences

- 件数とエラー状態を同時に見られる。通知のため `notifications` 権限が増える。
- Chrome がショートカットを拒否した場合や、希望の ⌃⌥⌘1 を使う場合は `chrome://extensions/shortcuts` で手動設定する。競合時はサイレントに無効になることがある。
