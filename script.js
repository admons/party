/**
 * Admon's 40th Pool Party - AI Enhanced JavaScript
 * Particle system, cursor effects, and calendar functionality
 */

// ========================================
// Scratch to Reveal
// ========================================

class ScratchReveal {
    constructor() {
        this.container = document.querySelector('.scratch-container');
        this.canvas = document.getElementById('scratch-canvas');
        this.image = document.querySelector('.scratch-image');
        
        if (!this.canvas || !this.container) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.revealed = false;
        this.scratchedPercent = 0;
        
        // Wait for image to load
        this.image.onload = () => this.init();
        if (this.image.complete) this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Show the scratch container
        this.container.classList.add('active');
        
        // Add hint text
        const hint = document.createElement('div');
        hint.className = 'scratch-hint';
        hint.textContent = '👆 גרד כדי לגלות!';
        this.container.appendChild(hint);
        this.hint = hint;
        
        // Fill canvas with cover color/pattern
        this.fillCover();
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDraw());
        this.canvas.addEventListener('mouseleave', () => this.stopDraw());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.startDraw(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.stopDraw());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.ctx) this.fillCover();
    }
    
    fillCover() {
        // Create gradient cover
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some sparkle pattern
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 4 + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = 'bold 24px Fredoka';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎁 גרד כאן! 🎁', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    startDraw(e) {
        e.preventDefault();
        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Hide hint after first touch
        if (this.hint) {
            this.hint.style.opacity = '0';
        }
    }
    
    draw(e) {
        if (!this.isDrawing || this.revealed) return;
        e.preventDefault();
        
        const pos = this.getPosition(e);
        
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = 60;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Check scratch percentage
        this.checkReveal();
    }
    
    stopDraw() {
        this.isDrawing = false;
    }
    
    checkReveal() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        let transparent = 0;
        
        // Sample every 100th pixel for performance
        for (let i = 3; i < pixels.length; i += 400) {
            if (pixels[i] === 0) transparent++;
        }
        
        const total = pixels.length / 400;
        this.scratchedPercent = (transparent / total) * 100;
        
        // If 40% revealed, show the full image
        if (this.scratchedPercent > 40 && !this.revealed) {
            this.revealed = true;
            this.revealFull();
        }
    }
    
    revealFull() {
        // Fade out canvas
        this.canvas.style.transition = 'opacity 1s ease';
        this.canvas.style.opacity = '0';
        
        // After animation, hide the whole scratch container
        setTimeout(() => {
            this.container.style.transition = 'opacity 0.5s ease';
            this.container.style.opacity = '0';
            
            setTimeout(() => {
                this.container.classList.remove('active');
                this.container.style.display = 'none';
            }, 500);
        }, 2000);
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
            speedY: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            wobble: Math.random() * 10,
            wobbleSpeed: Math.random() * 0.15
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
        p.speedY += 0.05;
        
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
