// --- AUTHENTICATION FUNCTIONS ---
let currentUser = null;


// Update UI for logged-in user
window.updateUIForLoggedInUser = (user) => {
    if (!user) return;

    // Update navbar button
    const navLoginBtn = document.getElementById('nav-login-btn');
    if (navLoginBtn) {
        navLoginBtn.innerHTML = '<i class="fa-solid fa-user-check text-[#2EC4B6] mr-1"></i> ' +
            (document.documentElement.lang === 'en' ? 'Member' : 'สมาชิก');
    }

    // Add member class to body
    document.body.classList.add('is-member');

    // Re-render courses if available
    if (window.renderCourses) {
        window.renderCourses();
    }

    // Store current user globally
    window.currentUser = user;
};

// --- PASSWORD STRENGTH LOGIC ---
window.isPasswordValid = false;
window.checkPasswordStrength = (password) => {
    let strength = 0;
    const criteria = {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password)
    };

    // Update UI Checklist
    const updateChecklist = (id, isValid) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (isValid) {
            el.classList.add('text-green-600');
            el.classList.remove('text-slate-500');
            el.innerHTML = '<i class="fa-solid fa-check-circle text-[8px] text-green-500 mr-1"></i>' + el.innerText.trim();
        } else {
            el.classList.remove('text-green-600');
            el.classList.add('text-slate-500');
            el.innerHTML = '<i class="fa-solid fa-circle text-[6px] text-slate-300 mr-1"></i>' + el.innerText.trim();
        }
    };

    updateChecklist('crit-length', criteria.length);
    updateChecklist('crit-lower', criteria.lower);
    updateChecklist('crit-upper', criteria.upper);
    updateChecklist('crit-number', criteria.number);

    // Calculate Strength Score
    if (criteria.length) strength++;
    if (criteria.lower) strength++;
    if (criteria.upper) strength++;
    if (criteria.number) strength++;

    // At least 4 rules met = Valid Password (Medium/Strong)
    window.isPasswordValid = Object.values(criteria).every(v => v === true);

    // Update UI Bars and Text
    const bar1 = document.getElementById('pw-strength-bar-1');
    const bar2 = document.getElementById('pw-strength-bar-2');
    const bar3 = document.getElementById('pw-strength-bar-3');
    const text = document.getElementById('password-strength-text');

    if (!password) {
        bar1.className = 'h-full w-1/3 bg-slate-200 transition-all duration-300';
        bar2.className = 'h-full w-1/3 border-l border-white bg-slate-200 transition-all duration-300';
        bar3.className = 'h-full w-1/3 border-l border-white bg-slate-200 transition-all duration-300';
        text.innerText = 'กรุณากรอกรหัสผ่าน';
        text.className = 'text-[10px] font-bold text-slate-400';
        return;
    }

    if (strength <= 2) {
        // Weak
        bar1.className = 'h-full w-1/3 bg-red-500 transition-all duration-300';
        bar2.className = 'h-full w-1/3 border-l border-white bg-slate-200 transition-all duration-300';
        bar3.className = 'h-full w-1/3 border-l border-white bg-slate-200 transition-all duration-300';
        text.innerText = 'อ่อนแอ (Weak)';
        text.className = 'text-[10px] font-bold text-red-500';
    } else if (strength === 3) {
        // Medium
        bar1.className = 'h-full w-1/3 bg-yellow-400 transition-all duration-300';
        bar2.className = 'h-full w-1/3 border-l border-white bg-yellow-400 transition-all duration-300';
        bar3.className = 'h-full w-1/3 border-l border-white bg-slate-200 transition-all duration-300';
        text.innerText = 'ปานกลาง (Medium)';
        text.className = 'text-[10px] font-bold text-yellow-500';
    } else if (strength >= 4) {
        // Strong
        bar1.className = 'h-full w-1/3 bg-green-500 transition-all duration-300';
        bar2.className = 'h-full w-1/3 border-l border-white bg-green-500 transition-all duration-300';
        bar3.className = 'h-full w-1/3 border-l border-white bg-green-500 transition-all duration-300';
        text.innerText = 'ปลอดภัย (Strong)';
        text.className = 'text-[10px] font-bold text-green-600';
    }
};

