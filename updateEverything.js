const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

// Define the delay function
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function updateTemplates() {
  try {
    console.log('Starting template update process...');

    // Step 1: Scrape Webflow templates page
    console.log('Scraping Webflow templates page...');
    const newTemplates = await scrapeWebflowTemplatesPage();
    console.log(`Found ${newTemplates.length} templates on the Webflow templates page.`);

    // Step 2: Read existing templates from templates.json
    console.log('Reading existing templates from templates.json...');
    const existingTemplates = JSON.parse(fs.readFileSync('templates.json', 'utf8'));
    console.log(`Found ${existingTemplates.length} existing templates in templates.json.`);

    // Step 3: Filter out new templates that are not already in existingTemplates
    console.log('Filtering out new templates...');
    const templatesToAdd = newTemplates.filter(
      (newTemplate) =>
        !existingTemplates.some((existingTemplate) => existingTemplate.link === newTemplate.link)
    );
    console.log(`Found ${templatesToAdd.length} new templates to add.`);

    // Step 4: Scrape additional details for new templates
    console.log('Scraping additional details for new templates...');
    const detailedTemplates = await Promise.all(
      templatesToAdd.map((template) => scrapeTemplateDetails(template))
    );
    console.log('Finished scraping additional details for new templates.');

    // Step 5: Merge new templates with existing templates
    console.log('Merging new templates with existing templates...');
    const mergedTemplates = [...existingTemplates, ...detailedTemplates];
    console.log(`Merged templates. Total templates: ${mergedTemplates.length}`);

    // Step 6: Write the updated templates to templates.json
    console.log('Writing updated templates to templates.json...');
    fs.writeFileSync('templates.json', JSON.stringify(mergedTemplates, null, 2));
    console.log('Templates updated successfully in templates.json.');

    console.log('Template update process completed.');
  } catch (error) {
    console.error('Error updating templates:', error);
  }
}

async function scrapeWebflowTemplatesPage() {
  try {
    const templatesPageUrl = 'https://webflow.com/templates';
    const response = await axios.get(templatesPageUrl);
    const $ = cheerio.load(response.data);

    const templates = [];

    $('div.tm-templates_grid_item').each((index, element) => {
      const $element = $(element);
      const link = $element.find('a.tm-link').attr('href');
      const title = $element.find('a.template-name').text();

      templates.push({ link, title });
    });

    return templates;
  } catch (error) {
    console.error('Error scraping templates page:', error);
    return [];
  }
}

async function scrapeTemplateDetails(template) {
  try {
    const templateUrl = `https://webflow.com${template.link}`;
    const response = await axios.get(templateUrl);
    const $ = cheerio.load(response.data);

    const images = $('.owl-stage img')
      .map((_, el) => $(el).attr('src'))
      .get();

    const livePreviewUrl = $('#hero-browser-preview').attr('href');
    const tags = $('.hero_tag-list_link div')
      .map((_, el) => $(el).text())
      .get();

    const id = uuidv4();
    const screenshotPath = `screenshots/${id}.jpg`;
    await captureScreenshot(livePreviewUrl, screenshotPath);

    return {
      id,
      title: template.title,
      images,
      link: templateUrl,
      livePreviewUrl,
      tags,
      screenshotPath,
    };
  } catch (error) {
    console.error(`Error scraping template details: ${template.link}`, error);
    return null;
  }
}

async function captureScreenshot(url, screenshotPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Use the delay function before taking a screenshot
  console.log(`Waiting for 5 seconds before capturing screenshot for ${url}...`);
  await delay(5000); // Waits for 5 seconds

  await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80 });
  console.log(`Screenshot captured for ${url}.`);

  await browser.close();
}

// Call the updateTemplates function to start the process
updateTemplates();