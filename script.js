/**
 * Admon's 40th Pool Party - AI Enhanced JavaScript
 * Particle system, cursor effects, and calendar functionality
 */

// ========================================
// Visitor Notification
// ========================================

(function notifyVisitor() {
    // Get code from URL path (e.g., /1, /25)
    const pathCode = window.location.pathname.slice(1); // Remove leading /
    let code = /^\d+$/.test(pathCode) ? pathCode : null;
    
    if (code && !localStorage.getItem('visitor_code')) {
        // Save the code for future visits
        localStorage.setItem('visitor_code', code);
    } else if (!code) {
        // Use saved code if available
        code = localStorage.getItem('visitor_code');
    }
    
    if (!code) code = "0";
    
    fetch('/api/notify/' + encodeURIComponent(code))
        .catch(() => {});
})();

// ========================================
// Scratch to Reveal (scratch to show bg.png on top)
// ========================================

class ScratchReveal {
    constructor() {
        this.container = document.querySelector('.scratch-container');
        this.canvas = document.getElementById('scratch-canvas');
        this.image = document.querySelector('.scratch-image');
        
        if (!this.canvas || !this.container) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.scratchedPixels = 0;
        this.totalPixels = 0;
        this.shrinkTimeout = null;
        this.hasShrunk = false;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Listen on document for scratch events (allows button to work)
        document.addEventListener('mousedown', (e) => this.handleStart(e));
        document.addEventListener('mousemove', (e) => this.handleMove(e));
        document.addEventListener('mouseup', () => this.stopDraw());
        
        document.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
        document.addEventListener('touchend', () => this.stopDraw());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.totalPixels = this.canvas.width * this.canvas.height;
        // Canvas starts empty/transparent - scratching draws the image onto it
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    isOnButton(x, y) {
        const btn = document.getElementById('google-cal-btn');
        if (!btn) return false;
        const rect = btn.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
    
    getPosition(e) {
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    handleStart(e) {
        const pos = this.getPosition(e);
        
        // If on button, don't scratch - let button handle the click
        if (this.isOnButton(pos.x, pos.y)) {
            return;
        }
        
        // If already shrunk, don't allow more scratching
        if (this.hasShrunk) return;
        
        e.preventDefault();
        this.isDrawing = true;
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Clear any pending shrink timeout
        if (this.shrinkTimeout) {
            clearTimeout(this.shrinkTimeout);
            this.shrinkTimeout = null;
        }
        
        // Draw image at touch point
        this.revealAt(pos.x, pos.y);
    }
    
    handleMove(e) {
        if (!this.isDrawing || this.hasShrunk) return;
        e.preventDefault();
        
        const pos = this.getPosition(e);
        
        // Draw line of revealed image
        const dist = Math.sqrt(Math.pow(pos.x - this.lastX, 2) + Math.pow(pos.y - this.lastY, 2));
        const steps = Math.max(1, Math.floor(dist / 10));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = this.lastX + (pos.x - this.lastX) * t;
            const y = this.lastY + (pos.y - this.lastY) * t;
            this.revealAt(x, y);
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    revealAt(x, y) {
        const radius = 40;
        
        // Draw the image through a circular mask at this point
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw the bg image at its natural size, centered on screen
        if (this.image.complete) {
            const imgWidth = this.image.naturalWidth;
            const imgHeight = this.image.naturalHeight;
            const offsetX = (this.canvas.width - imgWidth) / 2;
            const offsetY = (this.canvas.height - imgHeight) / 2;
            this.ctx.drawImage(this.image, offsetX, offsetY, imgWidth, imgHeight);
        }
        this.ctx.restore();
        
        // Track scratched area (approximate)
        this.scratchedPixels += Math.PI * radius * radius;
    }
    
    getScratchedPercent() {
        return (this.scratchedPixels / this.totalPixels) * 100;
    }
    
    stopDraw() {
        this.isDrawing = false;
        
        if (this.hasShrunk) return;
        
        // Check if scratched more than 30%
        const percent = this.getScratchedPercent();
        
        if (percent >= 30) {
            // Start 2 second timer to shrink
            this.shrinkTimeout = setTimeout(() => {
                this.shrinkToCorner();
            }, 2000);
        }
    }
    
    shrinkToCorner() {
        if (this.hasShrunk) return;
        this.hasShrunk = true;
        
        // Get image natural dimensions
        const imgWidth = this.image.naturalWidth;
        const imgHeight = this.image.naturalHeight;
        const startX = (window.innerWidth - imgWidth) / 2;
        const startY = (window.innerHeight - imgHeight) / 2;
        
        // Calculate target size (bottom left corner)
        const targetWidth = Math.min(window.innerWidth * 0.30, 360);
        const targetHeight = (imgHeight / imgWidth) * targetWidth;
        const targetX = 0;
        const targetY = window.innerHeight - targetHeight;
        
        const revealedImg = document.createElement('img');
        revealedImg.src = this.image.src;
        revealedImg.className = 'revealed-bg-image';
        revealedImg.style.cssText = `
            position: fixed;
            top: ${startY}px;
            left: ${startX}px;
            width: ${imgWidth}px;
            height: ${imgHeight}px;
            z-index: 150;
            pointer-events: none;
            transition: all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        
        document.body.appendChild(revealedImg);
        
        // Hide the canvas
        this.canvas.style.transition = 'opacity 0.3s ease';
        this.canvas.style.opacity = '0';
        
        // Hide and remove the scratch hint label
        const hintLabel = document.querySelector('.scratch-hint-label');
        if (hintLabel) {
            hintLabel.style.transition = 'opacity 0.5s ease';
            hintLabel.style.opacity = '0';
            setTimeout(() => {
                hintLabel.remove();
            }, 500);
        }
        
        // Trigger smooth animation to corner
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                revealedImg.style.top = `${targetY}px`;
                revealedImg.style.left = `${targetX}px`;
                revealedImg.style.width = `${targetWidth}px`;
                revealedImg.style.height = `${targetHeight}px`;
            });
        });
        
        // After animation, finalize and trigger confetti
        setTimeout(() => {
            revealedImg.style.zIndex = '20';
            // Hide the scratch container
            this.container.style.display = 'none';
            
            // Trigger confetti celebration!
            if (window.partyConfetti) {
                window.partyConfetti.burst(150);
            }
        }, 1200);
    }
}

// ========================================
// Event Details
// ========================================

const EVENT = {
    title: "יום הולדת 40 לאדמון 🎉🏊‍♂️",
    description: "בואו לחגוג איתי! מסיבת בריכה ליום הולדת 40",
    startDate: new Date(2026, 3, 25, 11, 0, 0), // April 25, 2026, 11:00 AM
    endDate: new Date(2026, 3, 25, 17, 0, 0),   // April 25, 2026, 5:00 PM
    location: "עוד לא ידוע"
};

// ========================================
// Custom Cursor
// ========================================

class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.cursorDot = document.querySelector('.cursor-dot');
        this.trails = [];
        this.trailCount = 8;
        this.mouseX = 0;
        this.mouseY = 0;
        this.cursorX = 0;
        this.cursorY = 0;
        
        if (!this.cursor || !this.cursorDot) return;
        
        // Create trail elements
        for (let i = 0; i < this.trailCount; i++) {
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.opacity = (1 - i / this.trailCount) * 0.5;
            trail.style.transform = `scale(${1 - i / this.trailCount})`;
            document.body.appendChild(trail);
            this.trails.push({
                element: trail,
                x: 0,
                y: 0
            });
        }
        
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        document.addEventListener('mousedown', () => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
            this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
        });
        
        document.addEventListener('mouseup', () => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        // Hover effects on interactive elements
        const interactiveElements = document.querySelectorAll('button, a, .detail-card, .big-number');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                this.cursor.style.borderColor = '#FFE135';
                this.cursorDot.style.background = '#FFE135';
            });
            el.addEventListener('mouseleave', () => {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                this.cursor.style.borderColor = '#FF6B9D';
                this.cursorDot.style.background = '#FF6B9D';
            });
        });
        
        this.animate();
    }
    
    animate() {
        // Smooth cursor following
        this.cursorX += (this.mouseX - this.cursorX) * 0.15;
        this.cursorY += (this.mouseY - this.cursorY) * 0.15;
        
        this.cursor.style.left = `${this.cursorX}px`;
        this.cursor.style.top = `${this.cursorY}px`;
        this.cursorDot.style.left = `${this.mouseX}px`;
        this.cursorDot.style.top = `${this.mouseY}px`;
        
        // Update trails
        let prevX = this.mouseX;
        let prevY = this.mouseY;
        
        this.trails.forEach((trail, index) => {
            const speed = 0.3 - index * 0.02;
            trail.x += (prevX - trail.x) * speed;
            trail.y += (prevY - trail.y) * speed;
            trail.element.style.left = `${trail.x}px`;
            trail.element.style.top = `${trail.y}px`;
            prevX = trail.x;
            prevY = trail.y;
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// Interactive Particle System
// ========================================

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.colors = ['#FF6B9D', '#40E0D0', '#FFE135', '#FF6F61', '#A855F7', '#3B82F6'];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        this.init();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        // Create initial particles
        const particleCount = Math.min(80, Math.floor((this.canvas.width * this.canvas.height) / 15000));
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle(x, y) {
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            alpha: Math.random() * 0.5 + 0.2,
            pulse: Math.random() * Math.PI * 2
        };
    }
    
    drawParticle(p) {
        const pulseSize = p.size + Math.sin(p.pulse) * 0.5;
        
        // Glow effect
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseSize * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color + '40');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, pulseSize * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = p.alpha * 0.3;
        this.ctx.fill();
        
        // Core particle
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1;
    }
    
    connectParticles() {
        const maxDistance = 120;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(255, 107, 157, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
        
        // Connect to mouse
        this.particles.forEach(p => {
            const dx = p.x - this.mouseX;
            const dy = p.y - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const opacity = (1 - distance / 150) * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.mouseX, this.mouseY);
                this.ctx.strokeStyle = `rgba(64, 224, 208, ${opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        });
    }
    
    updateParticle(p) {
        // Mouse interaction - particles are attracted to mouse
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
            const force = (200 - distance) / 200;
            p.speedX += (dx / distance) * force * 0.02;
            p.speedY += (dy / distance) * force * 0.02;
        }
        
        // Apply speed with damping
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedX *= 0.99;
        p.speedY *= 0.99;
        
        // Pulse animation
        p.pulse += 0.02;
        
        // Wrap around edges
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.connectParticles();
        
        this.particles.forEach(p => {
            this.updateParticle(p);
            this.drawParticle(p);
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// Calendar Functions
// ========================================

function formatDateForGoogle(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

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

// ========================================
// Confetti Animation
// ========================================

class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.colors = ['#FF6B9D', '#FFE135', '#40E0D0', '#FF6F61', '#A855F7', '#fff'];
        this.shapes = ['circle', 'square', 'triangle', 'star'];
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
            size: Math.random() * 12 + 6,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
            speedY: Math.random() * 8 + 5,
            speedX: (Math.random() - 0.5) * 6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            wobble: Math.random() * 10,
            wobbleSpeed: Math.random() * 0.2
        };
    }
    
    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        let rotation = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            this.ctx.lineTo(x + Math.cos(rotation) * outerRadius, y + Math.sin(rotation) * outerRadius);
            rotation += step;
            this.ctx.lineTo(x + Math.cos(rotation) * innerRadius, y + Math.sin(rotation) * innerRadius);
            rotation += step;
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawParticle(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        
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
            case 'star':
                this.drawStar(0, 0, p.size / 2);
                break;
        }
        
        this.ctx.restore();
    }
    
    updateParticle(p) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.8;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.speedY += 0.15;
        
        return p.y < this.canvas.height + 50;
    }
    
    burst(count = 120) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.particles.push(this.createParticle());
            }, i * 15);
        }
        
