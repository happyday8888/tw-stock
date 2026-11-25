var db = "3714:富采:面板光電|3481:群創:面板光電|2409:友達:面板光電|6116:彩晶:面板光電|8069:元太:面板光電|2330:台積電:半導體|2454:聯發科:半導體|2303:聯電:半導體|3711:日月光投控:半導體|2449:京元電子:半導體|3034:聯詠:半導體|2379:瑞昱:半導體|2344:華邦電:半導體|2408:南亞科:半導體|2317:鴻海:AI電子|2382:廣達:AI電子|3231:緯創:AI電子|6669:緯穎:AI電子|2308:台達電:AI電子|2357:華碩:AI電子|2376:技嘉:AI電子|3017:奇鋐:AI電子|3324:雙鴻:AI電子|2881:富邦金:金融股|2882:國泰金:金融股|2891:中信金:金融股|2886:兆豐金:金融股|2884:玉山金:金融股|2885:元大金:金融股|2603:長榮:航運傳產|2609:陽明:航運傳產|2615:萬海:航運傳產|2618:長榮航:航運傳產|1519:華城:航運傳產|2002:中鋼:航運傳產|0050:元大台灣50:ETF|0056:元大高股息:ETF|00878:國泰永續高股息:ETF|00919:群益台灣精選高息:ETF|00929:復華台灣科技優息:ETF|00940:元大台灣價值高息:ETF|006208:富邦台50:ETF|00713:元大台灣高息低波:ETF|00679B:元大美債20年:ETF|00687B:國泰20年美債:ETF|00937B:群益ESG投等債20+:ETF|009816:凱基台灣TOP50:ETF";

var dict = {};
db.split("|").forEach(function(r) {
  var p = r.split(":");
  var c = p.shift(), n = p.shift(), cat = p.shift();
  dict[c] = { name: n, cat: cat };
});

// 自動在輸入框上方建立一排「候選完整股名快選膠囊」容器
var suggestBox = document.createElement('div');
suggestBox.id = 'suggestBox';
suggestBox.style.cssText = 'display:none;gap:6px;flex-wrap:wrap;margin-bottom:8px;';
var gridEl = document.querySelector('.grid');
if (gridEl && gridEl.parentNode) {
  gridEl.parentNode.insertBefore(suggestBox, gridEl);
}

var liveData = {};
function loadLocalJson(cb) {
  fetch('prices.json?t=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      liveData = data || {};
      for (var k in liveData) {
        if (!dict[k]) dict[k] = { name: liveData[k].n, cat: k.indexOf('00') === 0 ? 'ETF' : '其他' };
      }
      if (cb) cb(true);
    })
    .catch(function() { if (cb) cb(false); });
}
loadLocalJson();

var colors = { '半導體':'#3B82F6','AI電子':'#8B5CF6','面板光電':'#06B6D4','ETF':'#F59E0B','金融股':'#EC4899','航運傳產':'#10B981','其他':'#6B7280' };
var stocks = JSON.parse(localStorage.getItem('twStocksV10')) || [
  { name: '富采', code: '3714', cat: '面板光電', shares: 1000, price: 42.5, prev: 41.0, cost: 40000 },
  { name: '群創', code: '3481', cat: '面板光電', shares: 1000, price: 15.8, prev: 15.5, cost: 15000 }
];
var curTab = '全部';

function forceReload() { window.location.replace(window.location.pathname + '?t=' + Date.now()); }
function fmt(n, s) { var r = Math.round(n), str = Math.abs(r).toLocaleString(); return s ? (r > 0 ? '+' : r < 0 ? '-' : '') + str : (r < 0 ? '-' : '') + str; }

function clearPrices() {
  document.getElementById('inPrice').value = '';
  document.getElementById('inPrev').value = '';
  suggestBox.style.display = 'none';
  suggestBox.innerHTML = '';
}

function fillPriceIfFound(c) {
  if (liveData[c]) {
    document.getElementById('inPrice').value = liveData[c].p;
    document.getElementById('inPrev').value = liveData[c].y;
  }
}

// 點擊候選膠囊後，立刻將股名補全為完整名稱
function pickCandidate(code) {
  if (dict[code]) {
    document.getElementById('inName').value = dict[code].name;
    document.getElementById('inCode').value = code;
    document.getElementById('inCat').value = dict[code].cat;
    fillPriceIfFound(code);
    suggestBox.style.display = 'none';
  }
}

function syncCode(v) {
  var c = v.trim().toUpperCase(), elN = document.getElementById('inName'), elC = document.getElementById('inCat');
  if (!c) {
    elN.value = '';
    clearPrices();
    return;
  }
  suggestBox.style.display = 'none';
  if (dict[c]) { elN.value = dict[c].name; elC.value = dict[c].cat; }
  else if (c.indexOf('00') === 0) { elC.value = 'ETF'; }
  fillPriceIfFound(c);
}

function syncName(v) {
  var q = v.trim().toUpperCase(), elK = document.getElementById('inCode'), elC = document.getElementById('inCat');
  if (!q) {
    elK.value = '';
    clearPrices();
    return;
  }
  if (q.length < 2) {
    suggestBox.style.display = 'none';
    return;
  }

  var matches = [];
  for (var k in dict) {
    if (dict[k].name.toUpperCase().indexOf(q) !== -1) {
      matches.push({ code: k, name: dict[k].name, cat: dict[k].cat });
    }
  }

  if (matches.length > 0) {
    var first = matches[0];
    elK.value = first.code;
    elC.value = first.cat;
    fillPriceIfFound(first.code);

    // 若輸入的是簡稱（尚未打完完整股名），顯示一鍵補全完整股名按鈕（最多顯示 4 筆相似股）
    if (first.name.toUpperCase() !== q) {
      suggestBox.style.display = 'flex';
      suggestBox.innerHTML = matches.slice(0, 4).map(function(m) {
        return '<span onclick="pickCandidate(\'' + m.code + '\')" style="background:#2A2412;border:1px solid #FBBF24;color:#FBBF24;font-size:12px;padding:4px 10px;border-radius:14px;cursor:pointer;">👉 ' + m.name + ' (' + m.code + ')</span>';
      }).join('');
    } else {
      suggestBox.style.display = 'none';
    }
  } else {
    suggestBox.style.display = 'none';
  }
}

