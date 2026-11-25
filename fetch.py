import json
import ssl
import urllib.request
from datetime import datetime, timedelta

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

res = {}

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=25) as resp:
        return json.loads(resp.read().decode('utf-8'))

# 1. 先從 FinMind 取得全台灣上市櫃股票與 ETF 名單
try:
    info = get_json("https://finmindtrade.com")
    for row in info.get("data", []):
        c = str(row.get("stock_id", "")).strip()
        n = str(row.get("stock_name", "")).strip()
        if c and n:
            res[c] = {"n": n, "p": 0, "y": 0}
except Exception as e:
    print("Info error:", e)

# 2. 透過 Yahoo 財經介面批次抓取最新收盤價與昨收價 (不擋 GitHub 機房)
codes = list(res.keys())
if not codes:
    codes = ["3714", "3481", "2409", "2330", "3711", "2317", "0050", "0056", "00878", "00919", "009816"]

# 每次查詢 80 檔，涵蓋全部上市(.TW)與上櫃(.TWO)
batch_size = 80
for i in range(0, len(codes), batch_size):
    chunk = codes[i:i+batch_size]
    syms = [c + ".TW" for c in chunk] + [c + ".TWO" for c in chunk]
    url = "https://yahoo.com" + ",".join(syms)
    try:
        qdata = get_json(url)
        for item in qdata.get("quoteResponse", {}).get("result", []):
            sym = item.get("symbol", "")
            pure_c = sym.replace(".TWO", "").replace(".TW", "")
            price = item.get("regularMarketPrice")
            prev = item.get("regularMarketPreviousClose")
            if pure_c and price:
                old_n = res.get(pure_c, {}).get("n") or item.get("shortName") or pure_c
                res[pure_c] = {
                    "n": old_n,
                    "p": round(float(price), 2),
                    "y": round(float(prev if prev else price), 2)
                }
    except Exception:
        pass

# 過濾掉沒有價格的項目
final_res = {k: v for k, v in res.items() if v.get("p", 0) > 0}

with open("prices.json", "w", encoding="utf-8") as f:
    json.dump(final_res, f, ensure_ascii=False)

print("Successfully saved stocks count:", len(final_res))
