/**
 * Fix API Limits - Remove or Increase Limits to Show All Data
 * This script updates the admin.js routes to remove restrictive limits
 */

const fs = require('fs');
const path = require('path');

const adminRoutesPath = path.join(__dirname, '../server/routes/admin.js');

console.log('='.repeat(60));
console.log('FIXING API LIMITS TO SHOW ALL DATA');
console.log('='.repeat(60));
console.log();

// Read the file
let content = fs.readFileSync(adminRoutesPath, 'utf8');

// Replace default limits from 20 to 1000 (or remove limits entirely)
const replacements = [
    // Change default limit from 20 to 1000
    { from: /limit = 20/g, to: 'limit = 1000' },
    { from: /limit: 20/g, to: 'limit: 1000' },
    { from: /parseInt\(limit\)/g, to: 'Math.min(parseInt(limit) || 1000, 1000)' },
];

let changes = 0;
replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
        content = content.replace(from, to);
        changes += matches.length;
    }
});

// Also ensure pagination doesn't hide data - add option to get all
// Find all router.get patterns and add a way to bypass limits
const routePattern = /router\.get\(['"]\/\w+['"],\s*authenticateToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*\{\s*page\s*=\s*1,\s*limit\s*=\s*\d+/g;

content = content.replace(
    /const\s*\{\s*page\s*=\s*1,\s*limit\s*=\s*(\d+)/g,
    (match, defaultLimit) => {
        return `const { page = 1, limit = ${defaultLimit}, all = false } = req.query;
    const actualLimit = all === 'true' || all === true ? 10000 : Math.min(parseInt(limit) || ${defaultLimit}, 1000)`;
    }
);

// Write the file back
fs.writeFileSync(adminRoutesPath, content, 'utf8');

console.log(`✓ Made ${changes} replacements`);
console.log('✓ Updated API routes to support higher limits');
console.log('✓ Added "all=true" parameter option to bypass limits');
console.log();
console.log('='.repeat(60));
console.log('API LIMITS FIXED');
console.log('='.repeat(60));

