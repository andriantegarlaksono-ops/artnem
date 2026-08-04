// --- Indonesian Month Names ---
const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// --- Initial Mock Data ---
const DEFAULT_MEMBERS = [
    { id: 'member_1', name: 'Budi Santoso', phone: '081234567890', billAmount: 50000, createdAt: '2026-08-01T12:00:00.000Z' },
    { id: 'member_2', name: 'Siti Rahma', phone: '08551234567', billAmount: 50000, createdAt: '2026-08-01T12:05:00.000Z' },
    { id: 'member_3', name: 'Agus Prasetyo', phone: '081987654321', billAmount: 75000, createdAt: '2026-08-01T12:10:00.000Z' },
    { id: 'member_4', name: 'Dewi Lestari', phone: '081122334455', billAmount: 50000, createdAt: '2026-08-01T12:15:00.000Z' },
    { id: 'member_5', name: 'Joko Widodo', phone: '081399887766', billAmount: 100000, createdAt: '2026-08-01T12:20:00.000Z' }
];

const DEFAULT_PAYMENTS = [
    { id: 'pay_1', memberId: 'member_1', period: '2026-08', amount: 50000, paidDate: '2026-08-01', notes: 'Cash ke RT' },
    { id: 'pay_2', memberId: 'member_2', period: '2026-08', amount: 50000, paidDate: '2026-08-02', notes: 'Transfer Mandiri' }
];

const DEFAULT_SETTINGS = {
    waTemplate: "Halo {nama},\n\nKami menginfokan tagihan iuran bulanan RT 06 (Artnem) untuk periode {bulan} sebesar {nominal}.\n\nPembayaran dapat ditransfer ke Rekening BNI 1234567890 a.n. Bendahara RT 06, atau diserahkan secara tunai.\n\nMohon abaikan pesan ini jika Anda sudah membayar. Terima kasih!\n\n-- Pengurus RT 06",
    selectedMonth: '2026-08',
    targetAmount: 300000
};

// --- Application State ---
let state = {
    members: [],
    payments: [],
    settings: {},
    activePeriod: '2026-08'
};

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
const TOAST_ICONS = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.info}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================
// CUSTOM CONFIRM DIALOG
// ============================================================
let _confirmResolver = null;

function showConfirm(title, message, okLabel = 'Ya, Lanjutkan') {
    return new Promise((resolve) => {
        _confirmResolver = resolve;
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('btn-confirm-ok').textContent = okLabel;
        document.getElementById('modal-confirm').classList.add('open');
    });
}

function closeConfirmModal(result) {
    document.getElementById('modal-confirm').classList.remove('open');
    if (_confirmResolver) {
        _confirmResolver(result);
        _confirmResolver = null;
    }
}

// ============================================================
// AVATAR HELPER
// ============================================================
const AVATAR_COLORS = [
    '#6366f1','#10b981','#3b82f6','#f59e0b','#ef4444',
    '#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316'
];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function makeAvatar(name) {
    const initials = name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const color = getAvatarColor(name);
    return `<span class="member-avatar" style="background:${color}">${initials}</span>`;
}

// ============================================================
// ANIMATE COUNTER
// ============================================================
function animateCounter(el, endValue, prefix = '', suffix = '', duration = 600) {
    const startTime = performance.now();
    const startValue = 0;
    const isNumeric = typeof endValue === 'number';
    if (!isNumeric) { el.textContent = prefix + endValue + suffix; return; }

    el.classList.remove('animate-pop');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('animate-pop');

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(startValue + (endValue - startValue) * eased);
        el.textContent = prefix + current.toLocaleString('id-ID') + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// --- Helper Functions ---

// Formatting Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Formatting YYYY-MM into "Month Year" in Indonesian
function formatPeriod(periodStr) {
    if (!periodStr) return '';
    const [year, month] = periodStr.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTH_NAMES[monthIndex]} ${year}`;
}

// Formatting YYYY-MM-DD into Indonesian Date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${MONTH_NAMES[monthIndex]} ${year}`;
}

// Clean Phone Number for WhatsApp Link
function cleanPhoneNumber(phone) {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }
    return clean;
}

