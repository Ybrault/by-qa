// Génère assets/img/og.png (1200x630). À lancer une fois : node scripts/make-og.js
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'img', 'og.png');
const html = `<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box">
<div style="font:700 34px ui-monospace,Menlo,monospace;color:#3fb950;margin-bottom:28px">BY-QA<span>_</span></div>
<div style="font-size:92px;font-weight:700;letter-spacing:-2px;line-height:1.05">Craftsman of Quality.</div>
<div style="font-size:36px;color:#8b949e;margin-top:28px">Senior QA Engineer &amp; Test Automation Expert</div>
<div style="font:28px ui-monospace,Menlo,monospace;color:#3fb950;margin-top:56px">$ npx playwright test --project=by-qa</div>
<div style="font:28px ui-monospace,Menlo,monospace;color:#3fb950;margin-top:12px">✓ all tests passed</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: out });
await browser.close();
console.log('écrit', out);
