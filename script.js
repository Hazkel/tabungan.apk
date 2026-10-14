const STORAGE_KEY = 'celengan_data';
const THEME_STORAGE_KEY = 'celengan_theme';

const DEFAULT_DATA = {
  saldo: 0,
  target: 100000,
  riwayat: [],
  streak: 0,
  lastTanggal: null
};

let data = { ...DEFAULT_DATA };

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Preferensi tema tidak dapat dibaca:', error);
    return 'light';
  }
}

document.documentElement.classList.add('theme-loading');
document.documentElement.dataset.theme = getSavedTheme();

function setTheme(theme, save = true) {
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';
  const root = document.documentElement;

  root.dataset.theme = selectedTheme;

  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeToggle) {
    const isDark = selectedTheme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute(
      'aria-label',
      isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
    );
  }

  if (themeIcon) {
    themeIcon.textContent = selectedTheme === 'dark' ? '☀' : '◐';
  }

  if (themeLabel) {
    themeLabel.textContent = selectedTheme === 'dark' ? 'Terang' : 'Gelap';
  }

  if (themeColor) {
    themeColor.setAttribute('content', selectedTheme === 'dark' ? '#0d0d0d' : '#ffffff');
  }

  if (save) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    } catch (error) {
      console.error('Preferensi tema tidak dapat disimpan:', error);
    }
  }
}

// ===== LOAD/SAVE DATA =====
function loadData() {
  let raw;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Data tabungan tidak dapat dibaca:', error);
    return;
  }

  if (!raw) {
    cekStreak();
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object') {
      data = { ...DEFAULT_DATA, ...parsed };
    }
  } catch (error) {
    console.error('Data tabungan memiliki format yang tidak valid:', error);
  }

  if (!Array.isArray(data.riwayat)) {
    data.riwayat = [];
  }

  data.saldo = Number(data.saldo) || 0;
  data.target = Number(data.target) >= 1000 ? Number(data.target) : 100000;
  data.streak = Number(data.streak) || 0;

  cekStreak();
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Data tabungan tidak dapat disimpan:', error);
    alert('Data tidak dapat disimpan di perangkat ini.');
  }
}

// ===== STREAK =====
function cekStreak() {
  const today = new Date().toDateString();

  if (!data.lastTanggal) {
    data.streak = 0;
    data.lastTanggal = today;
    saveData();
    return;
  }

  const last = new Date(data.lastTanggal);
  const now = new Date(today);
  const diff = (now - last) / (1000 * 60 * 60 * 24);

  if (diff >= 2) {
    data.streak = 0;
  }

  data.lastTanggal = today;
  saveData();
}

function updateStreak() {
  const today = new Date().toDateString();

  if (data.lastTanggal !== today) {
    data.streak += 1;
    data.lastTanggal = today;
    saveData();
  }
}

// ===== RENDER =====
function render() {
  const saldo = Number(data.saldo) || 0;
  const target = Number(data.target) || 100000;
  const persen = Math.min(100, Math.round((saldo / target) * 100));

  document.getElementById('saldoDisplay').textContent = formatRupiah(saldo);
  document.getElementById('targetDisplay').textContent = formatRupiah(target);
  document.getElementById('targetDetail').textContent = formatRupiah(target);
  document.getElementById('kurangDisplay').textContent =
    formatRupiah(Math.max(0, target - saldo));
  document.getElementById('progressFill').style.width = `${persen}%`;
  document.getElementById('progressText').textContent = `${persen}%`;

  const progressBar = document.querySelector('.progress-bg');
  progressBar.setAttribute('aria-valuenow', String(persen));

  document.getElementById('streakDisplay').textContent =
    `Streak: ${data.streak} hari`;

  renderMilestones(saldo);
  renderRiwayat();

  document.getElementById('inputTarget').value = target;
  saveData();
}

function renderMilestones(saldo) {
  const milestones = [10000, 25000, 50000, 100000];
  const container = document.getElementById('milestoneContainer');

  container.replaceChildren();

  milestones.forEach((milestone) => {
    const item = document.createElement('span');
    item.textContent = formatRupiah(milestone);

    if (saldo >= milestone) {
      item.classList.add('tercapai');
    }

    container.appendChild(item);
  });
}

function renderRiwayat() {
  const list = document.getElementById('riwayatList');
  list.replaceChildren();

  if (data.riwayat.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Belum ada transaksi';
    list.appendChild(emptyState);
    return;
  }

  const transaksiTerbaru = [...data.riwayat].reverse().slice(0, 15);

  transaksiTerbaru.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'riwayat-item';

    const info = document.createElement('span');
    info.className = 'transaction-info';

    const tanggal = document.createElement('span');
    tanggal.className = 'tanggal';
    tanggal.textContent = item.tanggal || 'Hari ini';

    const alasan = document.createElement('span');
    alasan.className = 'alasan';
    alasan.textContent = item.alasan || '';

    info.append(tanggal, alasan);

    const jumlah = document.createElement('span');
    const isPlus = Number(item.jumlah) > 0;
    jumlah.className = `jumlah ${isPlus ? 'plus' : 'minus'}`;
    jumlah.textContent =
      `${isPlus ? '+' : ''}${formatRupiah(Number(item.jumlah) || 0)}`;

    row.append(info, jumlah);
    list.appendChild(row);
  });
}

