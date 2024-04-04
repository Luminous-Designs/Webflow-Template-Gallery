const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

async function updateTemplates() {
  try {
    // Step 1: Scrape Webflow templates page
    const newTemplates = await scrapeWebflowTemplatesPage();

    // Step 2: Read existing templates from templates.json
    const existingTemplates = JSON.parse(fs.readFileSync('templates.json', 'utf8'));

    // Step 3: Filter out new templates that are not already in existingTemplates
    const templatesToAdd = newTemplates.filter(
      (newTemplate) =>
        !existingTemplates.some((existingTemplate) => existingTemplate.link === newTemplate.link)
    );

    // Step 4: Scrape additional details for new templates
    const detailedTemplates = await Promise.all(
      templatesToAdd.map((template) => scrapeTemplateDetails(template))
    );

    // Step 5: Merge new templates with existing templates
    const mergedTemplates = [...existingTemplates, ...detailedTemplates];

    // Step 6: Write the updated templates to templates.json
    fs.writeFileSync('templates.json', JSON.stringify(mergedTemplates, null, 2));

    console.log('Templates updated successfully.');
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
  await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80 });
  await browser.close();
}

// Call the updateTemplates function to start the process
updateTemplates();