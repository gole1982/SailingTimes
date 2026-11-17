/* 临时探针：以无头 Chrome 打开 index.html 并求值一段表达式
 * 用法: node tools/probe.js "window.Globe.debug()"  [额外等待毫秒]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.dirname(__dirname);
const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const CHROME = CANDIDATES.find(p => fs.existsSync(p));
const PORT = 9800 + Math.floor(Math.random() * 100);
const PAGE_URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const EXPR = process.argv[2] || 'window.Globe.debug()';
const EXTRA = +(process.argv[3] || 1500);
const SHOT = process.argv[4] || null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, nextId = 1;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

(async () => {
  if (!CHROME) throw new Error('未找到 Chrome/Edge');
  const profile = path.join(os.tmpdir(), 'sailing-probe-' + Date.now());
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
    '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
    '--window-size=1600,900', '--hide-scrollbars',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      target = (await res.json()).find(t => t.type === 'page');
    } catch (e) { /* retry */ }
  }
  if (!target) throw new Error('no page target');

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  // 提前装错误收集器，捕获导航前的顶格脚本错误
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: "(function(){window.__errs=[];window.addEventListener('error',function(e){" +
      "window.__errs.push((e.message||'')+' @'+(e.filename||'').split('/').pop()+':'+e.lineno);});" +
      "window.addEventListener('unhandledrejection',function(e){window.__errs.push('REJECT '+e.reason);});" +
      "window.__t0=performance.now();window.__bootAt=null;var mo=new MutationObserver(function(){" + "var b=document.getElementById('boot');if(b&&b.classList.contains('hide')&&window.__bootAt==null)window.__bootAt=Math.round(performance.now());if(!b&&window.__bootAt==null)window.__bootAt=Math.round(performance.now());});mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});})();"
  });
  await send('Page.navigate', { url: PAGE_URL });
  await sleep(2500 + EXTRA);
  const r = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) console.log('EXCEPTION:', r.exceptionDetails.text, r.exceptionDetails.exception && r.exceptionDetails.exception.description);
  console.log(JSON.stringify(r.result && r.result.value, null, 2));
  if (SHOT) {
    await sleep(1200);
    const cap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(SHOT), Buffer.from(cap.data, 'base64'));
    console.log('screenshot ->', path.resolve(SHOT));
  }
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error('PROBE FAILED:', e.message); process.exit(1); });