// ===== FORMAT & MODAL =====
function formatRupiah(angka) {
  return `Rp ${Number(angka).toLocaleString('id-ID')}`;
}

function bukaModal(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.modal-content').focus();
}

function tutupModal(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

// ===== TRANSAKSI =====
function tambahTabungan(jumlah) {
  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    alert('Masukkan jumlah yang valid.');
    return;
  }

  data.saldo += jumlah;
  data.riwayat.push({
    jumlah,
    tanggal: new Date().toLocaleDateString('id-ID'),
    alasan: 'Menabung'
  });

  updateStreak();
  render();
}

function ambilTabungan(jumlah, alasan) {
  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    alert('Masukkan jumlah yang valid.');
    return;
  }

  if (jumlah > data.saldo) {
    alert('Saldo tidak cukup!');
    return;
  }

  data.saldo -= jumlah;
  data.riwayat.push({
    jumlah: -jumlah,
    tanggal: new Date().toLocaleDateString('id-ID'),
    alasan: alasan || 'Diambil'
  });

  render();
}

// ===== RESET & TARGET =====
function resetSemua() {
  if (!confirm('Yakin mau reset semua data? Ini tidak bisa dibatalkan.')) {
    return;
  }

  data = {
    ...DEFAULT_DATA,
    riwayat: [],
    lastTanggal: new Date().toDateString()
  };

  saveData();
  render();
}

function ubahTarget(nilai) {
  if (!Number.isFinite(nilai) || nilai < 1000) {
    alert('Target minimal Rp 1.000');
    return;
  }

  data.target = nilai;
  render();
}

// ===== SETUP =====
document.addEventListener('DOMContentLoaded', function () {
  const themeToggle = document.getElementById('themeToggle');

  setTheme(document.documentElement.dataset.theme, false);

  themeToggle.addEventListener('click', () => {
    const nextTheme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

    setTheme(nextTheme);
  });

  requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-loading');
  });

  loadData();
  render();

  const btnTambah = document.getElementById('btnTambah');
  const modalTambah = document.getElementById('modalTambah');
  const btnBatalTambah = document.getElementById('btnBatalTambah');
  const btnLanjutTambah = document.getElementById('btnLanjutTambah');
  const inputTambah = document.getElementById('jumlahTambah');

  btnTambah.addEventListener('click', () => {
    inputTambah.value = 5000;
    bukaModal(modalTambah);
  });

  btnBatalTambah.addEventListener('click', () => tutupModal(modalTambah));

  btnLanjutTambah.addEventListener('click', () => {
    const jumlah = Number.parseInt(inputTambah.value, 10) || 0;

    if (jumlah > 0) {
      tambahTabungan(jumlah);
      tutupModal(modalTambah);
    } else {
      alert('Masukkan jumlah yang valid.');
    }
  });

  modalTambah.addEventListener('click', (event) => {
    if (event.target === modalTambah) {
      tutupModal(modalTambah);
    }
  });

  const btnAmbil = document.getElementById('btnAmbil');
  const modalAmbil = document.getElementById('modalAmbil');
  const btnBatalAmbil = document.getElementById('btnBatalAmbil');
  const btnLanjutAmbil = document.getElementById('btnLanjutAmbil');
  const inputAmbil = document.getElementById('jumlahAmbil');
  const modalSaldo = document.getElementById('modalSaldo');
  const tombolAlasan = document.querySelectorAll('.alasan-btn');
  let alasanTerpilih = '';

  tombolAlasan.forEach((button) => {
    button.addEventListener('click', () => {
      tombolAlasan.forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      alasanTerpilih = button.dataset.alasan;
    });
  });

  btnAmbil.addEventListener('click', () => {
    if (data.saldo <= 0) {
      alert('Saldo kosong, tidak bisa mengambil.');
      return;
    }

    modalSaldo.textContent = formatRupiah(data.saldo);
    inputAmbil.value = Math.min(5000, data.saldo);
    alasanTerpilih = '';
    tombolAlasan.forEach((button) => button.classList.remove('selected'));
    bukaModal(modalAmbil);
  });

  btnBatalAmbil.addEventListener('click', () => tutupModal(modalAmbil));

  btnLanjutAmbil.addEventListener('click', () => {
    const jumlah = Number.parseInt(inputAmbil.value, 10) || 0;

    if (jumlah <= 0) {
      alert('Masukkan jumlah yang valid.');
      return;
    }

    if (jumlah > data.saldo) {
      alert('Saldo tidak cukup!');
      return;
    }

    if (!alasanTerpilih) {
      alert('Pilih alasan pengambilan!');
      return;
    }

    ambilTabungan(jumlah, alasanTerpilih);
    tutupModal(modalAmbil);
  });

  modalAmbil.addEventListener('click', (event) => {
    if (event.target === modalAmbil) {
      tutupModal(modalAmbil);
    }
  });

  document.getElementById('btnUbahTarget').addEventListener('click', () => {
    const nilai =
      Number.parseInt(document.getElementById('inputTarget').value, 10) || 0;

    ubahTarget(nilai);
  });

  document.getElementById('btnReset').addEventListener('click', resetSemua);

  document.getElementById('inputTarget').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      document.getElementById('btnUbahTarget').click();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!modalAmbil.classList.contains('hidden')) {
        tutupModal(modalAmbil);
      }

      if (!modalTambah.classList.contains('hidden')) {
        tutupModal(modalTambah);
      }
    }
  });
});