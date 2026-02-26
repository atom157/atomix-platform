const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const outDir = path.join(__dirname, '../extension/icons');
const sourceImg = path.join(__dirname, 'public', 'logo-512.png');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function generate() {
    for (const size of sizes) {
        // Calculate padding (e.g. 10% padding so it avoids cutoff)
        const padding = Math.max(1, Math.floor(size * 0.1));
        const innerSize = size - (padding * 2);

        await sharp(sourceImg)
            .resize(innerSize, innerSize, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .extend({
                top: padding,
                bottom: padding,
                left: padding,
                right: padding,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(path.join(outDir, `icon${size}.png`));
        console.log(`Generated icon${size}.png from logo-512.png`);
    }
}

generate().catch(console.error);
