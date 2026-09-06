# 0012. 拡張のバージョンを package.json 基準でビルドに埋め込む

Date: 2026-09-06
Status: Accepted

## Context

サイドロード運用では、`make chrome` 後に Chrome が古い `dist` を掴んだままか判別しづらい。読み込み中の拡張がどのコミット由来か、UI 上でも確実に分かるようにしたい。

## Decision

- セマンティックバージョンの正本は `package.json` の `version`。
- ビルド時に `manifest.json` の `version` と、人が読む `version_name`（例: `0.2.0 (a1b2c3d)`）を注入する。`version_name` は `chrome://extensions` に表示される。
- 同じ文字列を `virtual:app-version` 経由でオプション・一覧ページ・ツールバー tooltip にも出す。
- バージョン上げは `npm version patch|minor|major --no-git-tag-version` のあとビルド・コミットする。

## Consequences

- `src/manifest.json` の `version` はビルドで上書きされる（ソース上の値は参考用）。
- git が無い／浅い clone ではハッシュが `unknown` になる。
- 更新確認は「拡張を再読み込み → オプションか chrome://extensions で version_name を見る」。