// Sign Up Handler
window.handleSignUp = async (e) => {
    e.preventDefault();

    // Get values from form fields by ID
    const displayName = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phoneNumber = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    // Validate password strength
    if (!window.isPasswordValid) {
        Swal.fire({
            icon: 'warning',
            title: 'รหัสผ่านไม่ปลอดภัย',
            text: 'กรุณาตั้งรหัสผ่านให้ตรงตามเงื่อนไขความปลอดภัยที่กำหนด',
            confirmButtonColor: '#F77F00'
        });
        return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'รหัสผ่านไม่ตรงกัน',
            text: 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง',
            confirmButtonColor: '#2EC4B6'
        });
        return;
    }

    try {
        // Create user account
        const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update profile
        await user.updateProfile({
            displayName: displayName
        });

        // Save additional user data to Firestore
        await fbDb.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: displayName,
            phoneNumber: phoneNumber,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'member',
            phoneVerified: false
        });

        Swal.fire({
            icon: 'success',
            title: 'สร้างบัญชีสำเร็จ!',
            text: 'ระบบได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (โปรดตรวจสอบในกล่องจดหมายขยะ/Spam)',
            confirmButtonColor: '#2EC4B6'
        });

        closeAccessModal();
        document.getElementById('form-signup').reset();
        window.checkPasswordStrength(''); // Reset the strength UI to default

        // Send email verification and sign out immediately
        await user.sendEmailVerification();
        await fbAuth.signOut();
    } catch (error) {
        console.error("Sign up error:", error);
        let errorMessage = 'เกิดข้อผิดพลาดในการสร้างบัญชี';

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        }

        Swal.fire({
            icon: 'error',
            title: 'สร้างบัญชีไม่สำเร็จ',
            text: errorMessage,
            confirmButtonColor: '#F77F00'
        });
    }
};

// --- FORGOT PASSWORD LOGIC ---
window.promptForgotPassword = async () => {
    const { value: email } = await Swal.fire({
        title: 'ลืมรหัสผ่าน?',
        text: "กรุณากรอกอีเมลที่ใช้สมัครสมาชิกเพื่อตั้งรหัสผ่านใหม่",
        input: 'email',
        inputPlaceholder: 'อีเมลของคุณ',
        showCancelButton: true,
        confirmButtonText: 'ส่งลิงก์',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#0f766e',
        cancelButtonColor: '#94a3b8',
        inputValidator: (value) => {
            if (!value) {
                return 'กรุณากรอกอีเมล'
            }
        }
    });

    if (email) {
        Swal.fire({
            title: 'กำลังส่ง...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            await fbAuth.sendPasswordResetEmail(email);
            Swal.fire({
                icon: 'success',
                title: 'ส่งอีเมลสำเร็จ',
                text: 'ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล (รวมถึงโฟลเดอร์จดหมายขยะ)',
            });
        } catch (error) {
            console.error("Password Reset Error:", error);
            let errMsg = "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่ภายหลัง";
            if (error.code === 'auth/user-not-found') {
                errMsg = "ไม่พบอีเมลนี้ในระบบ ลงทะเบียนผู้ใช้งานใหม่ก่อนเข้าสู่ระบบ";
            } else if (error.code === 'auth/invalid-email') {
                errMsg = "รูปแบบอีเมลไม่ถูกต้อง";
            }
            Swal.fire({
                icon: 'error',
                title: 'ส่งอีเมลไม่สำเร็จ',
                text: errMsg,
            });
        }
    }
};

// Login Handler
window.handleLoginWithEmail = async (e) => {
    e.preventDefault();
    const form = e.target;

    // Safely extract from either ID or form element to prevent undefined crashes
    const emailInput = document.getElementById('username') || form.email;
    const passwordInput = document.getElementById('password') || form.password;

    if (!emailInput || !passwordInput) {
        console.error("Login Error: Cannot find email/username or password input fields.");
        return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    // ===== ADMIN CHECK =====
    if (email === 'admin@admin' && password === 'admin1234') {
        sessionStorage.setItem('isAdmin', 'true');
        Swal.fire({
            icon: 'success',
            title: 'Welcome Admin!',
            text: 'Redirecting to Dashboard...',
            timer: 1200,
            showConfirmButton: false,
            background: '#05201A',
            color: '#fff'
        }).then(() => {
            closeAccessModal();
            form.reset();
            window.location.href = 'admin.html';
        });
        return;
    }

    try {
        // Check brute-force lock first via localStorage (Frontend Free-tier logic)
        const lsKey = `login_attempts_${email}`;
        let attemptsData = JSON.parse(localStorage.getItem(lsKey) || '{"attempts":0, "lockedUntil":null}');

        if (attemptsData.lockedUntil && new Date(attemptsData.lockedUntil) > new Date()) {
            const lockTime = new Date(attemptsData.lockedUntil).toLocaleTimeString();
            Swal.fire({
                icon: 'error',
                title: 'บัญชีถูกระงับชั่วคราว',
                text: `พยายามเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณาลองใหม่เวลา ${lockTime}`,
                confirmButtonColor: '#F77F00'
            });
            return;
        }
        const userCredential = await fbAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            await fbAuth.signOut();
            Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยันอีเมล',
                text: 'คุณต้องยืนยันตัวตนผ่านลิงก์ในอีเมลก่อนเข้าสู่ระบบ หากหาไม่พบโปรดตรวจสอบในกล่องจดหมายขยะ (Spam)',
                confirmButtonText: 'รับลิงก์ยืนยันอีกครั้ง',
                showCancelButton: true,
                cancelButtonText: 'ปิด',
                confirmButtonColor: '#0f766e',
                cancelButtonColor: '#94a3b8'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({ title: 'กำลังส่ง...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    try {
                        const tempCredential = await fbAuth.signInWithEmailAndPassword(email, password); // Temporarily login to send
                        await tempCredential.user.sendEmailVerification();
                        await fbAuth.signOut();
                        Swal.fire('สำเร็จ', 'ส่งลิงก์ยืนยันไปที่อีเมลใหม่แล้ว', 'success');
                    } catch (err) {
                        console.error("Resend verification error:", err);
                        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง หรือรอสักครู่หากส่งบ่อยเกินไป', 'error');
                    }
                }
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ!',
            text: 'ระบบกำลังพาท่านไปยังหน้าต่างจัดการข้อมูล...',
            confirmButtonColor: '#2EC4B6',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            // Automatically open dashboard after login
            if (typeof window.openDashboardModal === 'function') {
                window.openDashboardModal();
            }
        });

        closeAccessModal();
        form.reset();

        // Record success - Clear brute force tracker
        localStorage.removeItem(`login_attempts_${email}`);

    } catch (error) {
        console.error("Login error:", error);
        let errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'ไม่พบบัญชีผู้ใช้นี้';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'รหัสผ่านไม่ถูกต้อง';
        }

        Swal.fire({
            icon: 'error',
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            text: errorMessage,
            confirmButtonColor: '#F77F00'
        });

        // Record failure in localStorage
        try {
            const lsKey = `login_attempts_${email}`;
            let attemptsData = JSON.parse(localStorage.getItem(lsKey) || '{"attempts":0, "lockedUntil":null}');
            attemptsData.attempts += 1;

            if (attemptsData.attempts >= 5) {
                // Lock for 15 minutes
                const lockedUntil = new Date();
                lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
                attemptsData.lockedUntil = lockedUntil.toISOString();

                const lockTime = lockedUntil.toLocaleTimeString();
                Swal.fire({
                    icon: 'error',
                    title: 'บัญชีถูกระงับชั่วคราว',
                    text: `พยายามเข้าสู่ระบบผิดพลาด 5 ครั้ง กรุณาลองใหม่เวลา ${lockTime}`,
                    confirmButtonColor: '#F77F00'
                });
            }
            localStorage.setItem(lsKey, JSON.stringify(attemptsData));
        } catch (e) {
            console.error("Failed to record login attempt", e);
        }
    }
};