// Parse WhatsApp Template with details
function parseTemplate(template, memberName, amount, periodName) {
    return template
        .replace(/{nama}/g, memberName)
        .replace(/{nominal}/g, formatRupiah(amount))
        .replace(/{bulan}/g, periodName);
}

// Save state to LocalStorage
function saveStateToLocalStorage() {
    localStorage.setItem('artnem_members', JSON.stringify(state.members));
    localStorage.setItem('artnem_payments', JSON.stringify(state.payments));
    localStorage.setItem('artnem_settings', JSON.stringify(state.settings));
}

// Load state from LocalStorage or fallback to mock defaults
function loadState() {
    const storedMembers = localStorage.getItem('artnem_members');
    const storedPayments = localStorage.getItem('artnem_payments');
    const storedSettings = localStorage.getItem('artnem_settings');

    if (storedMembers && storedPayments && storedSettings) {
        state.members = JSON.parse(storedMembers);
        state.payments = JSON.parse(storedPayments);
        state.settings = JSON.parse(storedSettings);
        if (state.settings.targetAmount === undefined) {
            state.settings.targetAmount = 300000;
        }
    } else {
        // Initialize with default mock data
        state.members = DEFAULT_MEMBERS;
        state.payments = DEFAULT_PAYMENTS;
        state.settings = DEFAULT_SETTINGS;
        saveStateToLocalStorage();
    }
    
    state.activePeriod = state.settings.selectedMonth || '2026-08';
}

// Populate period select options dynamically (from 2025 to 2027)
function initPeriodOptions() {
    const select = document.getElementById('global-period');
    select.innerHTML = '';
    
    // Generate options from Jan 2025 to Dec 2027
    for (let year = 2025; year <= 2027; year++) {
        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const value = `${year}-${monthStr}`;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = formatPeriod(value);
            
            if (value === state.activePeriod) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }

    select.addEventListener('change', (e) => {
        state.activePeriod = e.target.value;
        state.settings.selectedMonth = state.activePeriod;
        saveStateToLocalStorage();
        renderAll();
    });
}

// --- Navigation Tabs Control ---
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const subtitles = {
        dashboard: "Ringkasan status iuran RT 06",
        members: "Kelola daftar warga dan besaran iuran bulanan",
        payments: "Catat pembayaran iuran bulanan warga",
        'wa-bills': "Buat dan kirim pesan tagihan via WhatsApp manual",
        backup: "Ekspor database ke komputer Anda atau impor file cadangan"
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');

            // Set nav active
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Set panel active
            tabPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            // Change Titles
            pageTitle.textContent = item.querySelector('span').textContent;
            pageSubtitle.textContent = subtitles[targetTab] || '';

            // Auto focus or action updates on tab change
            if (targetTab === 'wa-bills') {
                updateTemplatePreview();
            }
        });
    });
}

// --- Render Views ---

function renderAll() {
    renderDashboard();
    renderMembersTable();
    renderPaymentsRegistryTable();
    renderWaUnpaidTable();
}

