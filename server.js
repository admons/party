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
    
    const message = `${name}`;
    
    bot.sendMessage(TELEGRAM_CHAT_ID, message)
        .then(() => {
            console.log('✅ Telegram notification sent for:', name)
        })
        .catch(err => {
            console.log('❌ Telegram error:', err.message)
        });
}

const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url);
    
    // Check for n parameter (base64 encoded) and send notification
    const encodedName = urlObj.searchParams.get('n');
    if (encodedName) {
        try {
            const name = Buffer.from(encodedName, 'base64').toString('utf8');
            sendTelegramNotification(name);
        } catch (e) {
            console.log('Failed to decode name:', e.message);
        }
    }
    
    // Static file serving
    let filePath = urlObj.pathname === '/' ? '/index.html' : urlObj.pathname;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            filePath = path.join(__dirname, '/index.html');
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    console.error(err)
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            });
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
