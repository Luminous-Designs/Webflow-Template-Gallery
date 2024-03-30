const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function addLivePreviewUrls() {
  try {
    // Read the existing templates JSON file
    const templatesJson = fs.readFileSync('templates.json', 'utf8');
    const templates = JSON.parse(templatesJson);

    console.log(`Found ${templates.length} templates. Starting to add live preview URLs...`);

    // Iterate over each template
    for (const [index, template] of templates.entries()) {
      try {
        console.log(`Processing template ${index + 1}/${templates.length}: ${template.link}`);

        // Make a request to the template's URL
        const response = await axios.get(template.link);
        const $ = cheerio.load(response.data);

        // Find the live preview URL from the button's href attribute
        const livePreviewUrl = $('#hero-browser-preview').attr('href');

        if (livePreviewUrl) {
          // Add the live preview URL to the template object
          template.livePreviewUrl = livePreviewUrl;
          console.log(`Added live preview URL: ${livePreviewUrl}`);
        } else {
          console.log('Live preview URL not found.');
        }
      } catch (error) {
        console.error(`Error processing template: ${template.link}`, error);
      }
    }

    // Write the updated templates array back to the JSON file
    fs.writeFileSync('templates.json', JSON.stringify(templates, null, 2));
    console.log(`Processing completed. Updated ${templates.length} templates in templates.json`);
  } catch (error) {
    console.error('Error processing templates:', error);
  }
}

addLivePreviewUrls();