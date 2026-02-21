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

    // Background: Deep dark gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGradient.addColorStop(0, '#0a0a0a');
    bgGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.save();

    // Center element: A sleek, modern card shape slightly tilted 15 degrees
    ctx.translate(512, 512);
    ctx.rotate(15 * Math.PI / 180);

    const cardWidth = 560;
    const cardHeight = 760;
    const rx = -cardWidth / 2;
    const ry = -cardHeight / 2;
    const radius = 64;

    // Drop shadow under the card
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 15;
    ctx.shadowOffsetY = 30;

    // Card shape (rounded rectangle)
    ctx.beginPath();
    ctx.moveTo(rx + radius, ry);
    ctx.lineTo(rx + cardWidth - radius, ry);
    ctx.quadraticCurveTo(rx + cardWidth, ry, rx + cardWidth, ry + radius);
    ctx.lineTo(rx + cardWidth, ry + cardHeight - radius);
    ctx.quadraticCurveTo(rx + cardWidth, ry + cardHeight, rx + cardWidth - radius, ry + cardHeight);
    ctx.lineTo(rx + radius, ry + cardHeight);
    ctx.quadraticCurveTo(rx, ry + cardHeight, rx, ry + cardHeight - radius);
    ctx.lineTo(rx, ry + radius);
    ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Reset shadow for internal elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Subtle newspaper/grid texture suggestion (thin horizontal lines)
    ctx.strokeStyle = '#e5e7eb'; // Very light gray
    ctx.lineCap = 'round';

    const startX = rx + 80;
    const endX = rx + cardWidth - 80;
    let currentY = ry + 160;

    // Title blocks
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(startX, currentY);
    ctx.lineTo(rx + cardWidth - 200, currentY);
    ctx.stroke();

    currentY += 50;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(startX, currentY);
    ctx.lineTo(rx + cardWidth - 280, currentY);
    ctx.stroke();

    // Body lines
    currentY += 90;
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(startX, currentY); ctx.lineTo(endX, currentY); ctx.stroke();

    currentY += 45;
    ctx.beginPath(); ctx.moveTo(startX, currentY); ctx.lineTo(endX, currentY); ctx.stroke();

    currentY += 45;
    ctx.beginPath(); ctx.moveTo(startX, currentY); ctx.lineTo(endX - 100, currentY); ctx.stroke();

    currentY += 90;
    ctx.beginPath(); ctx.moveTo(startX, currentY); ctx.lineTo(endX, currentY); ctx.stroke();

    currentY += 45;
    ctx.beginPath(); ctx.moveTo(startX, currentY); ctx.lineTo(endX, currentY); ctx.stroke();

    currentY += 45;
    ctx.beginPath(); ctx.moveTo(startX, currentY); ctx.lineTo(endX - 140, currentY); ctx.stroke();

    // Glowing dot in electric blue in top-right corner
    const dotX = rx + cardWidth - 90;
    const dotY = ry + 90;

    ctx.shadowColor = '#4FC3F7';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core for extra glow effect
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#E1F5FE';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

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

    // "SwipePulse" text centered, white, bold
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 140px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SwipePulse', 642, 1389);

    // Tagline below: "Swipe the news." in gray
    ctx.fillStyle = '#888888';
    ctx.font = '70px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.fillText('Swipe the news.', 642, 1530);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(dir, 'splash.png'), buffer);
    console.log('Splash screen created: assets/splash.png');
}

createIcon();
createSplash();
