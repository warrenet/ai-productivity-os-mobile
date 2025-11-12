const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
let status = 'ready';
app.get('/status', (req, res) => { res.json({ agent: 'orchestrator', status }); });
app.post('/orchestrate', (req, res) => {
  const { workflow = [], input = '' } = req.body;
  if (!Array.isArray(workflow)) return res.status(400).json({ error: 'Invalid workflow format' });
  let output = input;
  for (const step of workflow) output = `Processed by ${step}: ${output}`;
  res.json({ result: output });
});
app.post('/pause', (req, res) => { status = 'paused'; res.json({ status }); });
app.post('/resume', (req, res) => { status = 'ready'; res.json({ status }); });
app.listen(PORT, () => console.log(`Orchestrator Agent on ${PORT}`));
