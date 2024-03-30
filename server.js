const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.static('public'));

app.get('/api/templates', (req, res) => {
  const templates = JSON.parse(fs.readFileSync('templates.json', 'utf8'));
  res.json(templates);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});