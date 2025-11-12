function mockStatus() {
  const statusEl = document.getElementById('status');
  ['Orchestrator', 'Prompt Enhancer', 'Slack Monitor'].forEach(name => {
    const c = document.createElement('div'); c.className = 'card'; c.textContent = `${name}: ✅`;
    statusEl.appendChild(c);
  });
  document.getElementById('log').textContent = '[14:02] Slack trigger received\n[14:03] Prompt optimized\n[14:04] Deployment initiated';
  document.getElementById('feed').innerHTML = '<li>Keyword detected: "launch"</li><li>Enhancement complete</li><li>Workflow deployed</li>';
  document.getElementById('metrics').textContent = 'Clarity: 92% • Success: 98% • Uptime: 99.9%';
}
function pauseAll(){ alert('Paused (demo)'); }
function resumeAll(){ alert('Resumed (demo)'); }
function trigger(){ alert('Workflow triggered (demo)'); }
window.onload = mockStatus;
