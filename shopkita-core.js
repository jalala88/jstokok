/**
 * shopkita-core.js
 * API helper, format, modal, toast, init
 * Butuh: shopkita-config.js dimuat lebih dulu
 */

// ===== API HELPER =====
async function apiGet(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_URL}?${qs}`;
  try {
    const res = await fetch(url);
    return await res.json();
  } catch(e) {
    console.error('API Error:', e);
    return { status: 'error', message: e.toString() };
  }
}

async function apiPost(data) {
  // Google Apps Script tidak support CORS preflight
  // Kirim setiap field sebagai parameter GET terpisah (lebih reliable)
  try {
    const params = new URLSearchParams();
    // Tambah setiap key sebagai param terpisah
    Object.keys(data).forEach(key => {
      const val = data[key];
      // Jika value adalah object/array, stringify dulu
      params.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
    });
    const url = API_URL + '?' + params.toString();
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch(e) {
      console.error('Response bukan JSON:', text);
      return { status: 'error', message: 'Response tidak valid: ' + text.substring(0, 100) };
    }
  } catch(e) {
    return { status: 'error', message: e.toString() };
  }
}

// ===== FORMAT HELPER =====
function formatRupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID');
}
function formatDiscount(ori, sale) {
  if (!ori || ori <= sale) return '';
  return Math.round((1 - sale / ori) * 100) + '%';
}
function renderStars(rating) {
  const r = parseFloat(rating) || 0;
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += `<i class="fa${i < Math.floor(r) ? 's' : (i - r < 1 && r % 1 >= .5 ? 's' : 'r')} fa-star"></i>`;
  }
  return s;
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) { closeModal(el.id); document.body.style.overflow = ''; } });
});

// Tutup user dropdown saat klik di luar
document.addEventListener('click', e => {
  const dropdown = document.getElementById('userDropdown');
  const userBtn  = document.getElementById('headerUser');
  if (dropdown && !userBtn.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 2800);
}


// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  updateCartUI();
  updateUserUI();
  setupSearch();
  loadBanners();
  loadCategories();
  loadFlashSale();
  loadProducts(true);
  startCountdown();
});
