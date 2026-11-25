import json
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def get_json(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

# 1. 取得全台灣上市櫃股票與 ETF 代號及名稱
stock_names = {}
try:
    info = get_json("https://finmindtrade.com")
    for row in info.get("data", []):
        c = str(row.get("stock_id", "")).strip()
        n = str(row.get("stock_name", "")).strip()
        # 過濾掉權證 (只保留一般股票 4碼 與 ETF 00開頭)
        if c and n and (len(c) == 4 or c.startswith("00")):
            stock_names[c] = n
except Exception as e:
    print("Info error:", e)

if not stock_names:
    stock_names = {
        "3714": "富采", "3481": "群創", "2409": "友達", "2330": "台積電",
        "3711": "日月光投控", "2317": "鴻海", "0050": "元大台灣50",
        "0056": "元大高股息", "00878": "國泰永續高股息", "00919": "群益台灣精選高息",
        "00929": "復華台灣科技優息", "00940": "元大台灣價值高息", "009816": "凱基台灣TOP50"
    }

# 2. 使用免驗證 Yahoo v8 圖表介面並發抓取最新收盤價與昨收價
def fetch_one(code):
    name = stock_names.get(code, code)
    for suffix in [".TW", ".TWO"]:
        url = f"https://yahoo.com{code}{suffix}?interval=1d&range=5d"
        try:
            data = get_json(url)
            result = data.get("chart", {}).get("result")
            if result:
                meta = result.pop().get("meta", {})
                price = meta.get("regularMarketPrice")
                prev = meta.get("chartPreviousClose") or meta.get("previousClose") or price
                if price and float(price) > 0:
                    return code, {
                        "n": name,
                        "p": round(float(price), 2),
                        "y": round(float(prev), 2)
                    }
        except Exception:
            continue
    return code, None

final_res = {}
codes = list(stock_names.keys())

with ThreadPoolExecutor(max_workers=25) as executor:
    for code, info in executor.map(fetch_one, codes):
        if info:
            final_res[code] = info

with open("prices.json", "w", encoding="utf-8") as f:
    json.dump(final_res, f, ensure_ascii=False)

print("Total valid stocks saved:", len(final_res))
