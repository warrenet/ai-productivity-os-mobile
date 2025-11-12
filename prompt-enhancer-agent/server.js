const express = require('express');
const body = require('body-parser');
require('dotenv').config();
const app = express();
app.use(body.json());
function enhancePrompt(prompt = '') {
  let s = prompt.trim().replace(/\s+/g, ' ');
  s = s.replace(/\bASAP\b/gi, 'as soon as possible')
       .replace(/\bFYI\b/gi, 'for your information')
       .replace(/\bETA\b/gi, 'estimated time of arrival');
  return `Enhanced Prompt: ${s}`;
}
app.post('/enhance', (req, res) => res.json({ result: enhancePrompt(req.body.prompt) }));
app.get('/status', (req, res) => res.json({ status: 'running', uptime: process.uptime() }));
app.post('/pause', (req, res) => res.json({ status: 'paused' }));
app.post('/resume', (req, res) => res.json({ status: 'running' }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Prompt Enhancer on ${PORT}`));
