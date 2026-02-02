require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const PORT = process.env.PORT || 3002;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Load guest mapping
let guests = {};
try {
    guests = JSON.parse(fs.readFileSync(path.join(__dirname, 'guests.json'), 'utf8'));
    console.log(`📋 Loaded ${Object.keys(guests).length} guests`);
} catch (e) {
    console.log('⚠️  No guests.json found');
}

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
    const [pathname, queryString] = req.url.split('?');
    
    // Parse query params manually
    const params = {};
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) params[key] = decodeURIComponent(value || '');
        });
    }
    
    // API endpoint for visitor notification (called from client JS)
    if (pathname.startsWith('/api/notify/')) {
        const code = pathname.split('/api/notify/')[1];
        const name = guests[code] || `אורח #${code}`;
        
        // Check if user tried to change the code
        const triedCode = params.tried;
        let message = name;
        if (triedCode && triedCode !== code) {
            const triedName = guests[triedCode] || `#${triedCode}`;
            message = `${name} (ניסה להיכנס בתור ${triedName})`;
        }
        
        sendTelegramNotification(message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, name }));
        return;
    }
    
    // Check if pathname is a guest code (e.g., /1, /25)
    const guestCode = pathname.slice(1); // Remove leading /
    const isGuestPath = /^\d+$/.test(guestCode) && guests[guestCode];
    
    // Static file serving
    let filePath = (pathname === '/' || isGuestPath) ? '/index.html' : pathname;
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
                res.writeHead(200, { 'Content-Type': 'text/html' });
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
