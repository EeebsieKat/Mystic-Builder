const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(root, '.next', 'standalone', '.next', 'static');
const publicSrc = path.join(root, 'public');
const publicDest = path.join(root, '.next', 'standalone', 'public');
const srcAssetsSrc = path.join(root, 'src', 'assets');
const srcAssetsDest = path.join(root, '.next', 'standalone', 'src', 'assets');

if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true });
}
if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
}
if (fs.existsSync(srcAssetsSrc)) {
    fs.cpSync(srcAssetsSrc, srcAssetsDest, { recursive: true });
}

// Ensure all Prisma binary targets (Linux ARM64, Debian, etc.) are copied to standalone node_modules
const prismaSrc = path.join(root, 'node_modules', '.prisma');
const prismaDest = path.join(root, '.next', 'standalone', 'node_modules', '.prisma');
if (fs.existsSync(prismaSrc)) {
    fs.cpSync(prismaSrc, prismaDest, { recursive: true });
}

console.log('✓ Copied static assets, public directory, src/assets, and Prisma engines to standalone folder');
