from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('file:///Volumes/DATA%20IN%20MAC/anti-gravity/dentx-innovation-center/index.html')
    
    # Capture console errors
    page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))
    
    # Try to open the form and submit
    # We will just evaluate a script to trigger handleFormSubmit directly
    try:
        page.evaluate('''async () => {
            const form = document.createElement('form');
            form.innerHTML = `
                <input name="company" value="Test Company">
                <input name="contact" value="Test Contact">
                <input name="phone" value="0812345678">
                <select name="booth_size"><option value="S">Small</option></select>
                <div class="progress-bar"></div>
                <button class="submit-btn" type="submit"></button>
            `;
            document.body.appendChild(form);
            
            // Mock fbDb and fbAuth
            window.fbAuth = { currentUser: { uid: 'test_uid', email: 'test@example.com' } };
            window.fbDb = {
                collection: (name) => ({
                    doc: (id) => ({
                        get: async () => ({ data: () => ({ displayName: "Test User" }) })
                    }),
                    add: async (data) => {
                        console.log("Mock Firestore trying to add:", data);
                        // Simulate failure to trace variables
                        throw new Error("Simulated Firestore Failure");
                    }
                })
            };
            
            const event = { target: form, preventDefault: () => {} };
            await window.handleFormSubmit(event, 'vendor');
        }''')
    except Exception as e:
        print("Script execution error:", e)
        
    time.sleep(2)
    browser.close()
