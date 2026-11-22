const fs = require('fs');
const path = require('path');

const fonts = [
    { name: 'Cinzel-700.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/cinzel@latest/latin-700-normal.ttf' },
    { name: 'Inter-400.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf' },
    { name: 'Inter-500.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf' },
    { name: 'Inter-600.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf' },
    { name: 'Inter-700.ttf', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf' },
];

const targets = [
    path.join(__dirname, '..', 'public', 'fonts'),
    path.join(__dirname, '..', 'src', 'assets', 'fonts')
];

async function main() {
    for (const dir of targets) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    for (const font of fonts) {
        console.log(`Downloading ${font.name}...`);
        const res = await fetch(font.url);
        if (!res.ok) throw new Error(`Failed to fetch ${font.url}: ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());

        for (const dir of targets) {
            const dest = path.join(dir, font.name);
            fs.writeFileSync(dest, buffer);
            console.log(`Saved ${dest} (${buffer.length} bytes)`);
        }
    }
    console.log('All OG fonts downloaded successfully!');
}

main().catch(console.error);
