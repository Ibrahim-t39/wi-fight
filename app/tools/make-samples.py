"""Builds the sample documents used in demos: two fictional internet bills and one broadband label.
Everything here is made up. The providers do not exist. Each document says so in its footer.
Run from the app folder:  /opt/homebrew/opt/python@3.13/bin/python3.13 tools/make-samples.py
Writes the PNG files into demo-files/ at the repo root (not part of the website) and manifest.json into public/samples/. The manifest records what each bill says and
where each line sits on the image, so the app can highlight lines and check what the AI read.
"""
import json, pathlib
from playwright.sync_api import sync_playwright

MAN = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'samples'   # manifest only: known values and positions
OUT = pathlib.Path(__file__).resolve().parent.parent.parent / 'demo-files'      # the images, kept out of the website
FONT = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap"

BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0} body{width:850px;background:#fff;color:#1b1f2a;font:400 13px/1.45 Inter,Arial,sans-serif}
.page{padding:46px 54px 40px;min-height:1100px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid var(--brand)}
.logo{display:flex;align-items:center;gap:11px;font:800 24px Inter;letter-spacing:-.02em;color:var(--brand)}
.logo i{width:38px;height:38px;border-radius:10px;background:var(--brand);display:grid;place-items:center;color:#fff;font:800 20px Inter;font-style:normal}
.logo small{display:block;font:500 11px Inter;letter-spacing:.08em;text-transform:uppercase;color:#6b7385;margin-top:1px}
.meta{text-align:right;font-size:12px;color:#4a5163}.meta b{color:#1b1f2a}
.cols{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;margin-top:24px}
.lab{font:700 10.5px Inter;letter-spacing:.09em;text-transform:uppercase;color:#6b7385;margin-bottom:5px}
.due{background:var(--tint);border-radius:12px;padding:16px 18px}
.due .amt{font:800 34px Inter;letter-spacing:-.02em;color:#1b1f2a;line-height:1.1}
.due .row{display:flex;justify-content:space-between;font-size:12.5px;margin-top:6px;color:#4a5163}
h2{font:700 15px Inter;margin:30px 0 8px;padding-bottom:7px;border-bottom:1.5px solid #1b1f2a}
table{width:100%;border-collapse:collapse}td{padding:9px 0;border-bottom:1px solid #e4e6ec;vertical-align:top}
td.a{text-align:right;font:500 13px 'IBM Plex Mono',monospace;white-space:nowrap}
td small{display:block;color:#6b7385;font-size:11.5px;margin-top:1px}
tr.sub td{font-weight:600;border-bottom:1.5px solid #1b1f2a}
tr.tot td{font:800 16px Inter;border-bottom:0;padding-top:12px}tr.tot td.a{font:600 17px 'IBM Plex Mono',monospace}
.note{margin-top:22px;border:1px solid #e4e6ec;border-radius:10px;padding:13px 16px;font-size:12px;color:#4a5163}
.note b{color:#1b1f2a}
.stub{margin-top:auto;border-top:2px dashed #b9becb;padding-top:16px;display:flex;justify-content:space-between;font-size:11.5px;color:#4a5163}
.foot{margin-top:14px;font-size:10.5px;color:#8a90a0;text-align:center}
.bars{font:500 10px 'IBM Plex Mono',monospace;letter-spacing:.32em;color:#1b1f2a}
"""

def bill_html(b):
    rows = ''.join(f'<tr data-k="{r["k"]}"><td>{r["name"]}<small>{r.get("sub","")}</small></td><td class="a">${r["amount"]:.2f}</td></tr>' for r in b['rows'])
    return f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="{FONT}"><style>:root{{--brand:{b['brand']};--tint:{b['tint']}}}{BASE_CSS}</style></head><body><div class="page">
<div class="top"><div class="logo"><i>{b['initial']}</i><div>{b['provider']}<small>{b['tagline']}</small></div></div>
<div class="meta"><div><b>Statement date</b> {b['date']}</div><div><b>Account</b> {b['account']}</div><div><b>Page</b> 1 of 1</div></div></div>
<div class="cols"><div><div class="lab">Service address</div><div><b>{b['name']}</b><br>{b['addr1']}<br>{b['addr2']}</div>
<div class="lab" style="margin-top:16px">Billing period</div><div>{b['period']}</div>
<div class="lab" style="margin-top:16px">Your plan</div><div data-k="plan"><b>{b['plan']}</b><br>Typical download {b['down']} Mbps · typical upload {b['up']} Mbps</div></div>
<div class="due"><div class="lab">Amount due</div><div class="amt" data-k="totalTop">${b['total']:.2f}</div>
<div class="row"><span>Due date</span><b>{b['due']}</b></div><div class="row"><span>Previous balance</span><span>${b['total']:.2f}</span></div><div class="row"><span>Payment received, thank you</span><span>-${b['total']:.2f}</span></div><div class="row"><span>AutoPay</span><span>Off</span></div></div></div>
<h2>Monthly charges</h2><table>{rows}
<tr class="tot" data-k="total"><td>Total due</td><td class="a">${b['total']:.2f}</td></tr></table>
<div class="note" data-k="promo"><b>About your price.</b> {b['promo']}</div>
<div class="note"><b>Questions about your bill?</b> Call {b['phone']} or visit {b['site']}. Speeds are not guaranteed and may vary. See your Broadband Facts label for typical speeds.</div>
<div class="stub"><div><b>{b['provider']}</b> · Payment stub<br>Account {b['account']} · Amount due ${b['total']:.2f} · Due {b['due']}</div><div class="bars">|| ||| | |||| || | ||| || |||| |</div></div>
<div class="foot">Sample document for demonstration. {b['provider']} is a fictional provider, and this account, address, and bill are made up.</div>
</div></body></html>"""

BILLS = [
  dict(id='northstar-bill', file='northstar-bill.png', title='Northstar Fiber bill', blurb='$80 a month, with one fee worth questioning', provider='Northstar Fiber', initial='N', tagline='Home internet', brand='#1f4fd8', tint='#eef2ff',
       date='Sep 28, 2026', account='4410 0027 SAMPLE', name='Jordan Sample', addr1='123 Sample Street, Apt 4B', addr2='Huntsville, AL 35801', period='Sep 1 to Sep 30, 2026', plan='Northstar Fiber 500', down=500, up=20, due='Oct 15, 2026',
       rows=[dict(k='planPrice', name='Fiber 500 internet', sub='Promotional price, months 1 to 12', amount=65.00), dict(k='equipment', name='Wi-Fi gateway rental', sub='Equipment', amount=10.00), dict(k='fee0', name='Network enhancement fee', sub='Company fee. Not a government tax or required charge.', amount=5.00)],
       total=80.00, promo='Your promotional price of $65.00 a month ends in Jan 2027. After that, your internet price becomes $85.00 a month.', phone='1-800-555-0143', site='northstarfiber.example',
       fields=dict(provider='Northstar Fiber', plan='Northstar Fiber 500', planPrice=65, equipment=10, fees=[dict(name='Network enhancement fee', amount=5, junk=True, why='A company fee, not a government tax.')], total=80, promoEnds='Jan 2027'), planId='ns500'),
  dict(id='pinecrest-bill', file='pinecrest-bill.png', title='Pinecrest bill', blurb='$86.99 a month, with two extra fees', provider='Pinecrest', initial='P', tagline='Cable internet', brand='#0f7a5a', tint='#e9f7f1',
       date='Sep 24, 2026', account='7781 5530 SAMPLE', name='Maya Sample', addr1='48 Example Avenue', addr2='Huntsville, AL 35810', period='Aug 25 to Sep 24, 2026', plan='Pinecrest Internet 500', down=500, up=20, due='Oct 12, 2026',
       rows=[dict(k='planPrice', name='Internet 500', sub='Promotional price, months 1 to 12', amount=65.00), dict(k='equipment', name='Modem rental', sub='Equipment', amount=12.00), dict(k='fee0', name='Broadcast and infrastructure fee', sub='Company fee. Not a government tax.', amount=7.49), dict(k='fee1', name='Regulatory recovery fee', sub='Company fee. Not a government tax.', amount=2.50)],
       total=86.99, promo='Your promotional price of $65.00 a month ends in Mar 2027. After that, your internet price becomes $90.00 a month.', phone='1-800-555-0177', site='pinecrest.example',
       fields=dict(provider='Pinecrest', plan='Pinecrest Internet 500', planPrice=65, equipment=12, fees=[dict(name='Broadcast and infrastructure fee', amount=7.49, junk=True, why='A company fee, not a government tax.'), dict(name='Regulatory recovery fee', amount=2.50, junk=True, why='A company fee, not a government tax.')], total=86.99, promoEnds='Mar 2027'), planId='pc500'),
]

LABEL_HTML = f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="{FONT}"><style>
*{{box-sizing:border-box;margin:0;padding:0}}body{{width:560px;background:#fff;padding:26px;font:500 14px/1.4 Inter,Arial,sans-serif;color:#0b0f1a}}
.l{{border:3px solid #0b0f1a;padding:16px 18px}}.t{{font:800 34px Inter;letter-spacing:-.02em;padding-bottom:8px;border-bottom:9px solid #0b0f1a}}
.p{{padding:9px 0;border-bottom:2px solid #0b0f1a}}.p b{{display:block;font:700 18px Inter}}.p span{{color:#4a5163}}
.r{{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #b9becb}}.r b{{font-weight:700}}
.h{{font:800 16px Inter;padding:11px 0 5px;border-bottom:5px solid #0b0f1a}}.big{{border-bottom:5px solid #0b0f1a}}.big b{{font:800 24px Inter}}
.i{{padding-left:16px;color:#4a5163}}.f{{font-size:11.5px;color:#4a5163;padding-top:10px}}.s{{margin-top:12px;font-size:10.5px;color:#8a90a0;text-align:center}}
</style></head><body><div class="l"><div class="t">Broadband Facts</div>
<div class="p"><span>Northstar Fiber</span><b>Northstar Fiber 500</b><span>Fixed broadband consumer disclosure</span></div>
<div class="r big"><span><b style="font:700 16px Inter">Monthly Price</b></span><b>$65.00</b></div>
<div class="r i"><span>This monthly price is an introductory rate for 12 months. After that: $85.00.</span></div>
<div class="r i"><span>This monthly price does not require a contract.</span></div>
<div class="h">Additional Charges &amp; Terms</div>
<div class="r"><span><b>Provider monthly fees</b></span></div><div class="r i"><span>Wi-Fi gateway rental</span><span>$10.00</span></div><div class="r i"><span>Network enhancement fee</span><span>$5.00</span></div>
<div class="r"><span><b>One-time fees at the time of purchase</b></span></div><div class="r i"><span>Installation</span><span>$0.00</span></div>
<div class="r"><span><b>Early termination fee</b></span><span>$0.00</span></div><div class="r"><span><b>Government taxes</b></span><span>Varies by location</span></div>
<div class="h">Speeds Provided with Plan</div>
<div class="r"><span>Typical Download Speed</span><b>500 Mbps</b></div><div class="r"><span>Typical Upload Speed</span><b>20 Mbps</b></div><div class="r"><span>Typical Latency</span><b>30 ms</b></div>
<div class="h">Data Included with Monthly Price</div><div class="r"><span>Data included</span><b>Unlimited</b></div>
<div class="f">Network management and privacy policies: northstarfiber.example/policies. Customer support: 1-800-555-0143.<br>Learn about the terms used on this label at fcc.gov/consumer.</div></div>
<div class="s">Sample document for demonstration. Northstar Fiber is a fictional provider. Layout modeled on the FCC broadband label.</div></body></html>"""

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = dict(note='Fictional sample documents for demos. Providers, accounts, and addresses are made up.', bills=[], label=dict(file='northstar-label.png', title='Northstar Fiber 500 broadband label'))
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True)
        page = b.new_page(viewport={'width': 850, 'height': 1100}, device_scale_factor=2)
        for bill in BILLS:
            page.set_content(bill_html(bill), wait_until='networkidle'); page.wait_for_timeout(500)
            size = page.evaluate("({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})")
            regions = page.evaluate("""() => { const W = document.documentElement.scrollWidth, H = document.documentElement.scrollHeight; const o = {};
              document.querySelectorAll('[data-k]').forEach((el) => { const r = el.getBoundingClientRect(); o[el.dataset.k] = { x: +(r.left / W * 100).toFixed(2), y: +(r.top / H * 100).toFixed(2), w: +(r.width / W * 100).toFixed(2), h: +(r.height / H * 100).toFixed(2) }; }); return o; }""")
            page.screenshot(path=str(OUT / bill['file']), full_page=True)
            manifest['bills'].append(dict(id=bill['id'], file=bill['file'], title=bill['title'], blurb=bill['blurb'], aspect=round(size['w'] / size['h'], 4), planId=bill['planId'], fields=bill['fields'], regions=regions))
            print('wrote', bill['file'], size, list(regions))
        lp = b.new_page(viewport={'width': 560, 'height': 900}, device_scale_factor=2)
        lp.set_content(LABEL_HTML, wait_until='networkidle'); lp.wait_for_timeout(400)
        lp.screenshot(path=str(OUT / 'northstar-label.png'), full_page=True)
        b.close()
    import hashlib
    for b in manifest['bills']: b['sha256'] = hashlib.sha256((OUT / b['file']).read_bytes()).hexdigest()
    MAN.mkdir(parents=True, exist_ok=True)
    (MAN / 'manifest.json').write_text(json.dumps(manifest, indent=1))
    print('wrote manifest.json')

if __name__ == '__main__':
    main()
