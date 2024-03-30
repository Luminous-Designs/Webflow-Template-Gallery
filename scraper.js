const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeWebflowTemplates() {
    try {
      const sitemapUrl = 'https://webflow.com/sitemap.xml';
      const response = await axios.get(sitemapUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });
      const templateUrls = $('url > loc')
        .map((_, el) => $(el).text())
        .get()
        .filter(url => url.includes('/templates/html/'));
  
      const templates = [];
  
      console.log(`Found ${templateUrls.length} templates. Starting scraping...`);
  
      for (const [index, templateUrl] of templateUrls.entries()) {
        try {
          console.log(`Scraping template ${index + 1}/${templateUrls.length}: ${templateUrl}`);
  
          const templateResponse = await axios.get(templateUrl);
          const $template = cheerio.load(templateResponse.data);
          const title = $template('title').text();
          const images = $template('.owl-stage img')
            .map((_, el) => $(el).attr('src'))
            .get();
  
          templates.push({
            title,
            images,
            link: templateUrl
          });
  
          console.log(`Added template: ${title}`);
        } catch (error) {
          console.error(`Error scraping template: ${templateUrl}`, error);
        }
      }
  
      fs.writeFileSync('templates.json', JSON.stringify(templates, null, 2));
      console.log(`Scraping completed. ${templates.length} templates saved to templates.json`);
    } catch (error) {
      console.error('Error scraping templates:', error);
    }
  } 

scrapeWebflowTemplates();