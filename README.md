# 図書館APIによる蔵書検索ツール

カーリルAPIを活用して、本のISBN一括取得から特定図書館の蔵書確認までを行うツールです。

## 概要

1. **Python** でテーマに関連する書籍のISBNをGoogle Books APIから一括取得
2. 取得したISBNをGoogleスプレッドシートのA列に貼り付け
3. **Google Apps Script (GAS)** をデプロイして、設定した図書館の蔵書状況を自動確認

複数テーマを広く調査したい場合に向いています。一冊の本を検索するには向いていません。

## ファイル構成

```
API_projects/
├── python/
│   ├── API.py           # ISBNを一括取得するPythonスクリプト
│   └── requirements.txt # 依存パッケージ
├── gas/
│   └── code.gs          # 蔵書確認するGoogle Apps Script
└── docs/
    └── setup.md         # スプレッドシートの列定義・セットアップ手順
```

## セットアップ

### Python（ISBN取得）

```bash
# 依存パッケージをインストール
pip install -r API_projects/python/requirements.txt

# デフォルトキーワードで実行
python API_projects/python/API.py

# キーワードを指定して実行
python API_projects/python/API.py 日本経済史 "鉄道 産業発展"

# 出力ファイル名を指定
python API_projects/python/API.py 日本経済史 --output my_books.csv
```

実行後、カレントディレクトリに `research_isbns.csv` が生成されます。

### Google Apps Script（蔵書確認）

1. [スプレッドシートのテンプレートをコピー](https://docs.google.com/spreadsheets/d/1Lxd1xxr6rc0tOqxUOAplIAx3CWkPBKdGODAOh4gL1Yc/copy)
2. A列に取得したISBNを貼り付け
3. メニューから「拡張機能」→「Apps Script」を開き、`code.gs` の内容を貼り付け
4. スクリプトプロパティに `CALIL_API_KEY` を設定（取得先: [カーリルAPI](https://calil.jp/doc/api.html)）
5. スプレッドシートを再読み込みすると「📖 研究用メニュー」が追加されるので実行

詳細な列定義と設定手順は `API_projects/docs/setup.md` を参照してください。

## 図書館の変更方法

デフォルトは調布・府中・稲城の図書館です。変更するには `code.gs` 内の `SYSTEM_IDS` を編集してください。

```javascript
const SYSTEM_IDS = 'Tokyo_Chofu,Tokyo_Fuchu,Tokyo_Inagi';
```

システムIDは[カーリル 図書館検索](https://calil.jp/library/)で確認できます。

## 注意

- GAS実行後に「確認中...」が残る場合は、数分待って再度実行してください（カーリルAPIの仕様）
- CSVファイルはGitにコミットされません（`.gitignore` で除外済み）
