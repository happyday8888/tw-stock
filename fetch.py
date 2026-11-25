import json
import ssl
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

res = {}

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        return json.loads(resp.read().decode('utf-8'))

try:
    for it in get_json("https://twse.com.tw"):
        c = it.get("Code", "").strip()
        p_str = str(it.get("ClosingPrice", "")).replace(",", "").strip()
        d_str = str(it.get("Change", "")).replace(",", "").strip()
        if c and p_str:
            try:
                p = float(p_str)
                d = float(d_str) if d_str else 0.0
                if p > 0:
                    res[c] = {"n": it.get("Name", "").strip(), "p": p, "y": round(p - d, 2)}
            except Exception:
                pass
except Exception as e:
    print("TWSE error:", e)

try:
    for it in get_json("https://tpex.org.tw"):
        c = it.get("SecuritiesCompanyCode", "").strip()
        p_str = str(it.get("Close", "")).replace(",", "").strip()
        d_str = str(it.get("Change", "")).replace(",", "").strip()
        if c and p_str:
            try:
                p = float(p_str)
                d = float(d_str) if d_str else 0.0
                if p > 0:
                    res[c] = {"n": it.get("CompanyName", "").strip(), "p": p, "y": round(p - d, 2)}
            except Exception:
                pass
except Exception as e:
    print("TPEx error:", e)

with open("prices.json", "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False)

print("Saved total stocks:", len(res))
