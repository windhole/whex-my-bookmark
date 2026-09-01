# 0006. 保存は inbox のローカル配列、Markdown は import 書庫、export で merge

Date: 2026-09-01
Status: Accepted

## Context

ワンタッチ保存先を複数スロットや Markdown 追記にすると、ボタン操作と正本の形が複雑になる。保存は「今見ているページを取る」だけにしたい。書庫の階層はこれまでどおり Markdown で持ち、編集 UI は不要。書き出しのときだけ保存分と書庫を足す。

## Decision

- ツールバーボタンを押すと、現在のページを `chrome.storage.local` の inbox 配列へ追加する。ポップアップもエリア選択も無い。
- MV3 の service worker では `localStorage` が使えないので、端末内保存は `chrome.storage.local` とする。
- import した Markdown は閲覧メニュー用の書庫。オプションに Markdown の表示・編集は置かない（import / export のみ）。
- export は inbox を `# inbox` 節に載せ、import 済み Markdown と merge したファイルを出す。書庫側は上書きしない。
- 6スロット / `# Default Slot` への保存（ADR-0004, ADR-0005）はやめる。

## Consequences

- 保存はボタン一回で終わる。保存直後の項目は Markdown ファイルにはまだ無い。
- メニューでは inbox 配列を `# inbox` 相当として重ねて見せ、保存したリンクもすぐ開ける。
- 同じ inbox を何度 export しても、書庫を書き換えない限り重複の増え方は同じ（ファイル側にだけ `# inbox` が足される）。
