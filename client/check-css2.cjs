const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'assets');
const cssFile = fs.readdirSync(distDir).find(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(distDir, cssFile), 'utf8');

// Find ALL rules that set padding or margin on *
console.log('=== ALL UNIVERSAL SELECTOR RULES ===\n');
const universalRules = [];
let idx = 0;
while (true) {
  const pos = css.indexOf('*{', idx);
  if (pos === -1) break;
  const end = css.indexOf('}', pos);
  const rule = css.substring(pos, end + 1);
  universalRules.push({ pos, rule });
  idx = pos + 1;
}
// Also check * { with space
idx = 0;
while (true) {
  const pos = css.indexOf('* {', idx);
  if (pos === -1) break;
  const end = css.indexOf('}', pos);
  const rule = css.substring(pos, end + 1);
  universalRules.push({ pos, rule });
  idx = pos + 1;
}
universalRules.forEach(r => console.log(`  Position ${r.pos}: ${r.rule.substring(0, 200)}`));

// Check what @layer the global reset is in
console.log('\n=== LAYER ORDER ===\n');
const layerOrder = [];
let layerIdx = 0;
while (true) {
  const pos = css.indexOf('@layer ', layerIdx);
  if (pos === -1) break;
  const nameEnd = css.indexOf('{', pos);
  const layerName = css.substring(pos, nameEnd).trim();
  layerOrder.push({ pos, name: layerName });
  layerIdx = pos + 1;
}
layerOrder.forEach(l => console.log(`  Position ${l.pos}: ${l.name}`));

// Find where the padding:0 reset is within which layer
console.log('\n=== RESET LOCATION WITHIN LAYERS ===\n');
const resetPos = css.indexOf('padding:0');
if (resetPos !== -1) {
  // Find which layer it's in
  let containingLayer = 'none (top-level)';
  for (const l of layerOrder) {
    if (l.pos < resetPos) containingLayer = l.name;
  }
  console.log(`  padding:0 is at position ${resetPos}, within: ${containingLayer}`);
}

// Check the !p-4 and !p-5 rules and their position
console.log('\n=== IMPORTANT UTILITY POSITIONS ===\n');
const bangP4 = css.indexOf('\\!p-4');
const bangP5 = css.indexOf('\\!p-5');
const bangGap5 = css.indexOf('\\!gap-5');
console.log(`  \\!p-4 at position: ${bangP4}`);
console.log(`  \\!p-5 at position: ${bangP5}`);
console.log(`  \\!gap-5 at position: ${bangGap5}`);

// Extract the actual rule content for !p-4 and !p-5
if (bangP4 !== -1) {
  const ruleEnd = css.indexOf('}', bangP4);
  console.log(`  \\!p-4 rule: ${css.substring(bangP4, ruleEnd + 1)}`);
}
if (bangP5 !== -1) {
  const ruleEnd = css.indexOf('}', bangP5);
  console.log(`  \\!p-5 rule: ${css.substring(bangP5, ruleEnd + 1)}`);
}
if (bangGap5 !== -1) {
  const ruleEnd = css.indexOf('}', bangGap5);
  console.log(`  \\!gap-5 rule: ${css.substring(bangGap5, ruleEnd + 1)}`);
}

// Check if there's a @tailwindcss/typography plugin
console.log('\n=== TYPOGRAPHY PLUGIN CHECK ===\n');
try {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  console.log('  @tailwindcss/typography:', allDeps['@tailwindcss/typography'] || 'NOT INSTALLED');
} catch (e) {
  console.log('  Could not read package.json');
}

// Check if App.css .prose p rule is in compiled output
console.log('\n=== APP.CSS PROSE P RULES ===\n');
const proseP = css.indexOf('.prose p');
if (proseP !== -1) {
  const ruleEnd = css.indexOf('}', proseP);
  console.log(`  Found at ${proseP}: ${css.substring(proseP, ruleEnd + 1)}`);
} else {
  console.log('  .prose p NOT FOUND in compiled CSS');
}

// Specifically check margin-bottom in compiled output
console.log('\n=== ALL margin-bottom RULES ===\n');
const mbRegex = /[^{]*\{[^}]*margin-bottom[^}]*\}/g;
let mbMatch;
let mbCount = 0;
while ((mbMatch = mbRegex.exec(css)) !== null) {
  mbCount++;
  if (mbCount <= 15) {
    console.log(`  ${mbMatch[0].substring(0, 200)}`);
  }
}
console.log(`  Total margin-bottom rules: ${mbCount}`);
