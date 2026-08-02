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
    selectedMonth: '2026-08'
};

// --- Application State ---
let state = {
    members: [],
    payments: [],
    settings: {},
    activePeriod: '2026-08'
};

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

    // Calculations
    const totalMembers = state.members.length;
    document.getElementById('stat-total-members').textContent = totalMembers;

    // Filter payments for this month
    const activePayments = state.payments.filter(p => p.period === state.activePeriod);
    const paidCount = activePayments.length;
    const unpaidCount = totalMembers - paidCount;
    
    const paidPercentage = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;
    const unpaidPercentage = totalMembers > 0 ? Math.round((unpaidCount / totalMembers) * 100) : 0;

    // Update Counts
    document.getElementById('stat-paid-count').textContent = paidCount;
    document.getElementById('stat-paid-percentage').textContent = `${paidPercentage}% dari total`;

    document.getElementById('stat-unpaid-count').textContent = unpaidCount;
    document.getElementById('stat-unpaid-percentage').textContent = `${unpaidPercentage}% dari total`;

    // Total Collected
    const totalCollected = activePayments.reduce((sum, p) => sum + parseInt(p.amount, 10), 0);
    document.getElementById('stat-total-collected').textContent = formatRupiah(totalCollected);

    // Progress Bar
    const progressFill = document.getElementById('dashboard-progress-fill');
    const progressText = document.getElementById('dashboard-progress-text');
    const progressDetail = document.getElementById('dashboard-progress-detail');

    progressFill.style.width = `${paidPercentage}%`;
    progressText.textContent = `${paidPercentage}% Selesai`;
    progressDetail.textContent = `${paidCount} dari ${totalMembers} Anggota`;

    // Recent Payments
    const recentTableBody = document.querySelector('#table-recent-payments tbody');
    recentTableBody.innerHTML = '';

    // Sort payments by date descending
    const sortedPayments = [...state.payments].sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    const recentList = sortedPayments.slice(0, 5); // top 5 recent across all months

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

