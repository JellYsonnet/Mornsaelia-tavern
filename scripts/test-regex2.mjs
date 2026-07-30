// Test if snapshot_case regex fields work in ST
const test = 'This is the AI reply message.\nWith second line.';
const inlineJS = 'console.log("panel loaded")';

// Pattern 1: snake_case replacement with $1
const p1 = '/(.*)/s';
const r1 = '<script>' + inlineJS + '</script>\n$1';
console.log('P1 result:', JSON.stringify(test.replace(eval(p1), r1)));

// Pattern 2: with $&
const p2 = '/.*/s';
const r2 = '<script>' + inlineJS + '</script>\n$&';
console.log('P2 result:', JSON.stringify(test.replace(eval(p2), r2)));

// Pattern 3: No backreference (full replace)
const r3 = '<script>' + inlineJS + '</script>\n<!-- replaced -->';
console.log('P3 result:', JSON.stringify(test.replace(eval(p1), r3)));
