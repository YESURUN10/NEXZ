const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'assets');
const cssFile = fs.readdirSync(distDir).find(f => f.endsWith('.css'));
const css = fs.readFileSync(path.join(distDir, cssFile), 'utf8');
console.log('CSS file:', cssFile, '(' + css.length + ' bytes)\n');

// CHECK 1: Is there still an unlayered * reset with padding:0?
console.log('=== CHECK 1: UNLAYERED GLOBAL RESETS ===\n');

// Find all * { ... } rules and check if they contain padding:0
const starRuleRegex = /\*\s*\{([^}]+)\}/g;
let match;
let foundUnlayeredReset = false;
while ((match = starRuleRegex.exec(css)) !== null) {
  const ruleContent = match[1];
  const position = match.index;
  
  // Check if this is inside a @layer
  const before = css.substring(0, position);
  const lastLayerOpen = before.lastIndexOf('@layer');
  const lastClosingBrace = before.lastIndexOf('}');
  
  const isInsideLayer = lastLayerOpen > -1 && lastLayerOpen > lastClosingBrace;
  
  if (ruleContent.includes('padding:0') || ruleContent.includes('padding: 0') || ruleContent.includes('margin:0') || ruleContent.includes('margin: 0')) {
    console.log(`  Position ${position}: * { ${ruleContent.trim().substring(0, 100)} }`);
    if (!isInsideLayer) {
      console.log('  ⚠️  THIS IS UNLAYERED — will override utilities!');
      foundUnlayeredReset = true;
    } else {
      console.log('  ✅ Inside a @layer — utilities will override this');
    }
  }
}
if (!foundUnlayeredReset) {
  console.log('  ✅ No unlayered * reset with padding/margin found!');
}

// CHECK 2: Do standard utilities exist and work?
console.log('\n=== CHECK 2: UTILITY CLASS PRESENCE ===\n');
const criticalClasses = [
  { name: 'p-4', regex: /\.p-4\s*\{([^}]+)\}/ },
  { name: 'p-5', regex: /\.p-5\s*\{([^}]+)\}/ },
  { name: 'gap-4', regex: /\.gap-4\s*\{([^}]+)\}/ },
  { name: 'gap-3', regex: /\.gap-3\s*\{([^}]+)\}/ },
  { name: 'px-5', regex: /\.px-5\s*\{([^}]+)\}/ },
  { name: 'py-4', regex: /\.py-4\s*\{([^}]+)\}/ },
  { name: 'py-1\\.5', regex: /\.py-1\\\.5\s*\{([^}]+)\}/ },
  { name: 'pl-4', regex: /\.pl-4\s*\{([^}]+)\}/ },
  { name: 'pr-2', regex: /\.pr-2\s*\{([^}]+)\}/ },
  { name: 'flex-1', regex: /\.flex-1\s*\{([^}]+)\}/ },
  { name: 'flex-col', regex: /\.flex-col\s*\{([^}]+)\}/ },
  { name: 'items-center', regex: /\.items-center\s*\{([^}]+)\}/ },
  { name: 'gap-1\\.5', regex: /\.gap-1\\\.5\s*\{([^}]+)\}/ },
  { name: 'overflow-hidden', regex: /\.overflow-hidden\s*\{([^}]+)\}/ },
  { name: 'min-w-0', regex: /\.min-w-0\s*\{([^}]+)\}/ },
];

criticalClasses.forEach(({ name, regex }) => {
  const m = regex.exec(css);
  if (m) {
    console.log(`  ✅ .${name}: ${m[1].trim()}`);
  } else {
    console.log(`  ❌ .${name}: MISSING`);
  }
});

// CHECK 3: chat-markdown component styles
console.log('\n=== CHECK 3: CHAT-MARKDOWN COMPONENT STYLES ===\n');
const chatMdRules = css.match(/\.chat-markdown[^{]*\{[^}]*\}/g) || [];
console.log(`  Found ${chatMdRules.length} .chat-markdown rules:`);
chatMdRules.forEach(rule => console.log('    ' + rule.substring(0, 150)));

// CHECK 4: Layer structure
console.log('\n=== CHECK 4: LAYER STRUCTURE ===\n');
const layerPositions = [];
let searchIdx = 0;
while (true) {
  const pos = css.indexOf('@layer ', searchIdx);
  if (pos === -1) break;
  const nameEnd = css.indexOf('{', pos);
  if (nameEnd === -1) break;
  const layerName = css.substring(pos, nameEnd).trim();
  layerPositions.push({ pos, name: layerName });
  searchIdx = pos + 1;
}
layerPositions.forEach(l => console.log(`  Position ${l.pos}: ${l.name}`));

// CHECK 5: Is anything after the last @layer closing brace setting padding/margin?
console.log('\n=== CHECK 5: POST-LAYER PADDING/MARGIN RULES ===\n');
// Find the last @layer closing
let lastLayerEnd = 0;
let braceDepth = 0;
for (const l of layerPositions) {
  let idx = l.pos;
  while (idx < css.length) {
    if (css[idx] === '{') braceDepth++;
    if (css[idx] === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        if (idx > lastLayerEnd) lastLayerEnd = idx;
        break;
      }
    }
    idx++;
  }
}
const afterLayers = css.substring(lastLayerEnd);
if (afterLayers.includes('padding:0') || afterLayers.includes('padding: 0')) {
  console.log('  ⚠️  STILL HAS unlayered padding:0 after layers!');
  // Find it
  const padIdx = afterLayers.indexOf('padding:0');
  console.log('  Context: ' + afterLayers.substring(Math.max(0, padIdx - 50), padIdx + 50));
} else {
  console.log('  ✅ No unlayered padding:0 found after layers');
}
if (afterLayers.includes('margin:0') || afterLayers.includes('margin: 0')) {
  console.log('  ⚠️  STILL HAS unlayered margin:0 after layers!');
} else {
  console.log('  ✅ No unlayered margin:0 found after layers');
}

// CHECK 6: No !important hacks remaining
console.log('\n=== CHECK 6: !IMPORTANT USAGE ===\n');
const importantMatches = css.match(/!important/g) || [];
console.log(`  Total !important occurrences: ${importantMatches.length}`);
// Check for our old hacks
const bangP4 = css.includes('\\!p-4');
const bangP5 = css.includes('\\!p-5');
const bangGap5 = css.includes('\\!gap-5');
console.log(`  \\!p-4 present: ${bangP4}`);
console.log(`  \\!p-5 present: ${bangP5}`);
console.log(`  \\!gap-5 present: ${bangGap5}`);

console.log('\n=== SUMMARY ===\n');
if (!foundUnlayeredReset && chatMdRules.length > 0 && !bangP4 && !bangP5 && !bangGap5) {
  console.log('  ✅ ALL CHECKS PASSED — CSS cascade is fixed');
} else {
  console.log('  ❌ SOME CHECKS FAILED — review above');
}
