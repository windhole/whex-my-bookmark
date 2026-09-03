# 0010. export と同じ merge 結果を検索付き一覧ページで閲覧する

Date: 2026-09-02
Status: Accepted

## Context

書庫と inbox をメニュー以外でも俯瞰したい。表示内容は export される Markdown と一致させ、inbox 保存後はほぼ同時に反映したい。編集 UI は不要。ツールバー右クリックからも開きたい。

## Decision

- 拡張内ページ `src/browse/index.html` を置く。URL は `chrome-extension://<id>/src/browse/index.html`。
- 表示データは `getMergedDocument()`（書庫 Markdown + inbox の merge）を正とする。export も同じ関数を使う。
- ページは閲覧専用。検索付きダッシュボード（エリア別セクション + フィルタ）。
- `chrome.storage.onChanged` で書庫 / inbox の変更を拾い、開いている一覧を再描画する。
- ツールバー右クリック（action context）とページ右クリックのルート直下に「Open bookmark list」を置き、一覧タブを開く。オプション画面にもリンクを置く。

## Consequences

- 拡張 ID はインストールごとに変わるので、Chrome ブックマークに登録する場合は ID を確認する必要がある。
- 一覧と export / メニューの件数・並びがずれにくくなる。
- 右クリックメニューの先頭に固定項目が増える。
