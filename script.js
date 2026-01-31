/**
 * Admon's 40th Pool Party - JavaScript
 * Calendar functionality + Confetti animation
 */

// ========================================
// Event Details
// ========================================

const EVENT = {
    title: "Admon's 40th Birthday Pool Party! 🎉🏊‍♂️",
    description: "Join me for a splashing good time at my 40th birthday pool party! Bring your swimsuit and sunscreen!",
    startDate: new Date(2026, 3, 25, 11, 0, 0), // April 25, 2026, 11:00 AM
    endDate: new Date(2026, 3, 25, 17, 0, 0),   // April 25, 2026, 5:00 PM
    location: "" // Location is private
};

// ========================================
// Calendar Functions
// ========================================

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmss format)
 */
function formatDateForGoogle(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSS format)
 */
function formatDateForICS(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

/**
 * Generate Google Calendar URL
 */
function getGoogleCalendarUrl() {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: EVENT.title,
        dates: `${formatDateForGoogle(EVENT.startDate)}/${formatDateForGoogle(EVENT.endDate)}`,
        details: EVENT.description,
        location: EVENT.location
    });
    return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate ICS file content
 */
function generateICSContent() {
    const uid = `admon-40th-party-${Date.now()}@admon.party`;
    const dtstamp = formatDateForICS(new Date());
    const dtstart = formatDateForICS(EVENT.startDate);
    const dtend = formatDateForICS(EVENT.endDate);
    
    // Escape special characters for ICS format
    const escapeICS = (str) => str.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Admon Party//Pool Party//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${escapeICS(EVENT.title)}`,
        `DESCRIPTION:${escapeICS(EVENT.description)}`,
        EVENT.location ? `LOCATION:${escapeICS(EVENT.location)}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
}

/**
 * Download ICS file
 */
function downloadICSFile() {
    const content = generateICSContent();
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admon-40th-pool-party.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ========================================
// Confetti Animation
// ========================================

class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.colors = ['#FF6B9D', '#FFE135', '#40E0D0', '#FF6F61', '#87CEEB', '#fff'];
        this.shapes = ['circle', 'square', 'triangle'];
        this.running = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            size: Math.random() * 10 + 5,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            wobble: Math.random() * 10,
            wobbleSpeed: Math.random() * 0.1
        };
    }
    
    drawParticle(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        
        switch (p.shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'square':
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                break;
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -p.size / 2);
                this.ctx.lineTo(p.size / 2, p.size / 2);
                this.ctx.lineTo(-p.size / 2, p.size / 2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }
    
    updateParticle(p) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.5;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.speedY += 0.05; // Gravity
        
        return p.y < this.canvas.height + 50;
    }
    
    burst(count = 100) {
        // Create particles spread across the top of the screen
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.particles.push(this.createParticle());
            }, i * 20);
        }
        
        if (!this.running) {
            this.running = true;
            this.animate();
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles = this.particles.filter(p => {
            this.drawParticle(p);
            return this.updateParticle(p);
        });
        
        // Continue animation if there are particles
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.running = false;
        }
    }
}

// ========================================
// Button Ripple Effect
// ========================================

function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple-effect 0.6s ease-out;
        pointer-events: none;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Add ripple keyframes
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple-effect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// ========================================
// Initialize
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize confetti
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confetti = new Confetti(confettiCanvas);
    
    // Burst confetti on page load
    setTimeout(() => confetti.burst(80), 500);
    
    // Google Calendar button
    const googleBtn = document.getElementById('google-cal-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            createRipple(e);
            window.open(getGoogleCalendarUrl(), '_blank');
            confetti.burst(30);
        });
    }
    
    // ICS Download button
    const icsBtn = document.getElementById('ics-download-btn');
    if (icsBtn) {
        icsBtn.addEventListener('click', (e) => {
            createRipple(e);
            downloadICSFile();
            confetti.burst(30);
        });
    }
    
    // Add hover sound effect (optional - visual wobble instead)
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.animation = 'none';
            btn.offsetHeight; // Trigger reflow
            btn.style.animation = 'button-wobble 0.3s ease';
        });
    });
});

// Button wobble animation
const wobbleStyle = document.createElement('style');
wobbleStyle.textContent = `
    @keyframes button-wobble {
        0% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-2px) rotate(-1deg); }
        50% { transform: translateY(0) rotate(1deg); }
        75% { transform: translateY(-1px) rotate(-0.5deg); }
        100% { transform: translateY(0) rotate(0deg); }
    }
`;
document.head.appendChild(wobbleStyle);

// ========================================
// Easter Egg: Click the big 40 for extra confetti!
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const bigNumber = document.querySelector('.big-number');
    const confettiCanvas = document.getElementById('confetti-canvas');
    
    if (bigNumber && confettiCanvas) {
        const confetti = new Confetti(confettiCanvas);
        
        bigNumber.style.cursor = 'pointer';
        bigNumber.addEventListener('click', () => {
            confetti.burst(150);
        });
    }
});

