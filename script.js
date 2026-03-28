// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.getElementById('navLinks');

mobileMenuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
});

// Close mobile menu when clicking on a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuToggle.textContent = '☰';
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Registration Form Handling
const registrationForm = document.getElementById('registrationForm');

registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(registrationForm);
    const data = Object.fromEntries(formData);

    // Store in localStorage (in production, this would be sent to a server)
    const registrations = JSON.parse(localStorage.getItem('dentx_registrations') || '[]');
    data.timestamp = new Date().toISOString();
    data.id = Date.now();
    registrations.push(data);
    localStorage.setItem('dentx_registrations', JSON.stringify(registrations));

    // Show success message
    showNotification('ลงทะเบียนสำเร็จ! เราจะติดต่อกลับในเร็วๆ นี้', 'success');

    // Reset form
    registrationForm.reset();

    // Log to console (for demonstration)
    console.log('Registration submitted:', data);
});

// Contact Form Handling
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Store in localStorage
    const contacts = JSON.parse(localStorage.getItem('dentx_contacts') || '[]');
    data.timestamp = new Date().toISOString();
    data.id = Date.now();
    contacts.push(data);
    localStorage.setItem('dentx_contacts', JSON.stringify(contacts));

    // Show success message
    showNotification('ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็ว', 'success');

    // Reset form
    contactForm.reset();

    // Log to console
    console.log('Contact form submitted:', data);
});

// Copy prompt functionality
function copyPrompt(button) {
    const promptCard = button.closest('.knowledge-card');
    const promptText = promptCard.querySelector('.knowledge-prompt').textContent.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(promptText).then(() => {
        // Change button text temporarily
        const originalText = button.textContent;
        button.textContent = '✓ คัดลอกแล้ว!';
        button.style.background = '#28a745';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);

        showNotification('คัดลอก Prompt สำเร็จ!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('ไม่สามารถคัดลอกได้ กรุณาลองอีกครั้ง', 'error');
    });
}

// Notification system
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #fd7e14)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: '10000',
        fontSize: '1.05rem',
        fontWeight: '600',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '400px'
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Scroll animations for cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.glass-card, .knowledge-card, .innovation-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
});

// Form validation enhancement
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9]{9,10}$/;
    return re.test(phone.replace(/[-\s]/g, ''));
}

// Add real-time validation
const emailInputs = document.querySelectorAll('input[type="email"]');
emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value && !validateEmail(input.value)) {
            input.style.borderColor = '#dc3545';
            showNotification('กรุณากรอกอีเมลให้ถูกต้อง', 'error');
        } else {
            input.style.borderColor = '';
        }
    });
});

const phoneInputs = document.querySelectorAll('input[type="tel"]');
phoneInputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value && !validatePhone(input.value)) {
            input.style.borderColor = '#dc3545';
            showNotification('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง', 'error');
        } else {
            input.style.borderColor = '';
        }
    });
});

// Innovation card hover effect enhancement
const innovationCards = document.querySelectorAll('.innovation-card');
innovationCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-12px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = '';
    });
});

// Knowledge card interaction
const knowledgeCards = document.querySelectorAll('.knowledge-card');
knowledgeCards.forEach(card => {
    card.addEventListener('click', function (e) {
        // Don't trigger if clicking the copy button
        if (!e.target.classList.contains('copy-btn')) {
            this.classList.toggle('expanded');
        }
    });
});

// Add parallax effect to hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Log page views (for analytics in production)
console.log('Dent X Innovation Center - Page Loaded');
console.log('Timestamp:', new Date().toISOString());

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Debug: Log stored data (remove in production)
console.log('Stored Registrations:', JSON.parse(localStorage.getItem('dentx_registrations') || '[]'));
console.log('Stored Contacts:', JSON.parse(localStorage.getItem('dentx_contacts') || '[]'));
