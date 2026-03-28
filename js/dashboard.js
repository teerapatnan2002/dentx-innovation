        // --- AUTO-DELETE EXPIRED PENDING PAYMENTS ---

        window.cleanupExpiredPendingPayments = async () => {
            try {
                if (!window.fbDb) return 0;

                const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
                const tenMinutesAgoTimestamp = firebase.firestore.Timestamp.fromDate(tenMinutesAgo);

                let totalDeleted = 0;

                // Cleanup eventRegistrations
                const regSnapshot = await fbDb.collection('eventRegistrations')
                    .where('status', '==', 'pending_payment')
                    .get();

                const deletePromises = [];
                regSnapshot.forEach(doc => {
                    const data = doc.data();
                    const registeredAt = data.registeredAt;
                    // Check if older than 10 minutes and no payment slip uploaded
                    if (registeredAt && registeredAt.toDate() < tenMinutesAgo && !data.paymentSlip) {
                        deletePromises.push(doc.ref.delete());
                        console.log(`[Cleanup] Auto-deleted expired registration: ${doc.id}`);
                    }
                });

                // Cleanup boothBookings
                const boothSnapshot = await fbDb.collection('boothBookings')
                    .where('status', '==', 'pending_payment')
                    .get();

                boothSnapshot.forEach(doc => {
                    const data = doc.data();
                    const bookedAt = data.bookedAt || data.registeredAt;
                    if (bookedAt && bookedAt.toDate() < tenMinutesAgo && !data.paymentSlip) {
                        deletePromises.push(doc.ref.delete());
                        console.log(`[Cleanup] Auto-deleted expired booth booking: ${doc.id}`);
                    }
                });

                await Promise.all(deletePromises);
                totalDeleted = deletePromises.length;

                if (totalDeleted > 0) {
                    console.log(`[Cleanup] Deleted ${totalDeleted} expired pending payment(s)`);
                    // Auto-reload dashboard if open
                    if (!document.getElementById('modal-dashboard')?.classList.contains('hidden')) {
                        await loadUserDashboard();
                    }
                }

                return totalDeleted;
            } catch (error) {
                console.error('[Cleanup] Error during cleanup:', error);
                return 0;
            }
        };

        // Run cleanup every 60 seconds (more responsive)
        setInterval(() => {
            if (window.fbDb) {
                cleanupExpiredPendingPayments();
            }
        }, 60 * 1000);

        // --- USER DASHBOARD LOGIC ---

        // Dashboard Modal Control
        window.openDashboardModal = async () => {
            const modal = document.getElementById('modal-dashboard');
            const panel = document.getElementById('dashboard-panel');
            if (!modal || !panel) return;

            modal.classList.remove('hidden');
            bringToFront(modal); // Dynamic z-index
            setTimeout(() => {
                panel.classList.remove('scale-95', 'opacity-0');
                panel.classList.add('scale-100', 'opacity-100');
            }, 10);

            // Load dashboard data
            await loadUserDashboard();
        };

        window.closeDashboardModal = () => {
            const modal = document.getElementById('modal-dashboard');
            const panel = document.getElementById('dashboard-panel');
            if (!panel) return;

            panel.classList.remove('scale-100', 'opacity-100');
            panel.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                if (modal) modal.classList.add('hidden');
            }, 300);
        };

        window.logout = async () => {
            try {
                await fbAuth.signOut();
                Swal.fire({
                    icon: 'success',
                    title: 'ออกจากระบบสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false
                });
                closeDashboardModal();
            } catch (error) {
                console.error("Logout error:", error);
                Swal.fire('Error', 'ไม่สามารถออกจากระบบได้', 'error');
            }
        };

        // Profile Edit Logic
        window.toggleEditProfile = () => {
            const container = document.getElementById('edit-profile-container');
            if (container.classList.contains('hidden')) {
                // Show form and populate existing data
                document.getElementById('edit-profile-name').value = currentUser?.displayName || '';

                // Fetch extra user details from the users collection
                if (currentUser && fbDb) {
                    fbDb.collection('users').doc(currentUser.uid).get().then(doc => {
                        if (doc.exists) {
                            const data = doc.data();
                            document.getElementById('edit-profile-phone').value = data.phoneNumber || '';
                            document.getElementById('edit-profile-org').value = data.organization || '';
                        }
                    }).catch(err => console.error("Error fetching user details:", err));
                }

                container.classList.remove('hidden');
            } else {
                // Hide form
                container.classList.add('hidden');
            }
        };

        window.saveUserProfile = async (e) => {
            e.preventDefault();
            if (!currentUser || !fbDb) return;

            const btn = document.getElementById('edit-profile-submit-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
            btn.disabled = true;

            const newName = document.getElementById('edit-profile-name').value.trim();
            const newPhone = document.getElementById('edit-profile-phone').value.trim();
            const newOrg = document.getElementById('edit-profile-org').value.trim();

            try {
                // Update Firebase Auth Profile
                await currentUser.updateProfile({
                    displayName: newName
                });

                // Update Firestore User Document
                await fbDb.collection('users').doc(currentUser.uid).set({
                    displayName: newName,
                    phoneNumber: newPhone,
                    organization: newOrg,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // Update UI instantly
                document.getElementById('dashboard-name').innerText = newName;

                // Hide Form and Show Success
                document.getElementById('edit-profile-container').classList.add('hidden');
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลสำเร็จ',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });

            } catch (error) {
                console.error("Error updating profile:", error);
                Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        // --- DASHBOARD PHONE VERIFICATION LOGIC ---
        window.phoneRecaptchaVerifier = null;
        window.phoneConfirmationResult = null;

        window.startPhoneVerification = async () => {
            if (!currentUser || !fbDb) return;

            const btn = document.querySelector('#phone-verification-action button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...';
            btn.disabled = true;

            try {
                // Fetch latest phone from Firestore
                const docSnap = await fbDb.collection('users').doc(currentUser.uid).get();
                if (!docSnap.exists) throw new Error("ไม่พบข้อมูลผู้ใช้");

                let rawPhone = docSnap.data().phoneNumber;
                if (!rawPhone || rawPhone.length !== 10 || !rawPhone.startsWith('0')) {
                    Swal.fire('ข้อผิดพลาด', 'กรุณาแก้ไขโปรไฟล์เพื่อเพิ่มเบอร์โทรศัพท์มือถือ (10 หลัก) ก่อนทำการยืนยัน', 'warning');
                    return;
                }

                let formattedPhone = "+66" + rawPhone.substring(1);

                document.getElementById('dashboard-otp-display-phone').innerText = rawPhone;
                document.getElementById('phone-verification-action').classList.add('hidden');
                document.getElementById('dashboard-otp-container').classList.remove('hidden');

                if (!window.phoneRecaptchaVerifier) {
                    window.phoneRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('dashboard-recaptcha-container', {
                        'size': 'normal',
                        'callback': (response) => { }
                    });
                    await window.phoneRecaptchaVerifier.render();
                }

                window.phoneConfirmationResult = await fbAuth.signInWithPhoneNumber(formattedPhone, window.phoneRecaptchaVerifier);

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'ส่ง SMS สำเร็จ',
                    showConfirmButton: false,
                    timer: 3000
                });
                document.getElementById('dashboard-otp-code').focus();

            } catch (error) {
                console.error("Dashboard Phone Auth Error:", error);
                if (window.phoneRecaptchaVerifier) {
                    await window.phoneRecaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
                }
                Swal.fire('ไม่สามารถส่งข้อความได้', error.message, 'error');
                cancelPhoneVerification();
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        window.confirmPhoneVerification = async () => {
            const code = document.getElementById('dashboard-otp-code').value.trim();
            if (code.length !== 6 || !window.phoneConfirmationResult) return;

            const btn = document.getElementById('btn-dashboard-verify-otp');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
            btn.disabled = true;

            try {
                // Verify Code
                await window.phoneConfirmationResult.confirm(code);

                // Update Firestore securely
                await fbDb.collection('users').doc(currentUser.uid).update({
                    phoneVerified: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                Swal.fire('สำเร็จ!', 'ยืนยันเบอร์โทรศัพท์มือถือเรียบร้อยแล้วบัญชีของคุณมีความปลอดภัยมากขึ้น', 'success');
                cancelPhoneVerification();
                await loadUserDashboard(); // Refresh UI

            } catch (error) {
                console.error("OTP Error:", error);
                let msg = 'เกิดข้อผิดพลาด';
                if (error.code === 'auth/invalid-verification-code') msg = 'รหัส OTP ไม่ถูกต้อง';
                else if (error.code === 'auth/code-expired') msg = 'รหัส OTP หมดอายุ';

                Swal.fire('ล้มเหลว', msg, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        window.cancelPhoneVerification = () => {
            document.getElementById('dashboard-otp-container').classList.add('hidden');
            document.getElementById('dashboard-otp-code').value = '';

            // Re-check state to show/hide the orange action bar
            loadUserDashboard();

            if (window.phoneRecaptchaVerifier) {
                try { window.phoneRecaptchaVerifier.clear(); } catch (e) { }
                window.phoneRecaptchaVerifier = null;
                document.getElementById('dashboard-recaptcha-container').innerHTML = '';
            }
        };

        async function loadUserDashboard() {
            if (!currentUser || !fbDb) return;

            // Run cleanup to remove expired pending payments
            cleanupExpiredPendingPayments();

            // Update Profile Info
            document.getElementById('dashboard-name').innerText = currentUser.displayName || 'User';
            document.getElementById('dashboard-email').innerText = currentUser.email;

            // Fetch extra user data
            const userDocSnap = await fbDb.collection('users').doc(currentUser.uid).get();
            let isPhoneVerified = false;
            if (userDocSnap.exists) {
                isPhoneVerified = userDocSnap.data().phoneVerified === true;
            }

            // Update Phone Badge UI
            const statusBadge = document.getElementById('dashboard-phone-status');
            const actionContainer = document.getElementById('phone-verification-action');
            const otpContainer = document.getElementById('dashboard-otp-container');

            if (statusBadge) {
                if (isPhoneVerified) {
                    statusBadge.innerHTML = '<span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200"><i class="fa-solid fa-check-circle mr-1"></i> เบอร์โทรยืนยันแล้ว</span>';
                    if (actionContainer) actionContainer.classList.add('hidden');
                    if (otpContainer) otpContainer.classList.add('hidden'); // Ensure OTP box is hidden if verified
                } else {
                    statusBadge.innerHTML = '<span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200"><i class="fa-solid fa-circle-exclamation mr-1"></i> ยังไม่ยืนยันเบอร์โทร</span>';
                    // Only show the action bar if they are NOT mid-verification (where OTP container is already open)
                    if (actionContainer && otpContainer && otpContainer.classList.contains('hidden')) {
                        actionContainer.classList.remove('hidden');
                    }
                }
            }

            const regList = document.getElementById('dashboard-registrations');
            const bookList = document.getElementById('dashboard-bookings');

            // --- Skeleton Loader UI ---
            const skeletonHTML = `
                <div class="animate-pulse flex items-start gap-4 p-4 border-b border-slate-100 last:border-0 bg-white">
                    <div class="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0"></div>
                    <div class="flex-1 space-y-2 py-1 relative">
                        <div class="absolute right-0 top-0 w-16 h-4 bg-slate-100 rounded"></div>
                        <div class="h-4 bg-slate-100 rounded w-3/4"></div>
                        <div class="space-y-1 mt-2">
                            <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                            <div class="h-3 bg-slate-100 rounded w-1/4"></div>
                        </div>
                    </div>
                </div>
            `;
            if (regList) regList.innerHTML = skeletonHTML.repeat(2);
            if (bookList) bookList.innerHTML = skeletonHTML.repeat(2);

            try {
                // Fetch Registrations
                const regSnap = await fbDb.collection('eventRegistrations')
                    .where('userId', '==', currentUser.uid)
                    // .orderBy('registeredAt', 'desc') // Requires index
                    .get();

                const regDocs = regSnap.docs.sort((a, b) => {
                    const tA = a.data().registeredAt?.seconds || 0;
                    const tB = b.data().registeredAt?.seconds || 0;
                    return tB - tA;
                });

                renderUserItems(regDocs, regList, 'eventRegistrations', 'ticket');

                // Fetch Bookings
                const bookSnap = await fbDb.collection('boothBookings')
                    .where('userId', '==', currentUser.uid)
                    // .orderBy('bookedAt', 'desc') // Requires index
                    .get();

                const bookDocs = bookSnap.docs.sort((a, b) => {
                    const tA = a.data().bookedAt?.seconds || 0;
                    const tB = b.data().bookedAt?.seconds || 0;
                    return tB - tA;
                });

                renderUserItems(bookDocs, bookList, 'boothBookings', 'store');

            } catch (error) {
                console.error("Error loading dashboard:", error);
                if (regList) regList.innerHTML = '<div class="text-red-500 text-xs text-center">Error loading data</div>';
            }
        }

        function renderUserItems(snapshot, container, collectionName, icon) {
            if (!container) return;

            // Snapshot is an array of docs (sorted), so use .length
            if (snapshot.length === 0) {
                container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-300">No items found.</div>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.registeredAt
                    ? new Date(data.registeredAt.seconds * 1000).toLocaleDateString()
                    : (data.bookedAt ? new Date(data.bookedAt.seconds * 1000).toLocaleDateString() : 'N/A');

                const title = data.eventType || data.companyName || 'Unknown Item';
                const details = data.eventType ? `Topic: ${data.eventType}` : `Size: ${data.boothType || 'Standard'}`;

                const status = data.status || 'pending';
                let statusBadge = '';
                let actionBtn = '';

                if (status === 'confirmed' || status === 'approved') {
                    statusBadge = '<span class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">Approved</span>';

                    // Action button to download receipt
                    actionBtn = `<button onclick="generateReceipt('${doc.id}', '${collectionName}')" class="ml-auto mr-2 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full hover:bg-blue-100 transition flex items-center gap-1 font-bold shadow-sm"><i class="fa-solid fa-file-invoice"></i> ใบเสร็จ (PDF)</button>`;
                } else if (status === 'pending_payment') {
                    // Store registered time for real-time countdown
                    const registeredTime = data.registeredAt ? data.registeredAt.seconds * 1000 : Date.now();

                    statusBadge = `<span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Pending Payment</span> <span class="countdown-timer text-[9px] text-red-600 font-mono" data-registered-at="${registeredTime}">--:--</span>`;

                    let payAmount = data.amount;
                    // Fallback: Check PAID_TOPICS if amount is missing
                    if (!payAmount && window.PAID_TOPICS && window.PAID_TOPICS[data.eventType]) {
                        payAmount = window.PAID_TOPICS[data.eventType];
                        // Special case for Face Forward placeholder if somehow used
                        if (data.eventType === 'face-forward' && !payAmount) payAmount = 4500;
                    }
                    if (data.eventType === 'grand-opening' && !payAmount) payAmount = 4500;

                    // Fallback for Vendors if amount didn't save historically
                    if (!payAmount && collectionName === 'boothBookings') {
                        const size = (data.boothType || data.booth_size || '').toLowerCase();
                        if (size === 's' || size.includes('small') || size.includes('2x2')) payAmount = 20000;
                        else if (size === 'm' || size.includes('medium') || size.includes('3x3')) payAmount = 35000;
                        else if (size === 'l' || size.includes('large') || size.includes('3x6')) payAmount = 60000;
                    }

                    if (payAmount) {
                        // Use data attributes for robust event handling
                        actionBtn = `<button data-pay-id="${doc.id}" data-pay-amount="${payAmount}" data-pay-collection="${collectionName}" class="pay-now-btn ml-auto mr-2 text-xs bg-teal-500 text-white px-3 py-1 rounded-full hover:bg-teal-600 transition shadow-sm font-bold">Pay Now</button>`;
                    }
                } else if (status === 'waiting_approval') {
                    statusBadge = '<span class="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-bold">Waiting Approval</span>';
                } else if (status === 'rejected') {
                    statusBadge = '<span class="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">Rejected</span>';
                    let payAmount = data.amount;
                    if (!payAmount && window.PAID_TOPICS && window.PAID_TOPICS[data.eventType]) payAmount = window.PAID_TOPICS[data.eventType];
                    if (data.eventType === 'grand-opening' && !payAmount) payAmount = 4500;

                    if (!payAmount && collectionName === 'boothBookings') {
                        const size = (data.boothType || data.booth_size || '').toLowerCase();
                        if (size === 's' || size.includes('small') || size.includes('2x2')) payAmount = 20000;
                        else if (size === 'm' || size.includes('medium') || size.includes('3x3')) payAmount = 35000;
                        else if (size === 'l' || size.includes('large') || size.includes('3x6')) payAmount = 60000;
                    }

                    if (payAmount) {
                        actionBtn = `<button data-pay-id="${doc.id}" data-pay-amount="${payAmount}" data-pay-collection="${collectionName}" class="pay-now-btn ml-auto mr-2 text-xs bg-orange-500 text-white px-3 py-1 rounded-full hover:bg-orange-600 transition shadow-sm font-bold"><i class="fa-solid fa-redo mr-1"></i>Re-Submit</button>`;
                    }
                } else {
                    statusBadge = `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold capitalize">${status}</span>`;
                }

                // Conditional delete button - hide for waiting_approval to prevent accidental deletion
                let deleteBtn = '';
                if (status !== 'waiting_approval') {
                    deleteBtn = `<button onclick="cancelItem('${collectionName}', '${doc.id}')" class="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition text-xs">
                            <i class="fa-solid fa-trash"></i>
                        </button>`;
                }

                html += `
                    <div class="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center group hover:border-teal-200 transition ${data.eventType ? 'cursor-pointer event-detail-card' : ''}" ${data.eventType ? `data-event-type="${data.eventType}"` : ''}>
                        <div class="flex items-center gap-3 flex-1">
                            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-500 transition">
                                <i class="fa-solid fa-${icon}"></i>
                            </div>
                            <div>
                                <h6 class="text-sm font-bold text-slate-700 flex items-center gap-2">${title} ${statusBadge}</h6>
                                <p class="text-xs text-slate-500">${details} • ${date}</p>
                            </div>
                        </div>
                        ${actionBtn}
                        ${deleteBtn}
                    </div>
                    `;
            });
            container.innerHTML = html;

            // Attach click handlers to Pay Now buttons
            container.querySelectorAll('.pay-now-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    const regId = e.target.closest('.pay-now-btn').dataset.payId;
                    const amount = e.target.closest('.pay-now-btn').dataset.payAmount;
                    const collection = e.target.closest('.pay-now-btn').dataset.payCollection || 'eventRegistrations';
                    console.log('Pay Now clicked via event listener:', regId, amount, collection);
                    openPaymentModal(regId, parseInt(amount), collection);
                });
            });

            // Attach click handlers to event detail cards
            container.querySelectorAll('.event-detail-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    // Don't trigger if clicking buttons inside card
                    if (e.target.closest('button')) return;
                    const eventType = card.dataset.eventType;
                    showEventDetail(eventType);
                });
            });

            // Update countdown timers (lightweight, no dashboard reload)
            updateCountdownTimers();
        }

        // --- RECEIPT GENERATION LOGIC ---
        window.generateReceipt = async (docId, collectionName) => {
            try {
                // Show loading
                Swal.fire({
                    title: 'กำลังสร้างใบเสร็จ...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                // Fetch data
                const docSnap = await fbDb.collection(collectionName).doc(docId).get();
                if (!docSnap.exists) throw new Error("Document not found");
                const data = docSnap.data();

                // Format amounts
                let amount = data.amount || 0;
                if (!amount) {
                    if (collectionName === 'eventRegistrations' && window.PAID_TOPICS && window.PAID_TOPICS[data.eventType]) {
                        amount = window.PAID_TOPICS[data.eventType];
                    } else if (collectionName === 'boothBookings') {
                        const size = (data.boothType || data.booth_size || '').toLowerCase();
                        if (size === 's' || size.includes('small') || size.includes('2x2')) amount = 20000;
                        else if (size === 'm' || size.includes('medium') || size.includes('3x3')) amount = 35000;
                        else if (size === 'l' || size.includes('large') || size.includes('3x6')) amount = 60000;
                    }
                }

                const dateTimestamp = data.registeredAt ? data.registeredAt : (data.bookedAt ? data.bookedAt : null);
                const dateStr = dateTimestamp ? new Date(dateTimestamp.seconds * 1000).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('th-TH');

                const itemName = data.eventType ? `บัตรเข้าร่วมงาน: ${data.eventType}` : `บูธจัดแสดง: ${data.boothType || 'Standard'}`;
                const customerName = data.companyName || (window.currentUser ? window.currentUser.displayName : '') || data.name || 'ลูกค้าอ้างอิง';

                // Build HTML
                const printContent = `
                    <html>
                    <head>
                        <title>Receipt - ${docId}</title>
                        <style>
                            body { font-family: 'Sarabun', 'Tahome', sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                            .logo { font-size: 24px; font-weight: bold; color: #0f766e; }
                            .title { font-size: 20px; margin-top: 10px; }
                            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                            .details { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
                            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                            .table th, .table td { padding: 15px; border-bottom: 1px solid #ddd; text-align: left; }
                            .table th { background-color: #f8fafc; color: #475569; font-weight: bold; border-top: 2px solid #ddd; }
                            .total-row { font-weight: bold; font-size: 18px; }
                            .total-row td { border-top: 2px solid #333; }
                            .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 100px; border-top: 1px solid #eee; padding-top: 20px; }
                            @media print {
                                body { padding: 0; }
                                .details { border: 1px solid #000; }
                                .table th { background-color: transparent !important; border-bottom: 2px solid #000; border-top: 2px solid #000; }
                                .table td { border-bottom: 1px dotted #ccc; }
                                .total-row td { border-top: 2px solid #000; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="logo">DentX Innovation Center</div>
                            <div class="title">ใบเสร็จรับเงิน / Receipt</div>
                        </div>
                        <div class="details">
                            <div class="row">
                                <div><strong>เลขที่เอกสาร (No):</strong> ${docId.substring(0, 8).toUpperCase()}</div>
                                <div><strong>วันที่ (Date):</strong> ${dateStr}</div>
                            </div>
                            <div class="row">
                                <div><strong>ชื่อลูกค้า/บริษัท (Customer Name):</strong> ${customerName}</div>
                                <div><strong>สถานะ (Status):</strong> ชำระเงินแล้ว (Paid)</div>
                            </div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>รายการ (Description)</th>
                                    <th style="text-align: right;">จำนวนเงิน (Amount) THB</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${itemName}</td>
                                    <td style="text-align: right;">${amount.toLocaleString()}</td>
                                </tr>
                                <tr class="total-row">
                                    <td style="text-align: right;">ยอดชำระสุทธิ (Total):</td>
                                    <td style="text-align: right;">${amount.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="footer">
                            เอกสารฉบับนี้จัดทำขึ้นและประมวลผลโดยระบบคอมพิวเตอร์<br>
                            This is a computer-generated document. No signature is required.<br>
                            ผู้ออกใบเสร็จ: มหาวิทยาลัยเนชั่น (Nation University)
                        </div>
                    </body>
                    </html>
                `;

                Swal.close();

                // Open print window
                const printWin = window.open('', '', 'width=800,height=800');
                printWin.document.open();
                printWin.document.write(printContent);
                printWin.document.close();

                // Focus and print after resources load
                setTimeout(() => {
                    printWin.focus();
                    printWin.print();
                }, 500);

            } catch (e) {
                console.error("Receipt error:", e);
                Swal.fire('Error', 'ไม่สามารถสร้างใบเสร็จได้', 'error');
            }
        };

        // Lightweight countdown update function
        window.updateCountdownTimers = () => {
            const timers = document.querySelectorAll('.countdown-timer');
            let hasExpired = false;
            timers.forEach(timer => {
                const registeredAt = parseInt(timer.dataset.registeredAt);
                if (!registeredAt) return;

                const expiryTime = registeredAt + (10 * 60 * 1000); // +10 minutes
                const now = Date.now();
                const remainingMs = expiryTime - now;

                if (remainingMs > 0) {
                    const remainingMinutes = Math.floor(remainingMs / 60000);
                    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
                    timer.innerHTML = `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                    // Color warning: red when < 2 min
                    if (remainingMs < 120000) {
                        timer.classList.add('animate-pulse');
                    }
                } else {
                    timer.innerHTML = 'Deleting...';
                    timer.classList.add('font-bold');
                    hasExpired = true;
                }
            });

            // If any timer expired, trigger cleanup immediately
            if (hasExpired && !window._cleanupRunning) {
                window._cleanupRunning = true;
                cleanupExpiredPendingPayments().then(() => {
                    window._cleanupRunning = false;
                });
            }
        };

        // Start real-time countdown updates (every second)
        if (!window.countdownInterval) {
            window.countdownInterval = setInterval(() => {
                updateCountdownTimers();
            }, 1000);
        }

        // ===== EVENT DETAIL DATA =====
        const EVENT_DETAILS = {
            'grand-opening': {
                title: 'GRAND OPENING ONSITE: Face-Forward Soft Tissue Driven Orthodontics & Digital Dentistry Paradigm',
                titleTh: 'GRAND OPENING ONSITE: Face-Forward Soft Tissue Driven Orthodontics & Digital Dentistry Paradigm',
                date: '20 March 2026',
                dateTh: '20 มีนาคม 2569',
                location: 'ศูนย์ DentX ม.เนชั่น เชียงใหม่',
                price: '4,500 THB',
                icon: 'fa-ribbon',
                color: 'orange',
                calendarDate: '20260320',
                schedule: [
                    { time: '08:30 - 09:00', title: 'Registration', titleTh: 'ลงทะเบียน', icon: 'fa-file-signature' },
                    { time: '09:00 - 10:00', title: 'Opening Ceremony & Facility Tour', titleTh: 'พิธีเปิด & เยี่ยมชม 3D Printing Lab', icon: 'fa-ribbon' },
                    { time: '10:30 - 12:00', title: 'Innovation Talk: Future of Dentistry', titleTh: 'บรรยายพิเศษโดย Speaker ผู้เชี่ยวชาญ', icon: 'fa-microphone' },
                    { time: '13:00 - 15:00', title: 'Seminar: Face-Forward Approach', titleTh: 'เจาะลึกเทคนิค Face-Forward', icon: 'fa-tooth' }
                ]
            },
            'conference': {
                title: 'Conference (Academic)',
                titleTh: 'งานประชุมวิชาการ',
                date: '28 December 2024',
                dateTh: '28 ธันวาคม 2567',
                location: 'DentX Innovation Center, Nation University',
                price: 'Free',
                icon: 'fa-chalkboard-teacher',
                color: 'blue',
                calendarDate: '20241228',
                schedule: [
                    { time: '08:30 - 09:00', title: 'Registration', titleTh: 'ลงทะเบียน', icon: 'fa-file-signature' },
                    { time: '09:00 - 12:00', title: 'Academic Conference Sessions', titleTh: 'การนำเสนอผลงานวิชาการ', icon: 'fa-chalkboard-teacher' },
                    { time: '13:00 - 15:00', title: 'Panel Discussion & Networking', titleTh: 'อภิปรายและสร้างเครือข่าย', icon: 'fa-users' }
                ]
            },
            'workshop': {
                title: 'Hands-on Workshop',
                titleTh: 'Workshop ฝึกปฏิบัติ',
                date: '28 December 2024',
                dateTh: '28 ธันวาคม 2567',
                location: 'DentX Innovation Center, Nation University',
                price: 'Free',
                icon: 'fa-hand-holding-medical',
                color: 'green',
                calendarDate: '20241228',
                schedule: [
                    { time: '08:30 - 09:00', title: 'Registration', titleTh: 'ลงทะเบียน', icon: 'fa-file-signature' },
                    { time: '09:00 - 12:00', title: 'Hands-on Workshop Session', titleTh: 'ฝึกปฏิบัติจริงกับเครื่องมือทันตกรรม', icon: 'fa-hand-holding-medical' },
                    { time: '13:00 - 15:00', title: 'Practice & Review', titleTh: 'ฝึกซ้อมและทบทวน', icon: 'fa-clipboard-check' }
                ]
            },
            'innovation': {
                title: 'Innovation Helper',
                titleTh: 'Innovation Helper',
                date: '28 December 2024',
                dateTh: '28 ธันวาคม 2567',
                location: 'DentX Innovation Center, Nation University',
                price: 'Free',
                icon: 'fa-lightbulb',
                color: 'purple',
                calendarDate: '20241228',
                schedule: [
                    { time: '08:30 - 09:00', title: 'Registration', titleTh: 'ลงทะเบียน', icon: 'fa-file-signature' },
                    { time: '09:00 - 12:00', title: 'Innovation Lab Experience', titleTh: 'สัมผัส Innovation Lab & 3D Printing', icon: 'fa-lightbulb' },
                    { time: '13:00 - 15:00', title: 'Collaboration & Support', titleTh: 'ร่วมทำงานและสนับสนุนกิจกรรม', icon: 'fa-handshake' }
                ]
            }
        };

        window.showEventDetail = (eventType) => {
            const event = EVENT_DETAILS[eventType];
            if (!event) {
                Swal.fire({ icon: 'info', title: 'Event Details', text: `Event: ${eventType}`, background: '#fff' });
                return;
            }

            const colorMap = { orange: '#F97316', blue: '#3B82F6', green: '#10B981', purple: '#8B5CF6' };
            const accentColor = colorMap[event.color] || '#2EC4B6';

            // Build schedule HTML
            let scheduleHtml = event.schedule.map(s => `
                        <div class="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background: ${accentColor}15; color: ${accentColor}">
                                <i class="fa-solid ${s.icon} text-xs"></i>
                            </div>
                            <div class="flex-1">
                                <span class="font-bold text-xs" style="color: ${accentColor}">${s.time}</span>
                                <p class="text-sm font-semibold text-slate-700">${s.title}</p>
                                <p class="text-xs text-slate-400">${s.titleTh}</p>
                            </div>
                        </div>
                    `).join('');

            // Google Calendar URL
            const gcalStart = event.calendarDate + 'T013000Z'; // 08:30 Thailand = 01:30 UTC
            const gcalEnd = event.calendarDate + 'T080000Z';   // 15:00 Thailand = 08:00 UTC
            const gcalTitle = encodeURIComponent(event.title);
            const gcalLocation = encodeURIComponent(event.location);
            const gcalDetails = encodeURIComponent(event.schedule.map(s => `${s.time} - ${s.title}`).join('\\n'));
            const googleCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}&details=${gcalDetails}&location=${gcalLocation}&sf=true`;

            Swal.fire({
                html: `
                            <div class="text-left">
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: ${accentColor}20; color: ${accentColor}">
                                        <i class="fa-solid ${event.icon} text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg text-slate-800 leading-tight">${event.title}</h3>
                                        <p class="text-sm text-slate-400">${event.titleTh}</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-2 mb-4">
                                    <div class="bg-slate-50 p-3 rounded-xl text-center">
                                        <i class="fa-solid fa-calendar-day text-lg mb-1" style="color: ${accentColor}"></i>
                                        <p class="text-xs font-bold text-slate-700">${event.dateTh}</p>
                                        <p class="text-[10px] text-slate-400">${event.date}</p>
                                    </div>
                                    <div class="bg-slate-50 p-3 rounded-xl text-center">
                                        <i class="fa-solid fa-location-dot text-lg mb-1" style="color: ${accentColor}"></i>
                                        <p class="text-xs font-bold text-slate-700">Nation University</p>
                                        <p class="text-[10px] text-slate-400">DentX Innovation Center</p>
                                    </div>
                                </div>

                                <div class="bg-slate-50 p-3 rounded-xl mb-4">
                                    <h4 class="font-bold text-sm text-slate-700 mb-2"><i class="fa-solid fa-clock mr-1" style="color: ${accentColor}"></i> Schedule</h4>
                                    ${scheduleHtml}
                                </div>

                                <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl mb-4">
                                    <div>
                                        <span class="text-xs text-slate-400">Registration Fee</span>
                                        <p class="font-bold text-lg" style="color: ${accentColor}">${event.price}</p>
                                    </div>
                                    <span class="text-[10px] px-3 py-1 rounded-full font-bold" style="background: ${accentColor}15; color: ${accentColor}">
                                        ${event.price === 'Free' ? 'No Charge' : 'Paid Event'}
                                    </span>
                                </div>

                                <div class="flex gap-2">
                                    <a href="${googleCalUrl}" target="_blank" 
                                       class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90 hover:scale-[1.02]"
                                       style="background: ${accentColor}">
                                        <i class="fa-solid fa-calendar-plus"></i> Add to Google Calendar
                                    </a>
                                    <button onclick="downloadICS('${eventType}')"
                                       class="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition hover:scale-[1.02]"
                                       style="border-color: ${accentColor}; color: ${accentColor}">
                                        <i class="fa-solid fa-download"></i> .ics
                                    </button>
                                </div>
                            </div>
                        `,
                showConfirmButton: false,
                showCloseButton: true,
                width: '420px',
                padding: '1.5rem',
                customClass: { popup: 'rounded-2xl' }
            });
        };

        // Download .ics file for Apple Calendar / Outlook
        window.downloadICS = (eventType) => {
            const event = EVENT_DETAILS[eventType];
            if (!event) return;

            const scheduleText = event.schedule.map(s => `${s.time} - ${s.title}`).join('\\n');
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//DentX//Event//EN',
                'BEGIN:VEVENT',
                `DTSTART:${event.calendarDate}T013000Z`,
                `DTEND:${event.calendarDate}T080000Z`,
                `SUMMARY:${event.title}`,
                `DESCRIPTION:${scheduleText}`,
                `LOCATION:${event.location}`,
                'STATUS:CONFIRMED',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DentX_${eventType}.ics`;
            a.click();
            URL.revokeObjectURL(url);
        };

        window.cancelItem = async (collection, id) => {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "Do you want to cancel this item?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#cbd5e1',
                confirmButtonText: 'Yes, cancel it!'
            });

            if (result.isConfirmed) {
                try {
                    await fbDb.collection(collection).doc(id).delete();
                    Swal.fire('Cancelled!', 'Your item has been cancelled.', 'success');
                    loadUserDashboard(); // Reload data
                } catch (error) {
                    console.error("Error deleting:", error);
                    Swal.fire('Error', 'Could not cancel item.', 'error');
                }
            }
        };
