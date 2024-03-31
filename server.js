const express = require('express');
const fs = require('fs');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

app.use(express.static('public'));

app.get('/api/templates', (req, res) => {
  const templates = JSON.parse(fs.readFileSync('templates.json', 'utf8'));
  res.json(templates);
});

app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    const isScreenshot = req.query.screenshot === 'true';
    const cacheKey = `${url}_${isScreenshot}`;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      res.type(isScreenshot ? 'image/jpeg' : 'text/html');
      res.send(cachedResponse);
    } else {
      const response = await axios.get(url);
      
      if (isScreenshot) {
        const screenshot = await captureScreenshot(url);
        cache.set(cacheKey, screenshot);
        res.type('image/jpeg');
        res.send(screenshot);
      } else {
        // Modify the HTML content to handle relative URLs
        const modifiedHtml = response.data.replace(/(href|src)="(?!https?:\/\/)(.*?)"/g, (match, attribute, relativeUrl) => {
          const absoluteUrl = new URL(relativeUrl, url).href;
          return `${attribute}="/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
        });
        cache.set(cacheKey, modifiedHtml);
        res.type('text/html');
        res.send(modifiedHtml);
      }
    }
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Error fetching URL');
  }
});

const puppeteer = require('puppeteer');

async function captureScreenshot(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
  await browser.close();
  return screenshot;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});