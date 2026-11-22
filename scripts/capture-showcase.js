const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '..', 'public', 'assets', 'showcase');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
    {
        name: 'preview-builder.png',
        url: 'http://localhost:3000/builder?b=VafqTr8IrCL8H2vIXUptpTbkt3wczC5PFdMcBC4bfaLTbCresjNuMCPFPSqviM',
        size: '1280,820'
    },
    {
        name: 'preview-suggestions.png',
        url: 'http://localhost:3000/?tab=suggestions',
        size: '1280,820'
    },
    {
        name: 'preview-database.png',
        url: 'http://localhost:3000/?tab=database',
        size: '1280,820'
    }
];

for (const target of targets) {
    const outFile = path.join(outDir, target.name);
    console.log(`Capturing ${target.url} -> ${target.name}...`);
    try {
        const cmd = `"${chromePath}" --headless=new --disable-gpu --hide-scrollbars --window-size=${target.size} --virtual-time-budget=3500 "--screenshot=${outFile}" "${target.url}"`;
        execSync(cmd, { stdio: 'inherit' });
        console.log(`Saved ${target.name} (${fs.statSync(outFile).size} bytes)`);
    } catch (err) {
        console.error(`Failed ${target.name}:`, err.message);
    }
}