// 1. Dashboard Tab
function renderDashboard() {
    const activePeriodName = formatPeriod(state.activePeriod);
    document.getElementById('stat-period-name').textContent = activePeriodName;
    const targetAmount = state.settings.targetAmount || 300000;

    // Calculations
    const totalMembers = state.members.length;

    // Filter payments for this month
    const activePayments = state.payments.filter(p => p.period === state.activePeriod);

    // Classify each member
    let lunasCount = 0, partialCount = 0, noBayarCount = 0;
    state.members.forEach(member => {
        const memberPayments = activePayments.filter(p => p.memberId === member.id);
        const totalPaid = memberPayments.reduce((sum, p) => sum + parseInt(p.amount, 10), 0);
        if (totalPaid >= targetAmount) lunasCount++;
        else if (totalPaid > 0) partialCount++;
        else noBayarCount++;
    });
    const belumLunasCount = totalMembers - lunasCount;

    const paidPercentage = totalMembers > 0 ? Math.round((lunasCount / totalMembers) * 100) : 0;
    const unpaidPercentage = totalMembers > 0 ? Math.round((belumLunasCount / totalMembers) * 100) : 0;

    // Total Collected
    const totalCollected = activePayments.reduce((sum, p) => sum + parseInt(p.amount, 10), 0);

    // Animate counters
    animateCounter(document.getElementById('stat-total-members'), totalMembers);
    animateCounter(document.getElementById('stat-paid-count'), lunasCount);
    animateCounter(document.getElementById('stat-unpaid-count'), belumLunasCount);

    // Rupiah counter for total collected
    const collectedEl = document.getElementById('stat-total-collected');
    collectedEl.classList.remove('animate-pop');
    void collectedEl.offsetWidth;
    collectedEl.classList.add('animate-pop');
    collectedEl.textContent = formatRupiah(totalCollected);

    document.getElementById('stat-paid-percentage').textContent = `${paidPercentage}% dari total`;
    document.getElementById('stat-unpaid-percentage').textContent = `${unpaidPercentage}% dari total`;

    // Progress Bar
    const progressFill = document.getElementById('dashboard-progress-fill');
    progressFill.style.width = `${paidPercentage}%`;
    document.getElementById('dashboard-progress-text').textContent = `${paidPercentage}% Selesai`;
    document.getElementById('dashboard-progress-detail').textContent = `${lunasCount} dari ${totalMembers} Anggota Lunas`;

    // Populate target amount input
    const targetInput = document.getElementById('dashboard-target-amount');
    if (targetInput) targetInput.value = targetAmount;

    // Donut Chart
    renderDonutChart(lunasCount, partialCount, noBayarCount, totalMembers, paidPercentage);

    // Recent Payments
    const recentTableBody = document.querySelector('#table-recent-payments tbody');
    recentTableBody.innerHTML = '';
    const sortedPayments = [...state.payments].sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    const recentList = sortedPayments.slice(0, 5);

    if (recentList.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada data pembayaran terbaru</td></tr>';
    } else {
        recentList.forEach(pay => {
            const member = state.members.find(m => m.id === pay.memberId);
            const memberName = member ? member.name : '[Anggota Terhapus]';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Nama Anggota"><strong>${memberName}</strong> <span class="text-muted" style="font-size:0.8rem">(${formatPeriod(pay.period)})</span></td>
                <td data-label="Nominal" class="text-emerald font-weight-600">${formatRupiah(pay.amount)}</td>
                <td data-label="Tanggal">${formatDate(pay.paidDate)}</td>
                <td data-label="Catatan"><span class="text-muted">${pay.notes || '-'}</span></td>
            `;
            recentTableBody.appendChild(row);
        });
    }
}

// Donut Chart Renderer
function renderDonutChart(lunas, partial, noBayar, total, pct) {
    const circumference = 2 * Math.PI * 48; // r=48 → ~301.59
    const donutPaid    = document.getElementById('donut-paid');
    const donutPartial = document.getElementById('donut-partial');
    const donutPct     = document.getElementById('donut-pct');

    if (!donutPaid) return;

    if (total === 0) {
        donutPaid.style.strokeDasharray    = `0 ${circumference}`;
        donutPartial.style.strokeDasharray = `0 ${circumference}`;
        donutPct.textContent = '0%';
    } else {
        const paidFrac    = lunas   / total;
        const partialFrac = partial / total;
        const paidLen    = paidFrac * circumference;
        const partialLen = partialFrac * circumference;

        // Paid arc: starts from top (offset = circ*0.25)
        donutPaid.style.strokeDasharray    = `${paidLen} ${circumference - paidLen}`;
        donutPaid.style.strokeDashoffset   = `${circumference * 0.25}`;

        // Partial arc: starts right after paid arc
        donutPartial.style.strokeDasharray    = `${partialLen} ${circumference - partialLen}`;
        donutPartial.style.strokeDashoffset   = `${circumference * 0.25 - paidLen}`;
    }

    donutPct.textContent = `${pct}%`;
    document.getElementById('legend-paid-count').textContent    = lunas;
    document.getElementById('legend-partial-count').textContent = partial;
    document.getElementById('legend-unpaid-count').textContent  = noBayar;
}

// 2. Members Tab
function renderMembersTable() {
    const tableBody = document.querySelector('#table-members tbody');
    tableBody.innerHTML = '';
    const searchQuery = document.getElementById('search-members-input').value.toLowerCase();

    const filteredMembers = state.members.filter(member => 
        member.name.toLowerCase().includes(searchQuery) || 
        member.phone.includes(searchQuery)
    );

    if (filteredMembers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:40px 0;">Tidak ada data anggota</td></tr>`;
        return;
    }

    filteredMembers.forEach((member, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="col-no" data-label="No.">${idx + 1}</td>
            <td data-label="Nama Lengkap">
                <div class="member-name-cell">
                    ${makeAvatar(member.name)}
                    <strong>${member.name}</strong>
                </div>
            </td>
            <td data-label="No. WhatsApp">${member.phone}</td>
            <td data-label="Nominal Iuran">${formatRupiah(member.billAmount)}</td>
            <td data-label="Aksi">
                <div class="action-buttons">
                    <button class="btn-icon-only" title="Histori Iuran" onclick="openHistoryModal('${member.id}')" style="color:var(--color-indigo);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>
                    </button>
                    <button class="btn-icon-only edit" title="Edit Anggota" onclick="openEditMemberModal('${member.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon-only delete" title="Hapus Anggota" onclick="deleteMember('${member.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. Payments Tab (Registry)
let currentFilter = 'all';
function renderPaymentsRegistryTable() {
    const tableBody = document.querySelector('#table-payments-registry tbody');
    tableBody.innerHTML = '';
    const searchQuery = document.getElementById('search-payments-input').value.toLowerCase();
    const targetAmount = state.settings.targetAmount || 300000;

    const activePayments = state.payments.filter(p => p.period === state.activePeriod);

    // Map members to their status with accumulated payment totals
    let data = state.members.map(member => {
        const memberPayments = activePayments.filter(p => p.memberId === member.id);
        const totalPaid = memberPayments.reduce((sum, p) => sum + parseInt(p.amount, 10), 0);
        const isLunas = totalPaid >= targetAmount;
        const hasPayment = memberPayments.length > 0;
        return {
            member,
            memberPayments,
            totalPaid,
            isLunas,
            hasPayment
        };
    });

    // Apply text search
    if (searchQuery) {
        data = data.filter(item => item.member.name.toLowerCase().includes(searchQuery));
    }

    // Apply Filter Button Selection
    if (currentFilter === 'paid') {
        data = data.filter(item => item.isLunas);
    } else if (currentFilter === 'unpaid') {
        data = data.filter(item => !item.isLunas);
    }

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:40px 0;">Tidak ada data iuran ditemukan</td></tr>`;
        return;
    }

    data.forEach((item, idx) => {
        const row = document.createElement('tr');
        const nominalDisplay = `<span style="font-weight:600">${formatRupiah(item.totalPaid)}</span><span class="text-muted"> / ${formatRupiah(targetAmount)}</span>`;

        let statusBadge;
        let actionBtn;

        if (item.isLunas) {
            statusBadge = `<span class="badge badge-paid">✓ Lunas</span>`;
            actionBtn = `
                <div style="display:flex; gap:6px; flex-direction:column; align-items:flex-start;">
                    ${item.memberPayments.map(p => `
                        <div style="display:flex; gap:6px; align-items:center; font-size:0.8rem;">
                            <span class="text-muted">${formatDate(p.paidDate)}: <strong>${formatRupiah(p.amount)}</strong>${p.notes ? ' · '+p.notes : ''}</span>
                            <button class="btn-icon-only delete" title="Hapus pembayaran ini" onclick="voidPayment('${p.id}')" style="width:24px;height:24px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-sm" onclick="openPaymentModal('${item.member.id}')">+ Tambah</button>
                </div>`;
        } else if (item.hasPayment) {
            statusBadge = `<span class="badge badge-partial">⏳ Belum Lunas</span>`;
            actionBtn = `
                <div style="display:flex; gap:6px; flex-direction:column; align-items:flex-start;">
                    ${item.memberPayments.map(p => `
                        <div style="display:flex; gap:6px; align-items:center; font-size:0.8rem;">
                            <span class="text-muted">${formatDate(p.paidDate)}: <strong>${formatRupiah(p.amount)}</strong>${p.notes ? ' · '+p.notes : ''}</span>
                            <button class="btn-icon-only delete" title="Hapus pembayaran ini" onclick="voidPayment('${p.id}')" style="width:24px;height:24px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    `).join('')}
                    <button class="btn btn-emerald btn-sm" onclick="openPaymentModal('${item.member.id}')">Lunasi Sisa (${formatRupiah(targetAmount - item.totalPaid)})</button>
                </div>`;
        } else {
            statusBadge = `<span class="badge badge-unpaid">✗ Belum Bayar</span>`;
            actionBtn = `<button class="btn btn-emerald btn-sm" onclick="openPaymentModal('${item.member.id}')">Catat Bayar</button>`;
        }

        row.innerHTML = `
            <td class="col-no" data-label="No.">${idx + 1}</td>
            <td data-label="Nama Anggota">
                <div class="member-name-cell">${makeAvatar(item.member.name)}<strong>${item.member.name}</strong></div>
            </td>
            <td data-label="Iuran Terbayar">${nominalDisplay}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Aksi" style="white-space:normal; min-width:200px;">${actionBtn}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 4. WhatsApp Sender Tab
function renderWaUnpaidTable() {
    const tableBody = document.querySelector('#table-wa-sender tbody');
    tableBody.innerHTML = '';
    const targetAmount = state.settings.targetAmount || 300000;

    const activePayments = state.payments.filter(p => p.period === state.activePeriod);

    // Filter members whose total paid < targetAmount
    const belumLunasMembers = state.members.map(member => {
        const totalPaid = activePayments
            .filter(p => p.memberId === member.id)
            .reduce((sum, p) => sum + parseInt(p.amount, 10), 0);
        const remaining = targetAmount - totalPaid;
        return { member, totalPaid, remaining };
    }).filter(item => item.remaining > 0);

    // Update unpaid badge count
    document.getElementById('wa-unpaid-badge-count').textContent = `${belumLunasMembers.length} Anggota`;

    if (belumLunasMembers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Semua anggota sudah lunas untuk periode ini! 🎉</td></tr>';
        return;
    }

    belumLunasMembers.forEach(({ member, totalPaid, remaining }) => {
        const row = document.createElement('tr');
        
        const periodName = formatPeriod(state.activePeriod);
        const formattedMsg = parseTemplate(state.settings.waTemplate, member.name, remaining, periodName);
        const cleanPhone = cleanPhoneNumber(member.phone);
        const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(formattedMsg)}`;
        const paidInfo = totalPaid > 0 ? `<br><span class="text-muted" style="font-size:0.78rem">Terbayar: ${formatRupiah(totalPaid)}</span>` : '';
        const safeMsg = formattedMsg.replace(/'/g, "\\'").replace(/\n/g, '\\n');

        row.innerHTML = `
            <td data-label="Nama Anggota">
                <div class="member-name-cell">${makeAvatar(member.name)}<strong>${member.name}</strong></div>
            </td>
            <td data-label="WhatsApp">${member.phone}</td>
            <td data-label="Sisa Tagihan" class="text-rose font-weight-600">${formatRupiah(remaining)}${paidInfo}</td>
            <td data-label="Aksi">
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <a href="${waLink}" target="_blank" class="btn btn-emerald btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>Kirim WA</span>
                    </a>
                    <button class="btn btn-copy btn-sm" onclick="copyWaMessage(this, '${safeMsg}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>Salin</span>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Copy WA Message to Clipboard
window.copyWaMessage = function(btn, msg) {
    const text = msg.replace(/\\n/g, '\n');
    navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.querySelector('span').textContent = 'Tersalin!';
        showToast('Pesan berhasil disalin ke clipboard!', 'success', 2000);
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('span').textContent = 'Salin';
        }, 2000);
    }).catch(() => showToast('Gagal menyalin pesan.', 'error'));
};

// Template Input Preview Live Update
function updateTemplatePreview() {
    const templateInput = document.getElementById('wa-template-input').value;
    const previewContent = document.getElementById('template-preview-text');
    
    // Sample details for preview
    const sampleName = "Budi Santoso";
    const sampleAmount = 50000;
    const samplePeriod = formatPeriod(state.activePeriod);

    const formatted = parseTemplate(templateInput, sampleName, sampleAmount, samplePeriod);
    previewContent.textContent = formatted;
}

// --- Member Modal CRUD Operations ---

function openAddMemberModal() {
    document.getElementById('member-modal-title').textContent = "Tambah Anggota Baru";
    document.getElementById('member-id-input').value = "";
    document.getElementById('member-name-input').value = "";
    document.getElementById('member-phone-input').value = "";
    document.getElementById('member-bill-input').value = "50000"; // default value
    document.getElementById('modal-member').classList.add('open');
}

window.openEditMemberModal = function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('member-modal-title').textContent = "Edit Data Anggota";
    document.getElementById('member-id-input').value = member.id;
    document.getElementById('member-name-input').value = member.name;
    document.getElementById('member-phone-input').value = member.phone;
    document.getElementById('member-bill-input').value = member.billAmount;
    document.getElementById('modal-member').classList.add('open');
};

function closeMemberModal() {
    document.getElementById('modal-member').classList.remove('open');
}

function handleMemberFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('member-id-input').value;
    const name = document.getElementById('member-name-input').value.trim();
    const phone = document.getElementById('member-phone-input').value.trim();
    const billAmount = parseInt(document.getElementById('member-bill-input').value, 10);

    if (id) {
        // Edit existing
        const index = state.members.findIndex(m => m.id === id);
        if (index !== -1) {
            state.members[index] = { ...state.members[index], name, phone, billAmount };
        }
    } else {
        // Add new
        const newId = 'member_' + Date.now();
        state.members.push({
            id: newId,
            name,
            phone,
            billAmount,
            createdAt: new Date().toISOString()
        });
    }

    saveStateToLocalStorage();
    closeMemberModal();
    renderAll();
    showToast(id ? `Data "${name}" berhasil diperbarui.` : `Anggota "${name}" berhasil ditambahkan!`, 'success');
}

window.deleteMember = async function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    const ok = await showConfirm(
        'Hapus Anggota',
        `Apakah Anda yakin ingin menghapus "${member.name}"? Semua riwayat pembayarannya juga akan terhapus.`,
        'Ya, Hapus'
    );
    if (!ok) return;

    state.members = state.members.filter(m => m.id !== memberId);
    state.payments = state.payments.filter(p => p.memberId !== memberId);
    saveStateToLocalStorage();
    renderAll();
    showToast(`Anggota "${member.name}" berhasil dihapus.`, 'info');
};

// --- Payment Modal Actions ---

window.openPaymentModal = function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    const targetAmount = state.settings.targetAmount || 300000;
    const activePayments = state.payments.filter(p => p.period === state.activePeriod && p.memberId === memberId);
    const totalPaid = activePayments.reduce((sum, p) => sum + parseInt(p.amount, 10), 0);
    const remaining = Math.max(0, targetAmount - totalPaid);

    document.getElementById('payment-member-id').value = memberId;
    document.getElementById('payment-member-name').textContent = member.name;
    document.getElementById('payment-period-display').textContent = formatPeriod(state.activePeriod);
    
    // Pre-fill amount with remaining balance (or member's bill if no payments yet)
    document.getElementById('payment-amount-input').value = remaining > 0 ? remaining : member.billAmount;
    
    // Pre-fill date with today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('payment-date-input').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('payment-notes-input').value = "";

    document.getElementById('modal-payment').classList.add('open');
};

function closePaymentModal() {
    document.getElementById('modal-payment').classList.remove('open');
}

function handlePaymentFormSubmit(e) {
    e.preventDefault();
    const memberId = document.getElementById('payment-member-id').value;
    const amount = parseInt(document.getElementById('payment-amount-input').value, 10);
    const paidDate = document.getElementById('payment-date-input').value;
    const notes = document.getElementById('payment-notes-input').value.trim();

    const paymentId = 'pay_' + Date.now();
    state.payments.push({
        id: paymentId,
        memberId,
        period: state.activePeriod,
        amount,
        paidDate,
        notes
    });

    saveStateToLocalStorage();
    closePaymentModal();
    renderAll();
    showToast('Pembayaran berhasil dicatat! 💰', 'success');
}

window.voidPayment = async function(paymentId) {
    const payment = state.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const member = state.members.find(m => m.id === payment.memberId);
    const memberName = member ? member.name : 'Anggota';

    const ok = await showConfirm(
        'Hapus Catatan Bayar',
        `Hapus pembayaran ${formatRupiah(payment.amount)} untuk ${memberName} pada ${formatDate(payment.paidDate)}?`,
        'Ya, Hapus'
    );
    if (!ok) return;

    state.payments = state.payments.filter(p => p.id !== paymentId);
    saveStateToLocalStorage();
    renderAll();
    showToast('Catatan pembayaran berhasil dihapus.', 'info');
};

// --- Histori Iuran per Anggota ---
window.openHistoryModal = function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('history-modal-title').textContent = `Histori Iuran — ${member.name}`;
    document.getElementById('history-modal-subtitle').textContent = member.phone;

    const memberPayments = state.payments
        .filter(p => p.memberId === memberId)
        .sort((a, b) => b.period.localeCompare(a.period) || new Date(b.paidDate) - new Date(a.paidDate));

    const tbody = document.querySelector('#table-history tbody');
    tbody.innerHTML = '';

    if (memberPayments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:30px 0;">Belum ada riwayat pembayaran</td></tr>`;
        document.getElementById('history-total-summary').innerHTML = '';
    } else {
        const grandTotal = memberPayments.reduce((s, p) => s + parseInt(p.amount, 10), 0);
        memberPayments.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Periode"><strong>${formatPeriod(p.period)}</strong></td>
                <td data-label="Jumlah Bayar" class="text-emerald" style="font-weight:600">${formatRupiah(p.amount)}</td>
                <td data-label="Tanggal">${formatDate(p.paidDate)}</td>
                <td data-label="Catatan"><span class="text-muted">${p.notes || '-'}</span></td>
            `;
            tbody.appendChild(row);
        });
        document.getElementById('history-total-summary').innerHTML =
            `Total: <strong>${formatRupiah(grandTotal)}</strong> dari ${memberPayments.length} transaksi`;
    }

    document.getElementById('modal-history').classList.add('open');
};

function closeHistoryModal() {
    document.getElementById('modal-history').classList.remove('open');
}

// --- Backup & Restore Data Functions ---

function exportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `artnem_backup_${state.activePeriod}_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('File cadangan berhasil diunduh!', 'success');
}

function triggerImportFileInput() {
    document.getElementById('import-file-input').click();
}

function handleImportFile(e) {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = async function(event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            
            if (!parsedData.members || !Array.isArray(parsedData.members) ||
                !parsedData.payments || !Array.isArray(parsedData.payments) ||
                !parsedData.settings) {
                showToast('Format berkas cadangan tidak valid.', 'error');
                return;
            }

            const ok = await showConfirm(
                'Pulihkan Data',
                'Data saat ini akan digantikan oleh data dari file cadangan. Proses ini tidak dapat diurungkan.',
                'Ya, Pulihkan'
            );
            if (!ok) return;

            state.members = parsedData.members;
            state.payments = parsedData.payments;
            state.settings = parsedData.settings;
            state.activePeriod = state.settings.selectedMonth || '2026-08';
            
            saveStateToLocalStorage();
            showToast(`Data berhasil dipulihkan! ${parsedData.members.length} anggota dimuat.`, 'success');
            
            e.target.value = '';
            initPeriodOptions();
            renderAll();
        } catch (err) {
            showToast('Gagal membaca berkas JSON: ' + err.message, 'error');
        }
    };
    fileReader.readAsText(file);
}

// --- Initialize Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data State
    loadState();

    // 2. Initialize Options & Navigation
    initPeriodOptions();
    initTabs();

    // 3. Populate template textarea from loaded settings
    const templateInput = document.getElementById('wa-template-input');
    templateInput.value = state.settings.waTemplate;
    updateTemplatePreview();

    // Live update preview on keyup
    templateInput.addEventListener('keyup', updateTemplatePreview);

    // Save Template
    document.getElementById('btn-save-template').addEventListener('click', () => {
        state.settings.waTemplate = templateInput.value;
        saveStateToLocalStorage();
        showToast('Template pesan WhatsApp berhasil disimpan!', 'success');
        renderWaUnpaidTable();
    });

    // Helper Variable Chips insertion
    const chips = document.querySelectorAll('.variable-chips .chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const val = chip.getAttribute('data-var');
            const startPos = templateInput.selectionStart;
            const endPos = templateInput.selectionEnd;
            templateInput.value = 
                templateInput.value.substring(0, startPos) + 
                val + 
                templateInput.value.substring(endPos, templateInput.value.length);
            templateInput.focus();
            templateInput.selectionStart = startPos + val.length;
            templateInput.selectionEnd = startPos + val.length;
            updateTemplatePreview();
        });
    });

    // 4. Searching Filter Binding
    document.getElementById('search-members-input').addEventListener('input', renderMembersTable);
    document.getElementById('search-payments-input').addEventListener('input', renderPaymentsRegistryTable);

    // Filter Buttons Payment tab
    const filterBtns = document.querySelectorAll('.filter-buttons .btn-filter');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderPaymentsRegistryTable();
        });
    });

    // 4.5 Target Amount Setting
    const btnSaveTarget = document.getElementById('btn-save-target');
    if (btnSaveTarget) {
        btnSaveTarget.addEventListener('click', () => {
            const input = document.getElementById('dashboard-target-amount');
            const newTarget = parseInt(input.value, 10);
            if (isNaN(newTarget) || newTarget < 0) {
                showToast('Masukkan nominal target yang valid.', 'warning');
                return;
            }
            state.settings.targetAmount = newTarget;
            saveStateToLocalStorage();
            renderAll();
            showToast(`Target iuran diset ke ${formatRupiah(newTarget)}`, 'success');
        });
    }

    // 5. Modal Binding
    // Member Modal
    document.getElementById('btn-add-member').addEventListener('click', openAddMemberModal);
    document.getElementById('btn-close-member-modal').addEventListener('click', closeMemberModal);
    document.getElementById('btn-cancel-member-modal').addEventListener('click', closeMemberModal);
    document.getElementById('form-member').addEventListener('submit', handleMemberFormSubmit);

    // Payment Modal
    document.getElementById('btn-close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('btn-cancel-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('form-payment').addEventListener('submit', handlePaymentFormSubmit);

    // 6. Backup Bindings
    document.getElementById('btn-export-data').addEventListener('click', exportData);
    document.getElementById('btn-import-trigger').addEventListener('click', triggerImportFileInput);
    document.getElementById('import-file-input').addEventListener('change', handleImportFile);

    // 7. Confirm Modal Bindings
    document.getElementById('btn-confirm-cancel').addEventListener('click', () => closeConfirmModal(false));
    document.getElementById('btn-confirm-ok').addEventListener('click', () => closeConfirmModal(true));

    // 8. History Modal Bindings
    document.getElementById('btn-close-history-modal').addEventListener('click', closeHistoryModal);
    document.getElementById('btn-close-history-footer').addEventListener('click', closeHistoryModal);

    // Close modals on clicking background
    window.addEventListener('click', (e) => {
        const memberModal  = document.getElementById('modal-member');
        const paymentModal = document.getElementById('modal-payment');
        const historyModal = document.getElementById('modal-history');
        const confirmModal = document.getElementById('modal-confirm');
        if (e.target === memberModal)  closeMemberModal();
        if (e.target === paymentModal) closePaymentModal();
        if (e.target === historyModal) closeHistoryModal();
        if (e.target === confirmModal) closeConfirmModal(false);
    });

    // 7. Initial Render
    renderAll();
});
