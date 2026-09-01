# My Bookmark

個人用の Chrome 拡張。Markdown を正本にして、階層メニューからブックマークを開き、ツールバーの色付き8スロットに現在のページを保存する。

Firefox / Safari 向けパッケージはまだ出さない。`make firefox` と `make safari` は将来の差し込み口。

## 使い方

1. `make chrome`（テストして `dist/chrome` をビルドする）
2. Chrome で `chrome://extensions` を開き、デベロッパーモードをオンにする
3. 「パッケージ化されていない拡張機能を読み込む」で `dist/chrome` を選ぶ

- **ツールバー左クリック**: 8色の保存先。任意で annotation を書いてから色をクリック。ポップアップが開いているときは `1`–`8` でも保存できる
- **ページ右クリック / ツールバー右クリック**: 階層メニューからリンクを開く
- **オプション**: Markdown の編集、`.md` の import / export
- **ショートカット**: `Alt+1`–`Alt+4` を候補として登録する。`5`–`8` は `chrome://extensions/shortcuts` で自分で割り当てる（Chrome が自動割り当てる候補キーは4つまで）

## Markdown 方言

```markdown
# Inbox

- [Example](https://example.com)
  Optional annotation.

## Subfolder

- [Nested](https://example.org)
```

- ATX 見出しだけ。先頭から8個の H1 が保存スロット（色と番号はスロット順、名前は H1 の文言）
- H1 が8未満なら空のエリアを足す。9個目以降の H1 はメニューに出るが保存先にはしない
- ブックマークは `- [title](url)`。直後のインデント行が annotation
- 保存は選んだ H1 セクションの末尾へ追記する
- この方言以外の行は、保存や再出力のときに落ちることがある

初期の8エリア名: Inbox / Later / Reading / Reference / Work / Personal / Archive / Misc。H1 を書き換えればボタン名も変わる。

## 開発

```bash
npm install
npm test
npm run build    # または make chrome
npm run dev      # Vite + CRXJS の開発ビルド
```

設計判断は [docs/adr/](docs/adr/)。作業ログは [docs/devlog/](docs/devlog/)。
