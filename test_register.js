const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    const filePath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(filePath);
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Creating new user...");
    await page.evaluate(async () => {
        const email = `test_spin_${Date.now()}@test.com`;
        const pass = "password123";
        try {
            const fbAuth = window.fbAuth;
            const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
            await fbAuth.signOut();
            console.log(`Created ${email}`);
        } catch(e) {
            console.log("Create err:", e.message);
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
