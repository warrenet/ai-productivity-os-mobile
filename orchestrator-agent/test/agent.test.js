const assert = require('assert');
function run(workflow, input) {
  if (!Array.isArray(workflow)) throw new Error('Invalid workflow');
  return workflow.reduce((out, step) => `Processed by ${step}: ${out}`, input);
}
assert.strictEqual(run(['a','b'], 'start'), 'Processed by b: Processed by a: start');
console.log('orchestrator tests passed');
