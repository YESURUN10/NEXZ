const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'assets');
const cssFile = fs.readdirSync(distDir).find(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(distDir, cssFile), 'utf8');

// CRITICAL CHECK: What does the global reset at position 34123 (after utilities) look like?
console.log('=== CRITICAL: WHERE IS THE SECOND GLOBAL RESET? ===\n');
console.log('Utilities layer starts at ~7737');
console.log('Global reset * at position 34123');
console.log('This means: the * { padding: 0 } reset comes AFTER all utility classes!\n');

// Check what's around position 34123
const context = css.substring(34000, 34300);
console.log('Context around position 34123:');
console.log(context);
console.log('\n');

// The global reset in @layer base is at 4203
// But there's ANOTHER one at 34123 that is NOT in any layer!
const baseReset = css.substring(4100, 4350);
console.log('=== BASE LAYER RESET (position ~4200) ===');
console.log(baseReset);
console.log('\n');

// Check if position 34123 is inside a layer or outside
const beforeReset = css.substring(33800, 34200);
console.log('=== BEFORE THE SECOND * RESET (position ~34123) ===');
console.log(beforeReset);
console.log('\n');

// Check if there are layer closings between utilities and the reset
const afterUtilities = css.substring(7700, 7900);
console.log('=== UTILITIES LAYER START ===');
console.log(afterUtilities);
