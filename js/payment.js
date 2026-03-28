// ===== PAYMENT SYSTEM =====
// ===== PAYMENT SYSTEM =====
window.PAID_TOPICS = {
    'grand-opening': 4500
};

window.openPaymentModal = (regId, amount, collectionName = 'eventRegistrations') => {
    console.log("Opening Payment Modal for:", regId, amount, collectionName);
    // alert("Debug: Opening Modal. Amount=" + amount); // Internal Verification

    // Handle string inputs with commas
    let numAmount = amount;
    if (typeof amount === 'string') {
        numAmount = parseFloat(amount.replace(/,/g, ''));
    }

    const modal = document.getElementById('modal-payment');
    const content = document.getElementById('modal-payment-content');

    // Debug - check if elements exist
    if (!modal) {
        alert("ERROR: modal-payment element NOT FOUND!");
        return;
    }
    if (!content) {
        alert("ERROR: modal-payment-content element NOT FOUND!");
        return;
    }

    document.getElementById('pay-amount').innerText = '฿' + numAmount.toLocaleString();
    document.getElementById('pay-reg-id').value = regId;

    const collectionInput = document.getElementById('pay-collection');
    if (collectionInput) collectionInput.value = collectionName;

    // Set QR Code (Use provided image with cache busting)
    document.getElementById('payment-qr').src = './S__25182217.jpg?v=' + Date.now();

    modal.classList.remove('hidden');
    modal.classList.add('active'); // CRITICAL: Add active class for visibility
    bringToFront(modal); // Dynamic z-index
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.closePaymentModal = () => {
    const modal = document.getElementById('modal-payment');
    const content = document.getElementById('modal-payment-content');
    modal.classList.remove('active'); // CRITICAL: Remove active class
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.add('pointer-events-none');
    }, 300);
};

// QR Code Zoom/Lightbox Functions
window.openQRZoom = (qrSrc) => {
    // Create a fullscreen overlay for QR zoom
    const overlay = document.createElement('div');
    overlay.id = 'qr-zoom-overlay';
    overlay.className = 'fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[9999] cursor-zoom-out';
    overlay.onclick = () => closeQRZoom();

    const img = document.createElement('img');
    img.src = qrSrc;
    img.className = 'max-w-full max-h-full object-contain';
    img.style.maxWidth = '90vw';
    img.style.maxHeight = '90vh';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark text-3xl"></i>';
    closeBtn.className = 'absolute top-4 right-4 text-white hover:text-gray-300 transition';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeQRZoom();
    };

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Fade in animation
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => overlay.style.opacity = '1', 10);
    }, 0);
};

window.closeQRZoom = () => {
    const overlay = document.getElementById('qr-zoom-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
};


window.handlePaymentSubmit = async (e) => {
    e.preventDefault();
    console.log("[Payment] Submit Triggered");
    const regId = document.getElementById('pay-reg-id').value;
    const collectionName = document.getElementById('pay-collection')?.value || 'eventRegistrations';
    console.log("[Payment] Reg ID:", regId, "Collection:", collectionName);

    if (!regId) {
        Swal.fire('Error', 'ไม่พบข้อมูลการลงทะเบียน (Missing ID)', 'error');
        return;
    }

    const fileInput = document.getElementById('payment-slip');
    const file = fileInput.files[0];
    const submitBtn = document.querySelector('button[type="submit"][form="form-payment"]');
    const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';

    if (!file) {
        Swal.fire('แจ้งเตือน', 'กรุณาแนบหลักฐานการโอนเงิน (Slip)', 'warning');
        return;
    }

    console.log("[Payment] File:", file.name, file.type, file.size);

    // File Validation
    if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น (.jpg, .png)', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
        Swal.fire('Error', 'ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
        return;
    }

    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัพโหลด...';
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = async () => {
            console.log("[Payment] Image Loaded");
            // Resize Image (Aggressive compression for free tier)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 600; // reduced from 800
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            // Extract Image Data for JSQR
            const imageData = ctx.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            let slipValidated = false;
            let validationData = null;

            if (code && code.data) {
                // Found QR, verify with backend
                try {
                    const payAmount = parseInt(document.getElementById('pay-amount').innerText.replace(/[^\d]/g, ''));
                    const res = await fetch('/api/verifySlip', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logId: code.data, amount: payAmount })
                    });
                    const data = await res.json();
                    if (data.success) {
                        slipValidated = true;
                        validationData = data.data;
                    } else {
                        throw new Error(data.message || 'Slip validation failed');
                    }
                } catch (e) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'หลักฐานมีปัญหา',
                        text: e.message || 'QR Code บนสลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง หรือสลิปเคยถูกใช้งานแล้ว',
                        footer: 'แต่ระบบได้บันทึกไว้ให้แอดมินตรวจสอบมือแล้ว'
                    });
                    // Still allow manual check just in case, but flag it
                }
            } else {
                console.warn("[Payment] No QR code detected on slip");
            }

            // Aggressive JPEG compression (0.5) to keep base64 sizes small
            const base64String = canvas.toDataURL('image/jpeg', 0.5);
            console.log("[Payment] Base64 Length:", base64String.length, "Validated:", slipValidated);

            try {
                if (!window.fbDb) {
                    throw new Error("Database connection not initialized");
                }

                await window.fbDb.collection(collectionName).doc(regId).update({
                    status: slipValidated ? 'confirmed' : 'waiting_approval',
                    paymentSlip: base64String,
                    paymentStatus: slipValidated ? 'paid' : 'pending_check',
                    slipData: validationData,
                    paidAt: firebase.firestore.FieldValue.serverTimestamp()
                });


                console.log("[Payment] Firestore Update Success");

                // Close QR zoom overlay if it's open
                closeQRZoom();

                // Close payment modal FIRST to avoid z-index issues
                closePaymentModal();

                // Then show success message after a brief delay
                setTimeout(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'บันทึกสำเร็จ',
                        text: 'ส่งหลักฐานเรียบร้อยแล้ว กรุณารอการตรวจสอบจากเจ้าหน้าที่',
                        confirmButtonColor: '#2EC4B6'
                    }).then(() => {
                        // Reload dashboard if user is there
                        const dashboardSection = document.getElementById('user-dashboard-section');
                        if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
                            renderUserDashboard(firebase.auth().currentUser);
                        }
                    });
                }, 400); // Wait for modal close animation
            } catch (error) {
                console.error("[Payment] Error:", error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message });
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }
            }
        };
        img.onerror = (err) => {
            console.error("[Payment] Image Error:", err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to process image.' });
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
        };
    };
    reader.onerror = () => {
        console.error("FileReader Error");
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to read file.' });
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    };
    reader.readAsDataURL(file);
};
