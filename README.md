# My Bookmark

個人用の Chrome 拡張。ツールバーボタンで今のページを `inbox` に保存し、import した Markdown を階層メニューから開く。

Firefox / Safari 向けパッケージはまだ出さない。`make firefox` と `make safari` は将来の差し込み口。

## 使い方

1. `make chrome`（テストして `dist/chrome` をビルドする）
2. Chrome で `chrome://extensions` を開き、デベロッパーモードをオンにする
3. 「パッケージ化されていない拡張機能を読み込む」で `dist/chrome` を選ぶ

- **ツールバー左クリック**: 現在のページを `inbox`（`chrome.storage.local`）へ保存。バッジに件数が出る
- **ページ右クリック / ツールバー右クリック**: import 済み Markdown と inbox を重ねた階層メニューからリンクを開く
- **オプション**: Markdown の import と、inbox を `# inbox` に載せた merge 結果の export。編集画面は無い

## Markdown 方言

```markdown
# inbox

- [Saved page](https://example.com)

# Wiki

## Subfolder

- [Nested](https://example.org)
```

- ATX 見出しだけ。H1 がメニューのトップ、H2 以降がフォルダ
- ブックマークは `- [title](url)`。直後のインデント行が annotation
- ツールバー保存は Markdown を書き換えない。export のとき inbox を `# inbox` に足して、import 済み文書と merge する
- この方言以外の行は、export の再出力で落ちることがある

## 開発

```bash
npm install
npm test
npm run build    # または make chrome
npm run dev      # Vite + CRXJS の開発ビルド
```

設計判断は [docs/adr/](docs/adr/)。作業ログは [docs/devlog/](docs/devlog/)。
