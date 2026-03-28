const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    // Catch fetch/XHR errors
    page.on('requestfailed', request => {
        console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    const filePath = `file://${path.resolve(__dirname, 'index.html')}`;
    console.log("Navigating to: " + filePath);
    await page.goto(filePath);

    console.log("Waiting for auth.js to load...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("Opening login modal via JS...");
    await page.evaluate(() => window.openAccessModal('login'));

    console.log("Waiting for modal to be visible...");
    await page.waitForSelector('#username', { visible: true });

    // We assume test3@test.com was created previously but not verified
    await page.type('#username', 'test3@test.com');
    await page.type('#password', 'password123');

    console.log("Clicking submit...");
    const submitBtn = await page.$('#tab-login button[type="submit"]');
    if (submitBtn) {
        await submitBtn.click();
    } else {
        console.log("Submit button not found!");
    }

    console.log("Waiting for Swal popup to appear...");
    await page.waitForSelector('.swal2-confirm', { visible: true, timeout: 5000 });

    console.log("Clicking 'Resend Email' on Swal popup...");
    await page.click('.swal2-confirm');

    console.log("Waiting to observe spinner behavior...");
    await new Promise(r => setTimeout(r, 4000));

    await browser.close();
    console.log("Done.");
})();
