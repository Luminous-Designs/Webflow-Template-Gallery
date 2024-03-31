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
    const cachedResponse = cache.get(url);

    if (cachedResponse) {
      res.send(cachedResponse);
    } else {
      const response = await axios.get(url);
      cache.set(url, response.data);
      
      res.header('Access-Control-Allow-Origin', '*');
      res.header('X-Frame-Options', 'ALLOW-FROM http://localhost:3000');
      
      res.send(response.data);
    }
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Error fetching URL');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});