var db = "3714:富采:面板光電|3481:群創:面板光電|2409:友達:面板光電|6116:彩晶:面板光電|8069:元太:面板光電|2330:台積電:半導體|2454:聯發科:半導體|2303:聯電:半導體|3711:日月光投控:半導體|2449:京元電子:半導體|3034:聯詠:半導體|2379:瑞昱:半導體|2344:華邦電:半導體|2408:南亞科:半導體|2317:鴻海:AI電子|2382:廣達:AI電子|3231:緯創:AI電子|6669:緯穎:AI電子|2308:台達電:AI電子|2357:華碩:AI電子|2376:技嘉:AI電子|3017:奇鋐:AI電子|3324:雙鴻:AI電子|2881:富邦金:金融股|2882:國泰金:金融股|2891:中信金:金融股|2886:兆豐金:金融股|2884:玉山金:金融股|2885:元大金:金融股|2603:長榮:航運傳產|2609:陽明:航運傳產|2615:萬海:航運傳產|2618:長榮航:航運傳產|1519:華城:航運傳產|2002:中鋼:航運傳產|0050:元大台灣50:ETF|0056:元大高股息:ETF|00878:國泰永續高股息:ETF|00919:群益台灣精選高息:ETF|00929:復華台灣科技優息:ETF|00940:元大台灣價值高息:ETF|006208:富邦台50:ETF|00713:元大台灣高息低波:ETF|00679B:元大美債20年:ETF|00687B:國泰20年美債:ETF|00937B:群益ESG投等債20+:ETF|009816:凱基台灣TOP50:ETF";

var dict = {};
db.split("|").forEach(function(r) {
  var p = r.split(":");
  var c = p.shift(), n = p.shift(), cat = p.shift();
  dict[c] = { name: n, cat: cat };
});

var colors = { '半導體':'#3B82F6','AI電子':'#8B5CF6','面板光電':'#06B6D4','ETF':'#F59E0B','金融股':'#EC4899','航運傳產':'#10B981','其他':'#6B7280' };
var stocks = JSON.parse(localStorage.getItem('twStocksV10')) || [
  { name: '富采', code: '3714', cat: '面板光電', shares: 1000, price: 42.5, prev: 41.0, cost: 40000 },
  { name: '群創', code: '3481', cat: '面板光電', shares: 1000, price: 15.8, prev: 15.5, cost: 15000 }
];
var curTab = '全部';

function forceReload() { window.location.replace(window.location.pathname + '?t=' + Date.now()); }
function fmt(n, s) { var r = Math.round(n), str = Math.abs(r).toLocaleString(); return s ? (r > 0 ? '+' : r < 0 ? '-' : '') + str : (r < 0 ? '-' : '') + str; }

// 全天候 24 小時穩定抓價引擎 (抓取最近交易日正式收盤價與昨收價)
function fetchOneStockData(code, cb) {
  var d = new Date();
  d.setDate(d.getDate() - 14);
  var startStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  var url = 'https://finmindtrade.com' + code + '&start_date=' + startStr;

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (j && j.data && j.data.length > 0) {
        var last = j.data.pop();
        var prev = j.data.length > 0 ? j.data.pop().close : last.open;
        if (last && typeof last.close === 'number') {
          cb({ price: last.close, prev: typeof prev === 'number' ? prev : last.close });
          return;
        }
      }
      cb(null);
    })
    .catch(function() { cb(null); });
}

// 若輸入冷門股代號，自動向公開資料庫查詢中文名稱
function fetchUnknownName(code) {
  fetch('https://finmindtrade.com' + code)
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (j && j.data && j.data.length > 0) {
        var info = j.data.shift();
        if (info && info.stock_name && !document.getElementById('inName').value) {
          document.getElementById('inName').value = info.stock_name;
          dict[code] = { name: info.stock_name, cat: code.indexOf('00') === 0 ? 'ETF' : '其他' };
        }
      }
    })
    .catch(function() {});
}

var tmr = null;
function autoPrice(c) {
  if (!c || c.length < 4) return;
  clearTimeout(tmr);
  tmr = setTimeout(function() {
    document.getElementById('inPrice').placeholder = '⏳ 抓收盤價...';
    if (!dict[c]) fetchUnknownName(c);
    fetchOneStockData(c, function(res) {
      document.getElementById('inPrice').placeholder = '目前股價 (自動抓)';
      if (res) {
        document.getElementById('inPrice').value = res.price;
        document.getElementById('inPrev').value = res.prev;
      }
    });
  }, 350);
}

function syncCode(v) {
  var c = v.trim().toUpperCase(), elN = document.getElementById('inName'), elC = document.getElementById('inCat');
  if (!c) { elN.value = ''; return; }
  if (dict[c]) { elN.value = dict[c].name; elC.value = dict[c].cat; autoPrice(c); }
  else { if (c.indexOf('00') === 0) elC.value = 'ETF'; if (c.length >= 4) autoPrice(c); }
}

function syncName(v) {
  var q = v.trim().toUpperCase(), elK = document.getElementById('inCode'), elC = document.getElementById('inCat');
  if (!q) { elK.value = ''; return; }
  if (q.length < 2) return;
  for (var k in dict) {
    if (dict[k].name.toUpperCase().indexOf(q) !== -1) { elK.value = k; elC.value = dict[k].cat; autoPrice(k); break; }
  }
}

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
  localStorage.setItem('twStocksV10', JSON.stringify(stocks));
  render();
}

function syncAll() {
  var btn = document.getElementById('btnSync');
  if (!stocks.length) return;
  btn.innerText = '⏳ 抓最新收盤價...';
  var done = 0, ok = 0;

  // 逐檔間隔 250ms 查詢，避免觸發免費 API 頻率限制
  stocks.forEach(function(it, idx) {
    setTimeout(function() {
      fetchOneStockData(it.code, function(res) {
        if (res) {
          stocks[idx].price = res.price;
          stocks[idx].prev = res.prev;
          ok++;
        }
        done++;
        if (done === stocks.length) {
          localStorage.setItem('twStocksV10', JSON.stringify(stocks));
          render();
          btn.innerText = ok > 0 ? '✅ 已更新 ' + ok + ' 檔' : '⚠️ API 忙線請重試';
          setTimeout(function() { btn.innerText = '🔄 連網更新股價'; }, 2500);
        }
      });
    }, idx * 250);
  });
}

render();