// 2. Members Tab
function renderMembersTable() {
    const tableBody = document.querySelector('#table-members tbody');
    tableBody.innerHTML = '';
    const searchQuery = document.getElementById('search-members-input').value.toLowerCase();

    // Filter members based on search
    const filteredMembers = state.members.filter(member => 
        member.name.toLowerCase().includes(searchQuery) || 
        member.phone.includes(searchQuery)
    );

    if (filteredMembers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Tidak ada data anggota</td></tr>';
        return;
    }

    filteredMembers.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Nama Lengkap"><strong>${member.name}</strong></td>
            <td data-label="No. WhatsApp">${member.phone}</td>
            <td data-label="Nominal Iuran">${formatRupiah(member.billAmount)}</td>
            <td data-label="Aksi">
                <div class="action-buttons">
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

    const activePayments = state.payments.filter(p => p.period === state.activePeriod);

    // Map members to their status
    let data = state.members.map(member => {
        const paymentRecord = activePayments.find(p => p.memberId === member.id);
        return {
            member,
            isPaid: !!paymentRecord,
            paymentRecord
        };
    });

    // Apply text search
    if (searchQuery) {
        data = data.filter(item => item.member.name.toLowerCase().includes(searchQuery));
    }

    // Apply Filter Button Selection
    if (currentFilter === 'paid') {
        data = data.filter(item => item.isPaid);
    } else if (currentFilter === 'unpaid') {
        data = data.filter(item => !item.isPaid);
    }

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Tidak ada data iuran ditemukan</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        
        let statusBadge = `<span class="badge badge-unpaid">Belum Bayar</span>`;
        let paidDateText = '-';
        let notesText = '-';
        let actionBtn = `<button class="btn btn-emerald btn-sm" onclick="openPaymentModal('${item.member.id}')">Tandai Lunas</button>`;

        if (item.isPaid) {
            statusBadge = `<span class="badge badge-paid">Lunas</span>`;
            paidDateText = formatDate(item.paymentRecord.paidDate);
            notesText = `<span class="text-muted">${item.paymentRecord.notes || '-'}</span>`;
            actionBtn = `<button class="btn btn-secondary btn-sm" onclick="voidPayment('${item.paymentRecord.id}')">Batalkan</button>`;
        }

        row.innerHTML = `
            <td data-label="Nama Anggota"><strong>${item.member.name}</strong></td>
            <td data-label="Iuran Bulanan">${formatRupiah(item.member.billAmount)}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Tanggal Bayar">${paidDateText}</td>
            <td data-label="Catatan">${notesText}</td>
            <td data-label="Aksi">${actionBtn}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 4. WhatsApp Sender Tab
function renderWaUnpaidTable() {
    const tableBody = document.querySelector('#table-wa-sender tbody');
    tableBody.innerHTML = '';

    const activePayments = state.payments.filter(p => p.period === state.activePeriod);
    const unpaidMembers = state.members.filter(member => {
        return !activePayments.some(p => p.memberId === member.id);
    });

    // Update unpaid badge count
    document.getElementById('wa-unpaid-badge-count').textContent = `${unpaidMembers.length} Anggota`;

    if (unpaidMembers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Semua anggota sudah lunas untuk periode ini! 🎉</td></tr>';
        return;
    }

    unpaidMembers.forEach(member => {
        const row = document.createElement('tr');
        
        // Generate pre-filled message text
        const periodName = formatPeriod(state.activePeriod);
        const formattedMsg = parseTemplate(state.settings.waTemplate, member.name, member.billAmount, periodName);
        const cleanPhone = cleanPhoneNumber(member.phone);
        
        // WhatsApp link
        const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(formattedMsg)}`;

        row.innerHTML = `
            <td data-label="Nama Anggota"><strong>${member.name}</strong></td>
            <td data-label="WhatsApp">${member.phone}</td>
            <td data-label="Tagihan" class="text-rose font-weight-600">${formatRupiah(member.billAmount)}</td>
            <td data-label="Aksi">
                <a href="${waLink}" target="_blank" class="btn btn-emerald btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Kirim WA</span>
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

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
}

window.deleteMember = function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    if (confirm(`Apakah Anda yakin ingin menghapus anggota "${member.name}"? Semua data pembayarannya juga akan dihapus.`)) {
        // Remove member
        state.members = state.members.filter(m => m.id !== memberId);
        // Clean up payments
        state.payments = state.payments.filter(p => p.memberId !== memberId);
        
        saveStateToLocalStorage();
        renderAll();
    }
};

// --- Payment Modal Actions ---

window.openPaymentModal = function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('payment-member-id').value = memberId;
    document.getElementById('payment-member-name').textContent = member.name;
    document.getElementById('payment-period-display').textContent = formatPeriod(state.activePeriod);
    
    // Pre-fill amount with member's default bill
    document.getElementById('payment-amount-input').value = member.billAmount;
    
    // Pre-fill date with today (2026-08-02 based on system context date)
    const today = new Date();
    // Safely format today to YYYY-MM-DD
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
}

window.voidPayment = function(paymentId) {
    const payment = state.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const member = state.members.find(m => m.id === payment.memberId);
    const memberName = member ? member.name : 'Anggota';

    if (confirm(`Apakah Anda yakin ingin membatalkan status LUNAS untuk ${memberName} pada periode ${formatPeriod(payment.period)}?`)) {
        state.payments = state.payments.filter(p => p.id !== paymentId);
        saveStateToLocalStorage();
        renderAll();
    }
};

// --- Backup & Restore Data Functions ---

function exportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `artnem_backup_${state.activePeriod}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function triggerImportFileInput() {
    document.getElementById('import-file-input').click();
}

function handleImportFile(e) {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = function(event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            
            // Validation
            if (!parsedData.members || !Array.isArray(parsedData.members) ||
                !parsedData.payments || !Array.isArray(parsedData.payments) ||
                !parsedData.settings) {
                alert("Format berkas cadangan tidak valid. Berkas harus berisi data anggota, pembayaran, dan pengaturan.");
                return;
            }

            if (confirm("Apakah Anda yakin ingin memulihkan data? Data saat ini di browser Anda akan sepenuhnya digantikan oleh data dari berkas cadangan ini.")) {
                state.members = parsedData.members;
                state.payments = parsedData.payments;
                state.settings = parsedData.settings;
                state.activePeriod = state.settings.selectedMonth || '2026-08';
                
                saveStateToLocalStorage();
                alert("Data berhasil dipulihkan!");
                
                // Reset file input
                e.target.value = '';
                
                // Re-initialize and render
                initPeriodOptions();
                renderAll();
            }
        } catch (err) {
            alert("Gagal membaca berkas JSON: " + err.message);
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
        alert("Template pesan WhatsApp berhasil disimpan!");
        renderWaUnpaidTable(); // update WA list links with new template
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

    // Close modals on clicking background
    window.addEventListener('click', (e) => {
        const memberModal = document.getElementById('modal-member');
        const paymentModal = document.getElementById('modal-payment');
        if (e.target === memberModal) closeMemberModal();
        if (e.target === paymentModal) closePaymentModal();
    });

    // 7. Initial Render
    renderAll();
});
