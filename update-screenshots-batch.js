const fs = require("fs");
const puppeteer = require("puppeteer");

// Define the chunkArray function here
function chunkArray(array, size) {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
}

// Define the delay function here
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Define your captureScreenshot function here
async function captureScreenshot(url, screenshotPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: "networkidle0" });

  // Use the delay function before taking a screenshot
  await delay(5000); // Waits for 5 seconds

  await page.screenshot({ path: screenshotPath, type: "jpeg", quality: 80 });
  await browser.close();
}

// Modify your updateTemplateScreenshots function to process in batches
async function updateTemplateScreenshots() {
  try {
    const templatesData = fs.readFileSync("templates.json", "utf8");
    const templates = JSON.parse(templatesData);
    const batchSize = 10; // Number of screenshots to capture in parallel
    const templateBatches = chunkArray(templates, batchSize);

    console.log(
      `Found ${templates.length} templates. Starting screenshot update in batches of ${batchSize}...`,
    );

    for (const [batchIndex, batch] of templateBatches.entries()) {
      console.log(
        `Processing batch ${batchIndex + 1}/${templateBatches.length}...`,
      );
      await Promise.all(
        batch.map((template) =>
          captureScreenshot(
            template.livePreviewUrl,
            `screenshots/${template.id}.jpg`,
          )
            .then(() =>
              console.log(`Screenshot updated for template: ${template.title}`),
            )
            .catch((error) =>
              console.error(
                `Error capturing screenshot for template: ${template.title}`,
                error,
              ),
            ),
        ),
      );
    }

    console.log("Screenshot update completed.");
  } catch (error) {
    console.error("Error updating template screenshots:", error);
  }
}

// Call the function to start the process
updateTemplateScreenshots();
