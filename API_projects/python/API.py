import argparse
import os
import requests
import pandas as pd
import time
from dotenv import load_dotenv

load_dotenv()


def search_isbn_for_research(keyword):
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {
        "q": keyword,
        "maxResults": 40
    }

    print(f"\n--- 「{keyword}」を探索中 ---")
    try:
        res = requests.get(url, params=params)
        res.raise_for_status()
        data = res.json()

        if "items" not in data:
            print("  -> 該当するデータが見つかりませんでした。")
            return []

        results = []
        for item in data["items"]:
            info = item.get("volumeInfo", {})
            title = info.get("title", "不明")

            isbn_13 = None
            isbn_10 = None
            for id_obj in info.get("industryIdentifiers", []):
                if id_obj["type"] == "ISBN_13":
                    isbn_13 = id_obj["identifier"]
                elif id_obj["type"] == "ISBN_10":
                    isbn_10 = id_obj["identifier"]

            found_isbn = isbn_13 or isbn_10
            if found_isbn:
                results.append({"タイトル": title, "ISBN": found_isbn})
                print(f"  {found_isbn} | {title}")

        return results

    except Exception as e:
        print(f"  [!] エラー: {e}")
        return []


def main():
    env_output = os.getenv("DEFAULT_OUTPUT", "research_isbns.csv")
    env_keywords = os.getenv("DEFAULT_KEYWORDS", "日本経済史,鉄道 産業発展,マッキンゼー")

    parser = argparse.ArgumentParser(
        description="Google Books APIでISBNを一括取得するツール",
        epilog="例: python API.py 日本経済史 \"鉄道 産業発展\" マッキンゼー"
    )
    parser.add_argument("keywords", nargs="*", help="検索キーワード（複数可）")
    parser.add_argument("--output", default=env_output, help="出力CSVファイル名")
    args = parser.parse_args()

    keywords = args.keywords if args.keywords else env_keywords.split(",")

    all_data = []
    for kw in keywords:
        res = search_isbn_for_research(kw)
        all_data.extend(res)
        time.sleep(1)

    if all_data:
        df = pd.DataFrame(all_data).drop_duplicates(subset="ISBN")
        df.to_csv(args.output, index=False, encoding="utf-8-sig")
        print(f"\n処理完了！ {len(df)}件のデータを '{args.output}' に保存しました。")
    else:
        print("\n保存するデータがありませんでした。")


if __name__ == "__main__":
    main()
