const express = require('express');
const fs = require('fs');
const axios = require('axios');

const app = express();

app.use(express.static('public'));

app.get('/api/templates', (req, res) => {
  const templates = JSON.parse(fs.readFileSync('templates.json', 'utf8'));
  res.json(templates);
});

app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    const response = await axios.get(url);
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('X-Frame-Options', 'ALLOW-FROM http://localhost:3000');
    
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Error fetching URL');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});