from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 375, "height": 812}) # test mobile
    page.goto('file:///Volumes/DATA%20IN%20MAC/anti-gravity/dentx-innovation-center/index.html')
    
    # Wait for the element
    el = page.locator('a[href="tel:0806369818"]').first
    
    # Check what is at its center point
    box = el.bounding_box()
    if box:
        x = box['x'] + box['width'] / 2
        y = box['y'] + box['height'] / 2
        
        hit = page.evaluate(f'''() => {{
            let elem = document.elementFromPoint({x}, {y});
            return elem ? elem.tagName + (elem.id ? "#"+elem.id : "") + (elem.className ? "."+elem.className.split(" ").join(".") : "") : "None";
        }}''')
        print("Element at click point:", hit)
    else:
        print("Element not visible")
        
    browser.close()
