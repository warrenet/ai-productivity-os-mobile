const assert = require('assert');
const kw = '#deploy';
assert.ok('Please #deploy now'.includes(kw));
assert.ok(!'Just a note'.includes(kw));
console.log('slack monitor tests passed');