// 當使用者離開股名輸入框時，若剛好只匹配到唯一一檔，也自動補全為完整股名
document.getElementById('inName').addEventListener('blur', function() {
  var q = this.value.trim().toUpperCase();
  if (q.length >= 2) {
    var exactOrSingle = [];
    for (var k in dict) {
      if (dict[k].name.toUpperCase().indexOf(q) !== -1) exactOrSingle.push(dict[k].name);
    }
    if (exactOrSingle.length === 1) {
      this.value = exactOrSingle[0];
      suggestBox.style.display = 'none';
    }
  }
});

function render() {
  var cats = ['全部'];
  stocks.forEach(function(s) { if (cats.indexOf(s.cat) === -1) cats.push(s.cat); });
  document.getElementById('tabs').innerHTML = cats.map(function(c) {
    return '<button type="button" onclick="setTab(\'' + c + '\')" style="flex:none;background:' + (curTab===c?'#F04438':'#262626') + ';color:' + (curTab===c?'#FFF':'#AAA') + ';padding:6px 12px;border-radius:15px;font-size:12px;">' + c + '</button>';
  }).join('');

  var dSum = 0, vSum = 0, cSum = 0, html = '';
  stocks.forEach(function(it, i) {
    if (curTab !== '全部' && it.cat !== curTab) return;
    var val = it.price * it.shares, dPL = (it.price - it.prev) * it.shares, totPL = val - it.cost;
    var pct = it.prev > 0 ? ((it.price - it.prev) / it.prev) * 100 : 0;
    dSum += dPL; vSum += val; cSum += it.cost;
    var c1 = dPL >= 0 ? '#F04438' : '#12B76A', c2 = totPL >= 0 ? '#F04438' : '#12B76A';
    html += '<div class="row"><div><strong>' + it.name + '</strong> <span style="background:' + (colors[it.cat]||'#555') + ';font-size:10px;padding:1px 4px;border-radius:3px;">' + it.cat + '</span><br><span style="font-size:11px;color:#888;">' + it.code + ' (' + it.shares + '股)</span> <span onclick="delItem(' + i + ')" style="background:#333;color:#AAA;font-size:10px;padding:1px 5px;border-radius:3px;cursor:pointer;">刪除</span></div><div style="text-align:right;color:' + c1 + ';font-weight:bold;">' + fmt(dPL, true) + '</div><div style="text-align:right;"><span style="background:' + c1 + ';padding:2px 6px;border-radius:4px;font-size:12px;font-weight:bold;">' + it.price + '</span><br><span style="color:' + c1 + ';font-size:11px;">' + (pct>=0?'+':'') + pct.toFixed(2) + '%</span></div><div style="text-align:right;color:' + c2 + ';font-weight:bold;">' + fmt(totPL, true) + '</div></div>';
  });
  var acc = vSum - cSum;
  document.getElementById('sDay').innerText = fmt(dSum, true);
  document.getElementById('sDay').style.color = dSum >= 0 ? '#F04438' : '#12B76A';
  document.getElementById('sTot').innerText = fmt(acc, true);
  document.getElementById('sTot').style.color = acc >= 0 ? '#F04438' : '#12B76A';
  document.getElementById('sVal').innerText = fmt(vSum, false);
  document.getElementById('list').innerHTML = html;
}

function setTab(c) { curTab = c; render(); }
function delItem(i) { stocks.splice(i, 1); localStorage.setItem('twStocksV10', JSON.stringify(stocks)); render(); }

function addStock() {
  var n = document.getElementById('inName').value.trim(), sh = parseFloat(document.getElementById('inShares').value), pr = parseFloat(document.getElementById('inPrice').value);
  if (!n || isNaN(sh) || isNaN(pr)) { document.getElementById('inName').placeholder = '⚠️ 請填股名、股數、股價'; return; }
  var c = document.getElementById('inCode').value.trim().toUpperCase() || '自選';
  var cost = parseFloat(document.getElementById('inCost').value), prev = parseFloat(document.getElementById('inPrev').value);
  stocks.unshift({ name: n, code: c, cat: document.getElementById('inCat').value, shares: sh, price: pr, cost: isNaN(cost) ? sh * pr : cost, prev: isNaN(prev) ? pr : prev });
  ['inName','inCode','inShares','inCost','inPrice','inPrev'].forEach(function(id) { document.getElementById(id).value = ''; });
  suggestBox.style.display = 'none';
  localStorage.setItem('twStocksV10', JSON.stringify(stocks));
  render();
}

function syncAll() {
  var btn = document.getElementById('btnSync');
  btn.innerText = '⏳ 讀取最新報價...';
  loadLocalJson(function(success) {
    var ok = 0;
    stocks.forEach(function(it) {
      if (liveData[it.code]) { it.price = liveData[it.code].p; it.prev = liveData[it.code].y; ok++; }
    });
    localStorage.setItem('twStocksV10', JSON.stringify(stocks));
    render();
    btn.innerText = ok > 0 ? '✅ 已更新 ' + ok + ' 檔' : '⚠️ 尚未產生 prices.json';
    setTimeout(function() { btn.innerText = '🔄 連網更新股價'; }, 2500);
  });
}

render();
