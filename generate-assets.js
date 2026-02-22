const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const dir = path.join(__dirname, 'assets');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// 1. App Icon (1024x1024)
function createIcon() {
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Background: Solid dark
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Render merged "N" and "S"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 600px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw N slightly to the left, S slightly to the right, overlapping
    ctx.fillText('N', 420, 512);
    ctx.fillText('S', 604, 512);

    // Subtle swipe arrow curve
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // A curve from left to right passing through the middle
    ctx.moveTo(250, 600);
    ctx.quadraticCurveTo(512, 680, 774, 600);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(760, 580);
    ctx.lineTo(774, 600);
    ctx.lineTo(750, 615);
    ctx.stroke();

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(dir, 'icon.png'), buffer);
    console.log('App icon created: assets/icon.png');
}

// 2. Splash Screen (1284x2778)
function createSplash() {
    const canvas = createCanvas(1284, 2778);
    const ctx = canvas.getContext('2d');

    // Dark background (#0a0a0a)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 1284, 2778);

    // "NewsSwipe" text centered, white, bold
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 160px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NewsSwipe', 642, 1389);

    // Tagline below: "Swipe the news." in gray
    ctx.fillStyle = '#666666';
    ctx.font = '70px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.fillText('Swipe the news.', 642, 1540);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(dir, 'splash.png'), buffer);
    console.log('Splash screen created: assets/splash.png');
}

createIcon();
createSplash();
