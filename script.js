// ===== STATE =====
let data = {
  saldo: 0,
  target: 100000,
  riwayat: [],
  streak: 0,
  lastTanggal: null
};

const STORAGE_KEY = 'celengan_data';

// ===== LOAD/SAVE =====
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      data = { ...data, ...parsed };
    } catch (e) {}
  }
  // validasi streak harian
  cekStreak();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===== STREAK =====
function cekStreak() {
  const today = new Date().toDateString();
  if (!data.lastTanggal) {
    data.streak = 0;
    data.lastTanggal = today;
    return;
  }
  const last = new Date(data.lastTanggal);
  const now = new Date(today);
  const diff = (now - last) / (1000 * 60 * 60 * 24);
  if (diff >= 2) {
    data.streak = 0;
  } else if (diff >= 1) {
    // streak lanjut (tapi streak di-update pas tambah)
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
  const saldo = data.saldo;
  const target = data.target;
  const persen = Math.min(100, Math.round((saldo / target) * 100));
  
  document.getElementById('saldoDisplay').textContent = formatRupiah(saldo);
  document.getElementById('targetDisplay').textContent = formatRupiah(target);
  document.getElementById('targetDetail').textContent = formatRupiah(target);
  document.getElementById('kurangDisplay').textContent = formatRupiah(Math.max(0, target - saldo));
  document.getElementById('progressFill').style.width = persen + '%';
  document.getElementById('progressText').textContent = persen + '%';
  document.getElementById('streakDisplay').textContent = `🔥 Streak: ${data.streak} hari`;
  
  // milestone
  const milestones = [10000, 25000, 50000, 100000];
  const container = document.getElementById('milestoneContainer');
  container.innerHTML = '';
  milestones.forEach(m => {
    const span = document.createElement('span');
    span.textContent = `🏅 ${formatRupiah(m)}`;
    if (saldo >= m) span.classList.add('tercapai');
    container.appendChild(span);
  });
  
  // riwayat
  const list = document.getElementById('riwayatList');
  if (data.riwayat.length === 0) {
    list.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">Belum ada transaksi</p>';
  } else {
    list.innerHTML = '';
    // tampilkan 10 terakhir (terbaru di atas)
    const reversed = [...data.riwayat].reverse().slice(0, 15);
    reversed.forEach(item => {
      const div = document.createElement('div');
      div.className = 'riwayat-item';
      const isPlus = item.jumlah > 0;
      const sign = isPlus ? '+' : '';
      const cls = isPlus ? 'plus' : 'minus';
      const alasanText = item.alasan ? ` • ${item.alasan}` : '';
      div.innerHTML = `
                <span>${item.tanggal || 'Hari ini'}</span>
                <span class="jumlah ${cls}">${sign}${formatRupiah(item.jumlah)}${alasanText}</span>
            `;
      list.appendChild(div);
    });
  }
  
  // update input target
  document.getElementById('inputTarget').value = target;
  
  saveData();
}

// ===== FORMAT =====
function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

// ===== TAMBAH TABUNGAN =====
function tambahTabungan(jumlah) {
  if (jumlah <= 0) return alert('Masukkan jumlah yang valid.');
  data.saldo += jumlah;
  data.riwayat.push({
    jumlah: jumlah,
    tanggal: new Date().toLocaleDateString('id-ID'),
    alasan: 'Menabung'
  });
  updateStreak();
  render();
}

// ===== AMBIL TABUNGAN =====
function ambilTabungan(jumlah, alasan) {
  if (jumlah <= 0) return alert('Masukkan jumlah yang valid.');
  if (jumlah > data.saldo) return alert('Saldo tidak cukup!');
  data.saldo -= jumlah;
  data.riwayat.push({
    jumlah: -jumlah,
    tanggal: new Date().toLocaleDateString('id-ID'),
    alasan: alasan || 'Diambil'
  });
  render();
}

// ===== RESET =====
function resetSemua() {
  if (!confirm('Yakin mau reset semua data? Ini tidak bisa dibatalkan.')) return;
  data = {
    saldo: 0,
    target: 100000,
    riwayat: [],
    streak: 0,
    lastTanggal: new Date().toDateString()
  };
  saveData();
  render();
}

// ===== UBAH TARGET =====
function ubahTarget(nilai) {
  if (nilai < 1000) return alert('Target minimal Rp 1.000');
  data.target = nilai;
  render();
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  render();
  
  // --- TAMBAH ---
  const btnTambah = document.getElementById('btnTambah');
  const modalTambah = document.getElementById('modalTambah');
  const btnBatalTambah = document.getElementById('btnBatalTambah');
  const btnLanjutTambah = document.getElementById('btnLanjutTambah');
  const inputTambah = document.getElementById('jumlahTambah');
  
  btnTambah.addEventListener('click', () => {
    inputTambah.value = 5000;
    modalTambah.classList.remove('hidden');
  });
  btnBatalTambah.addEventListener('click', () => modalTambah.classList.add('hidden'));
  btnLanjutTambah.addEventListener('click', () => {
    const jml = parseInt(inputTambah.value) || 0;
    if (jml > 0) {
      tambahTabungan(jml);
      modalTambah.classList.add('hidden');
    } else {
      alert('Masukkan jumlah yang valid.');
    }
  });
  // close modal klik luar
  modalTambah.addEventListener('click', (e) => {
    if (e.target === modalTambah) modalTambah.classList.add('hidden');
  });
  
  // --- AMBIL ---
  const btnAmbil = document.getElementById('btnAmbil');
  const modalAmbil = document.getElementById('modalAmbil');
  const btnBatalAmbil = document.getElementById('btnBatalAmbil');
  const btnLanjutAmbil = document.getElementById('btnLanjutAmbil');
  const inputAmbil = document.getElementById('jumlahAmbil');
  const modalSaldo = document.getElementById('modalSaldo');
  let alasanTerpilih = '';
  
  // pilih alasan
  document.querySelectorAll('.alasan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.alasan-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      alasanTerpilih = btn.dataset.alasan;
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
    document.querySelectorAll('.alasan-btn').forEach(b => b.classList.remove('selected'));
    modalAmbil.classList.remove('hidden');
  });
  btnBatalAmbil.addEventListener('click', () => modalAmbil.classList.add('hidden'));
  btnLanjutAmbil.addEventListener('click', () => {
    const jml = parseInt(inputAmbil.value) || 0;
    if (jml <= 0) return alert('Masukkan jumlah yang valid.');
    if (jml > data.saldo) return alert('Saldo tidak cukup!');
    if (!alasanTerpilih) return alert('Pilih alasan pengambilan!');
    ambilTabungan(jml, alasanTerpilih);
    modalAmbil.classList.add('hidden');
  });
  modalAmbil.addEventListener('click', (e) => {
    if (e.target === modalAmbil) modalAmbil.classList.add('hidden');
  });
  
  // --- UBAH TARGET ---
  document.getElementById('btnUbahTarget').addEventListener('click', () => {
    const val = parseInt(document.getElementById('inputTarget').value) || 0;
    ubahTarget(val);
  });
  
  // --- RESET ---
  document.getElementById('btnReset').addEventListener('click', resetSemua);
  
  // Enter key support
  document.getElementById('inputTarget').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnUbahTarget').click();
  });
});