import json
import ssl
import urllib.request
import yfinance as yf

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

names = {
    "3714": "富采", "3481": "群創", "2409": "友達", "6116": "彩晶", "8069": "元太",
    "2330": "台積電", "2454": "聯發科", "2303": "聯電", "3711": "日月光投控",
    "2449": "京元電子", "3034": "聯詠", "2379": "瑞昱", "2344": "華邦電",
    "2408": "南亞科", "2317": "鴻海", "2382": "廣達", "3231": "緯創",
    "6669": "緯穎", "2308": "台達電", "2357": "華碩", "2376": "技嘉",
    "3017": "奇鋐", "3324": "雙鴻", "2881": "富邦金", "2882": "國泰金",
    "2891": "中信金", "2886": "兆豐金", "2884": "玉山金", "2885": "元大金",
    "2603": "長榮", "2609": "陽明", "2615": "萬海", "2618": "長榮航",
    "1519": "華城", "2002": "中鋼", "0050": "元大台灣50", "0056": "元大高股息",
    "00878": "國泰永續高股息", "00919": "群益台灣精選高息", "00929": "復華台灣科技優息",
    "00940": "元大台灣價值高息", "006208": "富邦台50", "00713": "元大台灣高息低波",
    "00679B": "元大美債20年", "00687B": "國泰20年美債", "00937B": "群益ESG投等債20+",
    "009816": "凱基台灣TOP50", "7751": "竑騰", "3563": "牧德"
}

try:
    req = urllib.request.Request("https://finmindtrade.com", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        info = json.loads(resp.read().decode('utf-8'))
        for row in info.get("data", []):
            c = str(row.get("stock_id", "")).strip()
            n = str(row.get("stock_name", "")).strip()
            if c and n and (len(c) == 4 or c.startswith("00")):
                names[c] = n
except Exception as e:
    print("Info fetch warning:", e)

res = {}
codes = list(names.keys())
batch_size = 150

for i in range(0, len(codes), batch_size):
    chunk = codes[i:i+batch_size]
    tickers = [c + ".TW" for c in chunk] + [c + ".TWO" for c in chunk]
    try:
        df = yf.download(tickers, period="5d", progress=False, threads=True)
        if "Close" in df:
            closes = df["Close"]
            for sym in closes.columns:
                series = closes[sym].dropna()
                if len(series) >= 1:
                    pure_c = sym.replace(".TWO", "").replace(".TW", "")
                    last_p = float(series.iloc[-1])
                    prev_p = float(series.iloc[-2]) if len(series) >= 2 else last_p
                    if last_p > 0 and pure_c not in res:
                        res[pure_c] = {
                            "n": names.get(pure_c, pure_c),
                            "p": round(last_p, 2),
                            "y": round(prev_p, 2)
                        }
    except Exception as e:
        print("Batch error:", e)

with open("prices.json", "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False)

print("Saved total valid stocks:", len(res))
