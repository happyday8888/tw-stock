import json
import ssl
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def get_json(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        return json.loads(resp.read().decode('utf-8'))

res = {}

# 1. 從 FinMind 取得最新一個交易日的全台灣所有上市櫃股票與 ETF 成交價
from datetime import datetime, timedelta
for days_back in range(0, 7):
    target_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
    url = f"https://finmindtrade.com{target_date}"
    try:
        data = get_json(url).get("data", [])
        if len(data) > 500:
            # 取得前一個交易日計算昨收
            prev_map = {}
            for p_back in range(days_back + 1, days_back + 8):
                p_date = (datetime.now() - timedelta(days=p_back)).strftime('%Y-%m-%d')
                p_data = get_json(f"https://finmindtrade.com{p_date}").get("data", [])
                if len(p_data) > 500:
                    for item in p_data:
                        prev_map[item["stock_id"]] = float(item["close"])
                    break

            # 取得股票中文名稱對照表
            name_map = {}
            info_data = get_json("https://finmindtrade.com").get("data", [])
            for item in info_data:
                name_map[item["stock_id"]] = item["stock_name"]

            for item in data:
                c = str(item.get("stock_id", "")).strip()
                close_p = float(item.get("close", 0))
                if c and close_p > 0:
                    prev_p = prev_map.get(c, float(item.get("open", close_p)))
                    res[c] = {
                        "n": name_map.get(c, c),
                        "p": round(close_p, 2),
                        "y": round(prev_p, 2)
                    }
            break
    except Exception as e:
        print(f"Date {target_date} error:", e)

with open("prices.json", "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False)

print("Total stocks saved to prices.json:", len(res))
