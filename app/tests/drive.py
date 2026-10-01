"""Small browser driver for checking Wi-Fight pages. Uses Playwright with the installed Chrome.
Usage examples (run with /opt/homebrew/opt/python@3.13/bin/python3.13):
  drive.py shot dashboard.html out.png --sample 9 [--mobile] [--full]
  drive.py text dashboard.html --sample 9          # prints visible text and any console errors
"""
import sys, json
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:4810/'

def open_page(p, mobile=False):
    b = p.chromium.launch(channel='chrome', headless=True)
    ctx = b.new_context(viewport={'width': 393, 'height': 852} if mobile else {'width': 1440, 'height': 900}, device_scale_factor=2 if mobile else 1)
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    return b, page, errors

def seed(page, sample):
    """Load the labelled sample data through the app's own store, so encryption and state are real."""
    page.goto(BASE + '_seed.html')
    page.evaluate("""async (n) => { const { Store } = await import('/js/store.js'); await Store.load(); if (n === 'none') { await Store.wipe(); return; } if (n === 'fresh') { await Store.wipe(); await Store.load(); await Store.update((s) => { s.consent = { mlab: true, ai: true, at: new Date().toISOString() }; s.user = { name: 'Jordan', email: 'jordan@example.com', method: 'code' }; s.plan = { id: 'ns500', provider: 'Northstar Fiber', name: 'Northstar Fiber 500', down: 500, up: 20, latency: 30, price: 80, source: 'picked' }; }); return; } await Store.loadSample(Number(n)); }""", sample)

if __name__ == '__main__':
    mode, path = sys.argv[1], sys.argv[2]
    args = sys.argv[3:]
    sample = args[args.index('--sample') + 1] if '--sample' in args else None
    with sync_playwright() as p:
        b, page, errors = open_page(p, '--mobile' in args)
        if sample: seed(page, sample)
        page.goto(BASE + path); page.wait_for_timeout(1500)
        if mode == 'shot':
            page.screenshot(path=args[0], full_page='--full' in args)
            print('saved', args[0])
        else:
            print(page.inner_text('body')[:6000])
        print('URL:', page.url)
        print('CONSOLE ERRORS:', json.dumps(errors[:10]))
        b.close()
