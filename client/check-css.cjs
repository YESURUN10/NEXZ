const fs = require('fs');
const path = require('path');

// Find the CSS file in dist
const distDir = path.join(__dirname, 'dist', 'assets');
const cssFile = fs.readdirSync(distDir).find(f => f.endsWith('.css'));
if (!cssFile) { console.log('No CSS file found in dist/assets'); process.exit(1); }

const css = fs.readFileSync(path.join(distDir, cssFile), 'utf8');
console.log('CSS file:', cssFile, '(' + css.length + ' bytes)\n');

// Check for specific class patterns used in ChatPanel
const classes = [
  // Important variants (with !)
  '\\!p-5', '\\!p-4', '\\!gap-5', '\\!mb-3', '\\!mb-0',
  // Layout 
  'flex-1', 'flex-col', 'flex', 'items-center', 'justify-between',
  'justify-end', 'justify-start', 'shrink-0', 'flex-shrink-0',
  // Overflow/sizing
  'overflow-y-auto', 'overflow-hidden', 'w-full', 'min-w-0',
  'w-9', 'h-9', 'w-7', 'h-7', 'w-8', 'h-8',
  // Spacing
  'p-4', 'p-5', 'px-5', 'py-4', 'gap-5', 'gap-4', 'gap-3', 'gap-1\\.5',
  'pl-4', 'pr-2', 'py-1\\.5', 'pl-3', 'pr-6', 'py-2\\.5',
  // Typography
  'prose', 'prose-sm', 'prose-invert', 'max-w-none',
  'text-sm', 'font-semibold', 'font-medium', 'leading-relaxed',
  // Visual
  'rounded-2xl', 'rounded-full', 'shadow-md', 'shadow-sm', 'shadow-2xl',
  'bg-transparent', 'backdrop-blur-sm',
  // Border
  'border', 'border-b', 'border-t',
];

console.log('=== CLASS PRESENCE IN COMPILED CSS ===\n');
classes.forEach(cls => {
  // Search for the class selector in CSS
  const searchPattern = '.' + cls.replace(/\\\\/g, '\\');
  const found = css.includes(searchPattern);
  const status = found ? 'FOUND' : 'MISSING';
  if (!found) {
    console.log(`  ❌ ${cls}: ${status}`);
  }
});

console.log('\n=== CHECKING FOR !important VARIANTS ===\n');
// In Tailwind v4, ! prefix classes use !important
const importantClasses = ['p-5', 'p-4', 'gap-5', 'mb-3', 'mb-0'];
importantClasses.forEach(cls => {
  // Check if there's a !important version
  const regex = new RegExp('\\.' + cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/^/, '\\\\!') + '[^a-zA-Z0-9_-]');
  const found = regex.test(css);
  console.log(`  !${cls}: ${found ? 'FOUND' : 'MISSING'}`);
});

// Check for the global reset that kills padding
console.log('\n=== CHECKING GLOBAL RESETS ===\n');
if (css.includes('*{') || css.includes('* {')) {
  // Find all * rules
  const starRules = css.match(/\*\s*\{[^}]+\}/g) || [];
  starRules.forEach(rule => {
    if (rule.includes('padding') || rule.includes('margin')) {
      console.log('  ⚠️  FOUND GLOBAL RESET WITH padding/margin:', rule.substring(0, 200));
    }
  });
}

// Check for .prose rules
console.log('\n=== PROSE RULES ===\n');
const proseRules = css.match(/\.prose[^{]*\{[^}]*\}/g) || [];
console.log(`  Found ${proseRules.length} .prose rules`);
proseRules.slice(0, 10).forEach(rule => {
  console.log('  ', rule.substring(0, 150));
});

// Check the order of the global reset vs utility classes
console.log('\n=== CSS ORDER CHECK ===\n');
const globalResetPos = css.indexOf('*{margin:0;padding:0') !== -1 ? css.indexOf('*{margin:0;padding:0') : css.indexOf('* { margin: 0; padding: 0');
const firstPaddingUtility = css.indexOf('.p-4');
const firstGapUtility = css.indexOf('.gap-');
console.log('  Global reset position:', globalResetPos);
console.log('  First .p-4 position:', firstPaddingUtility);
console.log('  First .gap- position:', firstGapUtility);

if (globalResetPos > firstPaddingUtility && firstPaddingUtility !== -1) {
  console.log('  ⚠️  CRITICAL: Global reset AFTER padding utilities - it overrides them!');
}
if (globalResetPos > firstGapUtility && firstGapUtility !== -1) {
  console.log('  ⚠️  CRITICAL: Global reset AFTER gap utilities - it overrides them!');
}

// Check App.css .prose rules
console.log('\n=== APP.CSS PROSE OVERRIDES ===\n');
if (css.includes('.prose p{margin-bottom') || css.includes('.prose p {margin-bottom')) {
  console.log('  ⚠️  FOUND: App.css .prose p margin-bottom override is in compiled CSS');
}

// Extract what .p-4 actually resolves to
console.log('\n=== ACTUAL UTILITY VALUES ===\n');
const p4match = css.match(/\.p-4\s*\{([^}]+)\}/);
if (p4match) console.log('  .p-4:', p4match[1].trim());
else console.log('  .p-4: NOT FOUND AS STANDALONE RULE');

const p5match = css.match(/\.p-5\s*\{([^}]+)\}/);
if (p5match) console.log('  .p-5:', p5match[1].trim());
else console.log('  .p-5: NOT FOUND AS STANDALONE RULE');

const gap5match = css.match(/\.gap-5\s*\{([^}]+)\}/);
if (gap5match) console.log('  .gap-5:', gap5match[1].trim());
else console.log('  .gap-5: NOT FOUND AS STANDALONE RULE');

const gap4match = css.match(/\.gap-4\s*\{([^}]+)\}/);
if (gap4match) console.log('  .gap-4:', gap4match[1].trim());
else console.log('  .gap-4: NOT FOUND AS STANDALONE RULE');

// Check for Tailwind v4 layer structure
console.log('\n=== TAILWIND LAYER STRUCTURE ===\n');
console.log('  Has @layer base:', css.includes('@layer base'));
console.log('  Has @layer utilities:', css.includes('@layer utilities'));
console.log('  Has @layer theme:', css.includes('@layer theme'));
console.log('  Has @layer components:', css.includes('@layer components'));
