// ========================================
// DENT X ENHANCED FEATURES
// ========================================

// --- GOOGLE SHEETS INTEGRATION ---
const GOOGLE_SHEETS_CONFIG = {
    // แทนที่ URL นี้ด้วย Google Apps Script Web App URL ของคุณ
    // วิธีสร้าง: https://github.com/jamiewilson/form-to-google-sheets
    scriptURL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    enabled: false // เปลี่ยนเป็น true เมื่อมี URL แล้ว
};

// Enhanced Form Submission with Google Sheets
function initGoogleSheetsForm() {
    const form = document.getElementById('google-sheet-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const originalContent = btn.innerHTML;

        // Disable button
        btn.disabled = true;
        btn.classList.add('cursor-not-allowed');

        // Show loading with progress bar
        btn.innerHTML = `
            <div class="relative z-10 flex items-center justify-center space-x-2">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span>กำลังบันทึกข้อมูล...</span>
            </div>
            <div id="btn-progress-bar" class="absolute top-0 left-0 h-full bg-blue-800/50 transition-all ease-out duration-[2000ms]" style="width: 0%"></div>
        `;

        // Animate progress bar
        requestAnimationFrame(() => {
            const progressBar = document.getElementById('btn-progress-bar');
            if (progressBar) progressBar.style.width = '100%';
        });

        try {
            if (GOOGLE_SHEETS_CONFIG.enabled) {
                // Send to Google Sheets
                const formData = new FormData(form);
                const response = await fetch(GOOGLE_SHEETS_CONFIG.scriptURL, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Network response was not ok');

                // Success
                await Swal.fire({
                    icon: 'success',
                    title: 'ลงทะเบียนสำเร็จ!',
                    html: `
                        <p class="mb-2">ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว</p>
                        <p class="text-sm text-slate-500">เจ้าหน้าที่ Dent X จะติดต่อกลับภายใน 24 ชั่วโมง</p>
                    `,
                    confirmButtonColor: '#2563EB',
                    confirmButtonText: 'เรียบร้อย'
                });

                form.reset();
            } else {
                // Simulation mode (no Google Sheets)
                await new Promise(resolve => setTimeout(resolve, 1500));

                await Swal.fire({
                    icon: 'success',
                    title: 'ลงทะเบียนสำเร็จ!',
                    html: `
                        <p class="mb-2">ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว</p>
                        <p class="text-sm text-slate-500">เจ้าหน้าที่ Dent X จะติดต่อกลับเพื่อยืนยันสิทธิ์ Hands-on</p>
                        <div class="mt-3 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                            <i class="fa-solid fa-info-circle mr-1"></i> 
                            Demo Mode: เชื่อมต่อ Google Sheets เพื่อบันทึกข้อมูลจริง
                        </div>
                    `,
                    confirmButtonColor: '#2563EB'
                });

                form.reset();
            }
        } catch (error) {
            console.error('Error!', error.message);

            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#DC2626'
            });
        } finally {
            // Reset button
            btn.innerHTML = originalContent;
            btn.disabled = false;
            btn.classList.remove('cursor-not-allowed');
        }
    });
}

// --- ENHANCED SCROLL ANIMATIONS ---
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    document.querySelectorAll('.scroll-animate').forEach(el => {
        observer.observe(el);
    });
}

// --- GALLERY LIGHTBOX ---
function initGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const imgSrc = item.querySelector('img')?.src || '';
            const caption = item.dataset.caption || '';

            Swal.fire({
                imageUrl: imgSrc,
                imageAlt: caption,
                text: caption,
                showCloseButton: true,
                showConfirmButton: false,
                customClass: {
                    image: 'rounded-lg'
                }
            });
        });
    });
}

// --- TESTIMONIAL CAROUSEL ---
let currentTestimonial = 0;
function initTestimonialCarousel() {
    const testimonials = document.querySelectorAll('.testimonial-item');
    if (testimonials.length === 0) return;

    function showTestimonial(index) {
        testimonials.forEach((item, i) => {
            item.classList.toggle('hidden', i !== index);
        });
    }

    // Auto-rotate every 5 seconds
    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, 5000);

    // Show first testimonial
    showTestimonial(0);
}

// --- ENHANCED MOBILE MENU ---
function enhanceMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;

    // Close menu on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && menu.classList.contains('open')) {
            // Scrolling down - close menu
            toggleMobileMenu();
        }

        lastScroll = currentScroll;
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (menu.classList.contains('open') &&
            !menu.contains(e.target) &&
            !menuBtn.contains(e.target)) {
            toggleMobileMenu();
        }
    });
}

// --- LAZY LOADING IMAGES ---
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// --- SMOOTH SCROLL WITH OFFSET ---
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = document.querySelector('nav')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// --- COPY TO CLIPBOARD ENHANCEMENT ---
function enhanceCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const textToCopy = this.dataset.copy ||
                this.previousElementSibling?.innerText.replace(/"/g, "") || '';

            try {
                await navigator.clipboard.writeText(textToCopy);

                // Visual feedback
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="fa-solid fa-check"></i> คัดลอกแล้ว';
                this.classList.add('bg-green-600', 'text-white', 'border-green-600');

                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.classList.remove('bg-green-600', 'text-white', 'border-green-600');
                }, 2000);

                // Toast notification
                showToast('คัดลอก Prompt สำเร็จ!', 'success');
            } catch (err) {
                console.error('Failed to copy:', err);
                showToast('ไม่สามารถคัดลอกได้', 'error');
            }
        });
    });
}

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    toast.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Slide in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);

    // Slide out and remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- FORM VALIDATION ENHANCEMENT ---
function enhanceFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                validateField(this);
            });

            input.addEventListener('input', function () {
                if (this.classList.contains('border-red-500')) {
                    validateField(this);
                }
            });
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required check
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'กรุณากรอกข้อมูลนี้';
    }

    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
    }

    // Phone validation (Thai format)
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[0-9]{9,10}$/;
        const cleanPhone = value.replace(/[-\s]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            isValid = false;
            errorMessage = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
        }
    }

    // Update UI
    if (isValid) {
        field.classList.remove('border-red-500', 'bg-red-50');
        field.classList.add('border-green-500');
        removeErrorMessage(field);
    } else {
        field.classList.remove('border-green-500');
        field.classList.add('border-red-500', 'bg-red-50');
        showErrorMessage(field, errorMessage);
    }

    return isValid;
}

function showErrorMessage(field, message) {
    removeErrorMessage(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-xs mt-1 error-message';
    errorDiv.innerHTML = `<i class="fa-solid fa-exclamation-circle mr-1"></i>${message}`;

    field.parentNode.appendChild(errorDiv);
}

function removeErrorMessage(field) {
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// --- PERFORMANCE MONITORING ---
function logPerformance() {
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;

                console.log('📊 Performance Metrics:');
                console.log(`   Page Load Time: ${pageLoadTime}ms`);
                console.log(`   Server Response: ${connectTime}ms`);
            }, 0);
        });
    }
}

// --- INITIALIZE ALL FEATURES ---
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Dent X Enhanced Features Loading...');

    // Core features
    initGoogleSheetsForm();
    initSmoothScroll();
    enhanceCopyButtons();
    enhanceFormValidation();

    // Visual enhancements
    initScrollAnimations();
    initGalleryLightbox();
    initTestimonialCarousel();

    // Mobile enhancements
    enhanceMobileMenu();

    // Performance
    initLazyLoading();
    logPerformance();

    console.log('✅ All enhanced features loaded successfully!');
});

// Export functions for global use
window.DentX = {
    showToast,
    validateField,
    GOOGLE_SHEETS_CONFIG
};
