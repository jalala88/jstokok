/**
 * shopkita-user.js
 * Search, wishlist, autentikasi user (login, register, logout)
 * Butuh: shopkita-config.js, shopkita-core.js
 */

// ===== SEARCH =====
function setupSearch() {
  const input = document.getElementById('searchInput');
  let searchTimer;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => liveSearch(input.value), 350);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { doSearch(); document.getElementById('searchDropdown').classList.remove('open'); }
    if (e.key === 'Escape') document.getElementById('searchDropdown').classList.remove('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-bar')) document.getElementById('searchDropdown').classList.remove('open');
  });
}

async function liveSearch(q) {
  const dd = document.getElementById('searchDropdown');
  if (!q || q.length < 2) { dd.classList.remove('open'); return; }
  const res = await apiGet({ action: 'searchProducts', q, limit: 5 });
  if (res.status !== 'ok' || !res.data.length) { dd.classList.remove('open'); return; }
  dd.innerHTML = res.data.map(p => `
    <div class="search-result-item" onclick="openProduct('${p.id}')">
      <img class="search-result-img" src="${p.gambar}" alt="" onerror="this.src='https://placehold.co/40x40/f0f0f0/999999?text=img'"/>
      <div>
        <div class="search-result-name">${p.nama}</div>
        <div class="search-result-price">${formatRupiah(p.harga)}</div>
      </div>
    </div>`).join('');
  dd.classList.add('open');
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  document.getElementById('searchDropdown').classList.remove('open');
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;" class="loading-spinner"><div class="spinner"></div></div>';
  const res = await apiGet({ action: 'searchProducts', q, limit: 24 });
  allProducts = res.data || [];
  renderProductGrid();
  window.scrollTo({ top: document.getElementById('productsGrid').offsetTop - 100, behavior: 'smooth' });
}

// ===== WISHLIST =====
function toggleWishlist(id) {
  let wl = JSON.parse(localStorage.getItem('shopkita_wishlist') || '[]');
  const idx = wl.indexOf(id);
  if (idx >= 0) { wl.splice(idx, 1); showToast('Dihapus dari wishlist'); }
  else { wl.push(id); showToast('Ditambahkan ke wishlist ❤️'); }
  localStorage.setItem('shopkita_wishlist', JSON.stringify(wl));
}

// ===== USER =====
function handleUserClick() {
  if (currentUser) {
    // Tampil dropdown opsi user
    const menu = document.getElementById('userDropdown');
    if (menu) {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
  } else {
    openLoginModal();
  }
}

function updateUserUI() {
  const userBtn  = document.getElementById('headerUser');
  const userText = document.getElementById('headerUserText');
  const dropdown = document.getElementById('userDropdown');
  if (currentUser) {
    userText.textContent = currentUser.nama.split(' ')[0];
    if (dropdown) dropdown.innerHTML = `
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
        <div style="font-weight:700;">${currentUser.nama}</div>
        <div style="font-size:12px;color:var(--text-muted);">${currentUser.email}</div>
      </div>
      <a href="#" style="display:block;padding:10px 16px;font-size:13px;color:var(--text-main);" 
        onmouseover="this.style.background='var(--bg-gray)'" onmouseout="this.style.background=''"
        onclick="doLogout()"><i class="fas fa-sign-out-alt" style="margin-right:8px;color:var(--shopee-red);"></i>Keluar</a>`;
  } else {
    userText.textContent = 'Masuk';
    if (dropdown) dropdown.style.display = 'none';
  }
}

// ===== AUTH FUNCTIONS =====
function openLoginModal() {
  switchAuthTab('login');
  document.getElementById('loginModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openRegisterModal() {
  switchAuthTab('register');
  document.getElementById('loginModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
  document.getElementById('loginModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function switchAuthTab(tab) {
  document.getElementById('tabLogin').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('tabRegister').style.display = tab === 'register' ? 'block' : 'none';
  const btnLogin    = document.getElementById('authTabLogin');
  const btnRegister = document.getElementById('authTabRegister');
  if (tab === 'login') {
    btnLogin.style.borderBottomColor = 'var(--shopee-red)';
    btnLogin.style.color = 'var(--shopee-red)';
    btnRegister.style.borderBottomColor = 'transparent';
    btnRegister.style.color = 'var(--text-muted)';
  } else {
    btnRegister.style.borderBottomColor = 'var(--shopee-red)';
    btnRegister.style.color = 'var(--shopee-red)';
    btnLogin.style.borderBottomColor = 'transparent';
    btnLogin.style.color = 'var(--text-muted)';
  }
}

async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!email || !password) { showToast('Email &amp; password wajib diisi', 'error'); return; }
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  const res = await apiPost({ action: 'loginUser', email, password });
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
  if (res.status === 'ok') {
    currentUser = res.user;
    localStorage.setItem('shopkita_user', JSON.stringify(currentUser));
    updateUserUI();
    closeLoginModal();
    showToast('Selamat datang, ' + currentUser.nama + '! 👋');
  } else {
    showToast(res.message || 'Email atau password salah', 'error');
  }
}

async function doRegister() {
  const nama     = document.getElementById('regNama').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const telepon  = document.getElementById('regTelp').value.trim();
  const password = document.getElementById('regPass').value;
  if (!nama || !email || !password) { showToast('Nama, email &amp; password wajib diisi', 'error'); return; }
  if (password.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  const res = await apiPost({ action: 'registerUser', nama, email, telepon, password });
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
  if (res.status === 'ok') {
    showToast('Registrasi berhasil! Silakan login 🎉');
    document.getElementById('regNama').value  = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regTelp').value  = '';
    document.getElementById('regPass').value  = '';
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;
  } else {
    showToast(res.message || 'Registrasi gagal', 'error');
  }
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('shopkita_user');
  updateUserUI();
  showToast('Berhasil keluar 👋');
}

