# 以下にあるキーワードの部分に検索したい単語を入れてください。
import requests
import pandas as pd
import time

def search_isbn_for_research(keyword):
    url = "https://www.googleapis.com/books/v1/volumes"
    # フィルタを外してヒット率を最大化し、ISBNを持つものだけを中身で判定する
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
            
            # 全ての識別子をチェック
            found_isbn = None
            identifiers = info.get("industryIdentifiers", [])
            
            for id_obj in identifiers:
                if id_obj["type"] in ["ISBN_13", "ISBN_10"]:
                    found_isbn = id_obj["identifier"]
                    break
            
            if found_isbn:
                results.append({"タイトル": title, "ISBN": found_isbn})
                print(f"✅ {found_isbn} | {title}")
                
        return results

    except Exception as e:
        print(f"  [!] エラー: {e}")
        return []

# --- 実行セクション ---
# 日本経済史、製造業、鉄道など、研究キーワードを自由に入れてください
keywords = ["日本経済史", "鉄道 産業発展", "マッキンゼー"]
all_data = []

for kw in keywords:
    res = search_isbn_for_research(kw)
    all_data.extend(res)
    time.sleep(1)

# 保存
if all_data:
    df = pd.DataFrame(all_data).drop_duplicates(subset="ISBN")
    df.to_csv("research_isbns.csv", index=False, encoding="utf-8-sig")
    print(f"\n✨ 処理完了！ {len(df)}件のデータを 'research_isbns.csv' に保存しました。")
