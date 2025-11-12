const express = require('express');
const body = require('body-parser');
require('dotenv').config();
const app = express();
app.use(body.json());
let paused = false;
app.get('/status', (req, res) => res.json({ status: paused ? 'paused' : 'active' }));
app.post('/slack-event', (req, res) => {
  if (paused) return res.status(200).send('Agent paused');
  const event = req.body.event || {};
  const kw = process.env.TRIGGER_KEYWORD || '#deploy';
  if (event.text && event.text.includes(kw)) console.log('Trigger detected:', event.text);
  res.status(200).send('OK');
});
app.post('/pause', (req, res) => { paused = true; res.json({ status: 'paused' }); });
app.post('/resume', (req, res) => { paused = false; res.json({ status: 'active' }); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Slack Monitor on ${PORT}`));
