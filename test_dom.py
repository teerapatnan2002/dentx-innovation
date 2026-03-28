from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('file:///Volumes/DATA%20IN%20MAC/anti-gravity/dentx-innovation-center/index.html')
    
    chain = page.evaluate('''() => {
        let el = document.getElementById('modal-dashboard');
        if (!el) return ["NOT FOUND"];
        let path = [];
        while (el && el.tagName !== 'BODY') {
            path.push(el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''));
            el = el.parentElement;
        }
        return path;
    }''')
    
    for i, path in enumerate(reversed(chain)):
        print('  ' * i + path)
    
    browser.close()