// Logout Handler
window.handleLogout = async () => {
    try {
        await fbAuth.signOut();
        Swal.fire({
            icon: 'success',
            title: 'ออกจากระบบสำเร็จ',
            confirmButtonColor: '#2EC4B6',
            timer: 1500
        });
    } catch (error) {
        console.error("Logout error:", error);
    }
};

// Update UI based on auth state
function updateUIForUser(user) {
    currentUser = user;
    const loginBtn = document.getElementById('nav-login-btn');
    const tabBtnLogin = document.getElementById('tab-btn-login');
    const tabBtnSignup = document.getElementById('tab-btn-signup');
    const tabBtnDashboard = document.getElementById('tab-btn-dashboard');
    const tabBtnAttendee = document.getElementById('tab-btn-attendee');
    const tabBtnVendor = document.getElementById('tab-btn-vendor');

    if (user) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fa-solid fa-user-circle mr-1"></i> My Dashboard`;
            loginBtn.onclick = () => {
                // openAccessModal('dashboard'); // OLD
                openDashboardModal(); // NEW
            };
        }

        // Show Dashboard & Service Tabs, Hide Auth Tabs
        if (tabBtnLogin) tabBtnLogin.style.display = 'none';
        if (tabBtnSignup) tabBtnSignup.style.display = 'none';

        if (tabBtnDashboard) tabBtnDashboard.style.display = 'block';
        if (tabBtnAttendee) tabBtnAttendee.style.display = 'block';
        if (tabBtnVendor) tabBtnVendor.style.display = 'block';

        document.body.classList.add('is-member');
    } else {
        // User is logged out
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fa-regular fa-user mr-1"></i> <span data-i18n="nav_login">เข้าสู่ระบบ</span>';
            loginBtn.onclick = () => openAccessModal('login');
        }

        // Show Auth Tabs, Hide Service Tabs
        if (tabBtnLogin) tabBtnLogin.style.display = 'block';
        if (tabBtnSignup) tabBtnSignup.style.display = 'block';

        if (tabBtnDashboard) tabBtnDashboard.style.display = 'none';
        if (tabBtnAttendee) tabBtnAttendee.style.display = 'none';
        if (tabBtnVendor) tabBtnVendor.style.display = 'none';

        document.body.classList.remove('is-member');
    }
}
