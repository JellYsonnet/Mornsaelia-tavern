// Test regex backreference handling for SillyTavern
const test = 'This is the AI reply message.\nWith multiple lines.';

const inlineScript = 'console.log("panel loaded")';

console.log('=== Test 1: $& ===');
const r1 = '<script>' + inlineScript + '</script>\n$&';
console.log('Replace result:', JSON.stringify(test.replace(/.*/s, r1)));

console.log('\n=== Test 2: $1 with group ===');
const r2 = '<script>' + inlineScript + '</script>\n$1';
console.log('Replace result:', JSON.stringify(test.replace(/([\s\S]*)/s, r2)));

console.log('\n=== Test 3: Complete replacement (no backref) ===');
const r3 = '<script>' + inlineScript + '</script>\n<!-- original message above -->';
console.log('Replace result:', JSON.stringify(test.replace(/.*/s, r3)));
