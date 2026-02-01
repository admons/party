require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const PORT = process.env.PORT || 3002;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Initialize Telegram bot (polling disabled - we only send messages)
const bot = TELEGRAM_BOT_TOKEN ? new TelegramBot(TELEGRAM_BOT_TOKEN) : null;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendTelegramNotification(name) {
    if (!bot || !TELEGRAM_CHAT_ID) {
        console.log('Telegram not configured, skipping notification for:', name);
        return;
    }
    
    const message = `🎉 ${name} פתח/ה את ההזמנה למסיבה!`;
    
    bot.sendMessage(TELEGRAM_CHAT_ID, message)
        .then(() => {
            console.log('✅ Telegram notification sent for:', name)
        })
        .catch(err => {
            console.log('❌ Telegram error:', err.message)
        });
}

const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    
    // Check for n parameter and send notification
    const name = urlObj.searchParams.get('n');
    if (name) {
        sendTelegramNotification(decodeURIComponent(name));
    }
    
    // Static file serving
    let filePath = urlObj.pathname === '/' ? '/index.html' : urlObj.pathname;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`🎉 Party server running at http://localhost:${PORT}`);
    console.log(bot ? '✅ Telegram enabled' : '⚠️  Telegram disabled - set .env');
});