        if (!this.running) {
            this.running = true;
            this.animate();
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            this.drawParticle(p);
            return this.updateParticle(p);
        });
        
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.running = false;
        }
    }
}

// ========================================
// Button Effects
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
        background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple-effect 0.8s ease-out;
        pointer-events: none;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
}

// Add ripple keyframes
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple-effect {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// ========================================
// Initialize Everything
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize scratch to reveal
    new ScratchReveal();
    
    // Initialize custom cursor (desktop only)
    if (window.innerWidth > 480) {
        new CustomCursor();
    }
    
    // Initialize particle system
    const particleCanvas = document.getElementById('particle-canvas');
    if (particleCanvas) {
        new ParticleSystem(particleCanvas);
    }
    
    // Initialize confetti
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confetti = new Confetti(confettiCanvas);
    window.partyConfetti = confetti; // Make available globally for scratch reveal
    
    // Burst confetti on page load
    setTimeout(() => confetti.burst(100), 500);
    
    // Google Calendar button
    const googleBtn = document.getElementById('google-cal-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', (e) => {
            createRipple(e);
            window.open(getGoogleCalendarUrl(), '_blank');
            confetti.burst(50);
        });
    }
    
    // Easter Egg: Click the big 40 for extra confetti!
    const bigNumber = document.querySelector('.big-number');
    if (bigNumber) {
        bigNumber.addEventListener('click', () => {
            confetti.burst(200);
        });
    }
    
    // Add parallax effect to floating toys based on mouse
    document.addEventListener('mousemove', (e) => {
        const toys = document.querySelectorAll('.toy');
        const x = (e.clientX - window.innerWidth / 2) / 50;
        const y = (e.clientY - window.innerHeight / 2) / 50;
        
        toys.forEach((toy, index) => {
            const factor = (index + 1) * 0.5;
            toy.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });
});
