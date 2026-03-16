import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        
        await page.type('input[type="email"]', 'pm@ecms.com');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
        
        // Let's give it a second to render
        await new Promise(r => setTimeout(r, 2000));

        const bodyHTML = await page.evaluate(() => document.body.innerText);
        console.log("=== Page Text Content ===");
        console.log(bodyHTML);

        const logs = await page.evaluate(() => window.logs || []);
        console.log("=== Logs ===", logs);

        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
