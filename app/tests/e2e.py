"""End-to-end check of the Wi-Fight prototype. Practice tests only: never runs a real M-Lab test.
Run: /opt/homebrew/opt/python@3.13/bin/python3.13 tests/e2e.py <output folder for screenshots>
"""
import sys, re, json, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
from drive import BASE, seed
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
PAGES = ['index', 'onboarding-consent', 'onboarding-signin', 'onboarding-plan', 'dashboard', 'test', 'history', 'diagnosis', 'verdict', 'plans', 'chat', 'report', 'privacy', 'about']
results, errors = [], []
def ok(name, cond, extra=''):
    results.append((name, bool(cond), extra)); print(('PASS ' if cond else 'FAIL ') + name + (' :: ' + str(extra) if extra and not cond else ''))

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    # block everything except localhost and fonts, so no real speed test or outside call can happen
    def guard(route):
        u = route.request.url
        if u.startswith(BASE) or 'fonts.googleapis.com' in u or 'fonts.gstatic.com' in u: route.continue_()
        else: route.abort()
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    ctx.route('**/*', guard)
    page = ctx.new_page()
    page.on('console', lambda m: errors.append((page.url, m.text)) if m.type == 'error' and 'ERR_FAILED' not in m.text and 'net::' not in m.text else None)
    page.on('pageerror', lambda e: errors.append((page.url, str(e))))
    state = lambda: page.evaluate("async () => { const { Store } = await import('/js/store.js'); await Store.load(); return Store.get(); }")

    # 1. brand new visitor
    seed(page, 'none')
    page.goto(BASE + 'dashboard.html'); page.wait_for_timeout(700)
    ok('app page redirects a new visitor to consent', 'onboarding-consent' in page.url, page.url)
    page.goto(BASE); page.wait_for_timeout(600)
    page.get_by_text('Start your two-week check').first.click(); page.wait_for_url('**/onboarding-consent.html')
    cont = page.get_by_role('button', name=re.compile('I agree, continue'))
    ok('consent: continue is disabled before agreeing', cont.is_disabled())
    page.locator('input[type=checkbox]').first.check(force=True); page.wait_for_timeout(150)
    ok('consent: continue enabled after agreeing to M-Lab', cont.is_enabled())
    page.locator('input[type=checkbox]').nth(1).check(force=True)
    cont.click(); page.wait_for_url('**/onboarding-signin.html')
    page.locator('input[type=email]').fill('maya@example.com')
    page.get_by_role('button', name=re.compile('Email me a code')).click(); page.wait_for_timeout(400)
    code = re.search(r'code is\s*(\d{6})', page.inner_text('body'))
    ok('sign-in: demo code is shown and labelled as a demo', bool(code) and 'no email is sent' in page.inner_text('body').lower())
    boxes = page.locator('.otp input')
    for i, ch in enumerate(code.group(1)): boxes.nth(i).fill(ch)
    page.get_by_role('button', name=re.compile('Verify and continue')).click(); page.wait_for_url('**/onboarding-plan.html')
    page.get_by_text('Northstar Fiber 500', exact=True).first.click(); page.wait_for_timeout(200)
    page.get_by_role('button', name=re.compile('Start my two-week check')).click(); page.wait_for_url('**/dashboard.html'); page.wait_for_timeout(700)
    st = state()
    ok('onboarding stored consent, user, and plan', st['consent']['mlab'] and st['user']['email'] == 'maya@example.com' and st['plan']['id'] == 'ns500')
    ok('dashboard shows the empty state', 'No tests yet' in page.inner_text('body'))
    raw = page.evaluate("localStorage.getItem('wf.state.v1')")
    ok('data on disk is encrypted (no email or plan name readable)', 'AES-GCM' in raw and 'maya' not in raw and 'Northstar' not in raw)

    # 2. a practice test
    page.goto(BASE + 'test.html'); page.wait_for_timeout(600)
    page.get_by_role('button', name=re.compile('Practice test')).first.click()
    page.wait_for_function("document.body.innerText.toLowerCase().includes('not a real measurement') && !document.body.innerText.includes('Measuring')", timeout=25000); page.wait_for_timeout(900)
    st = state()
    ok('practice test saved and labelled', len(st['tests']) == 1 and st['tests'][0]['source'] == 'practice' and 'not a real measurement' in page.inner_text('body').lower())
    page.screenshot(path=f'{OUT}/test-done-desktop.png')
    page.goto(BASE + 'dashboard.html'); page.wait_for_timeout(900)
    ok('dashboard now computes from the one test', 'day 1 of 14' in page.inner_text('body').lower() and page.locator('#grid').is_visible())

    # 3. demo data through the app's own Demo sheet
    page.locator('[data-demo]').first.click(); page.get_by_role('button', name=re.compile('day 9 of 14')).click(); page.wait_for_url('**/dashboard.html'); page.wait_for_timeout(900)
    t = page.inner_text('body')
    ok('sample day 9: 78% of plan, 389 Mbps, Below plan, sample chip shown', all(x in t for x in ['78', '389', 'Below plan', 'Sample data']))
    for name in PAGES:
        page.goto(BASE + ('' if name == 'index' else name + '.html')); page.wait_for_timeout(1100)
        page.screenshot(path=f'{OUT}/{name}-desktop.png', full_page=False)
        w = page.evaluate('document.documentElement.scrollWidth')
        ok(f'{name}: loads at desktop', w <= 1441, w)
    page.goto(BASE + 'chat.html'); page.wait_for_timeout(700)
    page.locator('#q').fill('Why is my internet slow at night?'); page.keyboard.press('Enter')
    # a real language model may take a while: wait for the live (streaming) message to finish, up to 2 minutes
    page.wait_for_selector('#live', state='attached', timeout=15000)
    page.wait_for_selector('#live', state='detached', timeout=120000); page.wait_for_timeout(800)
    chat = state()['chats'][0]['messages']
    reply = chat[1]['text'] if len(chat) > 1 else ''
    print('    model reply:', reply[:260].replace('\n', ' '))
    ok('chat: a saved reply that uses the engine numbers', len(reply) > 40 and any(n in reply for n in ['389', '390', '432', '78']) and not chat[1].get('ungrounded'))
    page.screenshot(path=f'{OUT}/chat-answer-desktop.png')

    # 3b. switching Proof AI off is honoured everywhere
    page.evaluate("async () => { const { Store } = await import('/js/store.js'); await Store.load(); await Store.update((s) => { s.settings.aiAnalyze = false; }); }")
    page.goto(BASE + 'dashboard.html'); page.wait_for_timeout(900)
    ok('AI off: dashboard hides the Proof AI insight', page.evaluate("getComputedStyle(document.querySelector('.ai-card .ai-text')).visibility") == 'hidden')
    page.screenshot(path=f'{OUT}/dashboard-ai-off-desktop.png')
    page.evaluate("async () => { const { Store } = await import('/js/store.js'); await Store.load(); await Store.update((s) => { s.settings.aiAnalyze = true; }); }")

    # 4. finished check
    seed(page, '14')
    for name in ['verdict', 'report', 'dashboard']:
        page.goto(BASE + name + '.html'); page.wait_for_timeout(1300)
        page.screenshot(path=f'{OUT}/{name}-14-desktop.png')
    page.goto(BASE + 'verdict.html'); page.wait_for_timeout(1000); t = page.inner_text('body')
    ok('verdict: 78%, 9 of 14 days', '78' in t and '9' in t and 'of 14' in t)
    page.goto(BASE + 'report.html'); page.wait_for_timeout(1200)
    send = page.get_by_role('button', name=re.compile('Approve and send'))
    ok('report: send is locked before approval', send.first.is_disabled())
    ok('report: nothing recorded as sent', state()['sent'] == [])

    # 5. phone
    m = b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2); m.route('**/*', guard)
    mp = m.new_page(); mp.on('pageerror', lambda e: errors.append((mp.url, str(e))))
    seed(mp, '9')
    for name in PAGES:
        mp.goto(BASE + ('' if name == 'index' else name + '.html')); mp.wait_for_timeout(1000)
        mp.screenshot(path=f'{OUT}/{name}-mobile.png')
        w = mp.evaluate('document.documentElement.scrollWidth')
        ok(f'{name}: no sideways scroll on a phone', w <= 394, w)
    mp.goto(BASE + 'dashboard.html'); mp.wait_for_timeout(800)
    mp.locator('.tabbar .tab').last.click(); mp.wait_for_timeout(300)
    ok('phone: More sheet lists the other pages', all(x in mp.inner_text('.sheet') for x in ['Report', 'Diagnosis', 'Plans', 'Privacy', 'About']))

    # 6. delete everything
    page.goto(BASE + 'privacy.html'); page.wait_for_timeout(800)
    page.get_by_role('button', name=re.compile('Delete everything')).first.click(); page.wait_for_timeout(300)
    page.locator('.sheet button, [role=dialog] button').filter(has_text=re.compile('Delete', re.I)).last.click(); page.wait_for_timeout(1200)
    ok('delete everything empties storage and returns to the landing page', page.evaluate("localStorage.getItem('wf.state.v1')") is None and page.url.rstrip('/').endswith(('4810', 'index.html')), page.url)
    b.close()

bad = [r for r in results if not r[1]]
print(f'\n{len(results) - len(bad)} of {len(results)} checks passed')
print('CONSOLE ERRORS:', json.dumps(errors[:12], indent=1))
sys.exit(1 if bad or errors else 0)
