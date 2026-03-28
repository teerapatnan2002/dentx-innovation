// Dashboard Modal Control Functions
window.openDashboardModal = async () => {
    const modal = document.getElementById('modal-dashboard');
    const panel = document.getElementById('dashboard-panel');

    if (!modal || !panel) return;

    // Load dashboard data first
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        await loadUserDashboard();
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        panel.classList.remove('translate-x-full');
        panel.classList.add('translate-x-0');
    }, 10);
};

window.closeDashboardModal = () => {
    const modal = document.getElementById('modal-dashboard');
    const panel = document.getElementById('dashboard-panel');

    if (!panel) return;

    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');

    setTimeout(() => {
        if (modal) modal.classList.add('hidden');
    }, 300);
};

window.logout = async () => {
    try {
        await window.fbAuth.signOut();
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
