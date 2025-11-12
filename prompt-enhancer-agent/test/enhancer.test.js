const assert = require('assert');
function enhance(prompt) {
  let s = (prompt || '').trim().replace(/\s+/g, ' ');
  s = s.replace(/\bASAP\b/gi, 'as soon as possible');
  return `Enhanced Prompt: ${s}`;
}
assert.strictEqual(enhance('  ship ASAP  '), 'Enhanced Prompt: ship as soon as possible');
assert.strictEqual(enhance(''), 'Enhanced Prompt: ');
console.log('enhancer tests passed');
