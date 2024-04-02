const fs = require('fs');
const puppeteer = require('puppeteer');

async function updateTemplateScreenshots() {
  try {
    const templatesData = fs.readFileSync('templates.json', 'utf8');
    const templates = JSON.parse(templatesData);

    console.log(`Found ${templates.length} templates. Starting screenshot update...`);

    for (const [index, template] of templates.entries()) {
      try {
        console.log(`Capturing screenshot for template ${index + 1}/${templates.length}: ${template.title}`);

        const screenshotPath = `screenshots/${template.id}.jpg`;
        await captureScreenshot(template.livePreviewUrl, screenshotPath);

        console.log(`Screenshot updated for template: ${template.title}`);
      } catch (error) {
        console.error(`Error capturing screenshot for template: ${template.title}`, error);
      }
    }

    console.log('Screenshot update completed.');
  } catch (error) {
    console.error('Error updating template screenshots:', error);
  }
}

async function captureScreenshot(url, screenshotPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80 });
  await browser.close();
}

updateTemplateScreenshots();