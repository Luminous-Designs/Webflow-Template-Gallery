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

    // Step 1: Read existing templates from templates.json
    console.log('Reading existing templates from templates.json...');
    const existingTemplates = JSON.parse(fs.readFileSync('templates.json', 'utf8'));
    console.log(`Found ${existingTemplates.length} existing templates in templates.json.`);

    // Step 2: Scrape Webflow sitemap.xml and templates gallery page
    console.log('Scraping Webflow sitemap.xml and templates gallery page...');
    const newTemplateUrls = await scrapeWebflowTemplateUrls();
    console.log(`Found ${newTemplateUrls.length} new template URLs.`);

    // Step 3: Filter out new template URLs that are not already in existingTemplates
    console.log('Filtering out new template URLs...');
    const templateUrlsToAdd = newTemplateUrls.filter(
      (newTemplateUrl) =>
        !existingTemplates.some((existingTemplate) => existingTemplate.link === newTemplateUrl)
    );
    console.log(`Found ${templateUrlsToAdd.length} new template URLs to add.`);

    // Step 4: Scrape additional details for new templates
    console.log('Scraping additional details for new templates...');
    const newTemplates = await Promise.all(
      templateUrlsToAdd.map((templateUrl) => scrapeTemplateDetails(templateUrl))
    );
    const validNewTemplates = newTemplates.filter((template) => template !== null);
    console.log(`Scraped additional details for ${validNewTemplates.length} new templates.`);

    // Step 5: Merge new templates with existing templates
    console.log('Merging new templates with existing templates...');
    const mergedTemplates = [...existingTemplates, ...validNewTemplates];
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

async function scrapeWebflowTemplateUrls() {
  try {
    const sitemapUrl = 'https://webflow.com/sitemap.xml';
    const templatesPageUrl = 'https://webflow.com/templates';

    const sitemapResponse = await axios.get(sitemapUrl);
    const $ = cheerio.load(sitemapResponse.data, { xmlMode: true });
    const sitemapUrls = $('url > loc')
      .map((_, el) => $(el).text())
      .get()
      .filter((url) => url.includes('/templates/html/'));

    const templatesPageResponse = await axios.get(templatesPageUrl);
    const $$ = cheerio.load(templatesPageResponse.data);
    const templatesPageUrls = $$('div.tm-templates_grid_item a.tm-link')
      .map((_, el) => $$(el).attr('href'))
      .get()
      .map((path) => `https://webflow.com${path}`);

    const uniqueUrls = [...new Set([...sitemapUrls, ...templatesPageUrls])];

    return uniqueUrls;
  } catch (error) {
    console.error('Error scraping template URLs:', error);
    return [];
  }
}

async function scrapeTemplateDetails(templateUrl) {
  try {
    const response = await axios.get(templateUrl);
    const $ = cheerio.load(response.data);

    const title = $('title').text();
    const images = $('.owl-stage img')
      .map((_, el) => $(el).attr('src'))
      .get();

    const livePreviewUrl = $('#hero-browser-preview').attr('href');
    const tags = $('.hero_tag-list_link div')
      .map((_, el) => $(el).text())
      .get();

    if (!title || !livePreviewUrl) {
      console.log(`Skipping template: ${templateUrl} (Missing required data)`);
      return null;
    }

    const id = uuidv4();
    const screenshotPath = `screenshots/${id}.jpg`;
    await captureScreenshot(livePreviewUrl, screenshotPath);

    return {
      id,
      title,
      images,
      link: templateUrl,
      livePreviewUrl,
      tags,
      screenshotPath,
    };
  } catch (error) {
    console.error(`Error scraping template details: ${templateUrl}`, error);
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