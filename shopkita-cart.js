/**
 * shopkita-cart.js
 * Keranjang belanja & checkout
 * Butuh: shopkita-config.js, shopkita-core.js
 */

// ===== CART =====
// Cache produk yang sedang dibuka
let _currentProduct = null;

// ── AFFILIATE REDIRECT ──────────────────────────────────
function goToAffiliate(link, id) {
  if (!link) { alert('Link affiliasi tidak tersedia'); return; }
  // Buka di tab baru
  window.open(link, '_blank', 'noopener,noreferrer');
}

function addToCartById(id) {
  if (_currentProduct && String(_currentProduct.id) === String(id)) {
    addToCart(_currentProduct);
  }
}
function buyNowById(id) {
  if (_currentProduct && String(_currentProduct.id) === String(id)) {
    buyNow(_currentProduct);
  }
}

function addToCart(p) {
  const qty = parseInt(document.getElementById('qtyInput')?.value || 1);
  const idx = cart.findIndex(i => i.id === p.id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ id: p.id, nama: p.nama, harga: p.harga, gambar: p.gambar, qty, stok: p.stok });
  saveCart();
  showToast('Produk ditambahkan ke keranjang!', 'success');
}

function buyNow(p) {
  addToCart(p);
  closeModal('productModal');
  goToCheckout();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function updateCartQty(id, qty) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) { cart[idx].qty = Math.max(1, qty); saveCart(); }
}

function saveCart() {
  localStorage.setItem('shopkita_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartBadge').textContent = total;
  document.getElementById('cartBadge').style.display = total ? 'block' : 'none';

  const cartTotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  document.getElementById('cartTotal').textContent = formatRupiah(cartTotal);

  const container = document.getElementById('cartItems');
  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart"></i>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Keranjang Kosong</div>
        <div style="font-size:13px;">Yuk, mulai belanja!</div>
      </div>`;
    return;
  }
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='https://placehold.co/72x72/f0f0f0/999999?text=img'"/>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nama}</div>
        <div class="cart-item-price">${formatRupiah(item.harga)}</div>
        <div class="cart-item-actions">
          <div class="qty-control" style="transform:scale(.85);transform-origin:left;">
            <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty - 1})">−</button>
            <input class="qty-input" type="number" value="${item.qty}" onchange="updateCartQty('${item.id}', this.value)" style="width:40px;"/>
            <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty + 1})">+</button>
          </div>
          <button class="cart-item-del" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

// ===== CHECKOUT =====
function goToCheckout() {
  if (!cart.length) { showToast('Keranjang masih kosong!', 'error'); return; }
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  checkoutStep = 0;
  openModal('checkoutModal');
  renderCheckoutStep();
}

function renderCheckoutStep() {
  const steps = document.querySelectorAll('#checkoutSteps .step');
  steps.forEach((s, i) => {
    s.className = 'step' + (i === checkoutStep ? ' active' : i < checkoutStep ? ' done' : '');
  });

  const content = document.getElementById('checkoutContent');
  const user = currentUser || {};

  if (checkoutStep === 0) {
    content.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nama Lengkap *</label>
          <input class="form-input" id="c_nama" value="${user.nama || ''}" placeholder="Masukkan nama lengkap"/>
        </div>
        <div class="form-group">
          <label class="form-label">No. Telepon *</label>
          <input class="form-input" id="c_telp" type="tel" value="${user.telepon || ''}" placeholder="08xx"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="c_email" type="email" value="${user.email || ''}" placeholder="email@contoh.com"/>
      </div>
      <div class="form-group">
        <label class="form-label">Alamat Lengkap *</label>
        <textarea class="form-input" id="c_alamat" rows="3" placeholder="Nama jalan, nomor rumah, RT/RW"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Kota *</label>
          <input class="form-input" id="c_kota" placeholder="Nama kota"/>
        </div>
        <div class="form-group">
          <label class="form-label">Provinsi</label>
          <input class="form-input" id="c_prov" placeholder="Provinsi"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Kode Pos</label>
        <input class="form-input" id="c_kodepos" type="number" placeholder="Kode pos"/>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;">
        <button class="btn-primary" onclick="nextCheckoutStep()">
          Lanjut ke Pembayaran <i class="fas fa-arrow-right"></i>
        </button>
      </div>`;
  }

  else if (checkoutStep === 1) {
    content.innerHTML = `
      <div class="detail-label" style="margin-bottom:12px;">Pilih Metode Pembayaran</div>
      ${[
        { id: 'transfer', icon: '🏦', label: 'Transfer Bank', desc: 'BCA, BRI, Mandiri, BNI' },
        { id: 'gopay', icon: '💚', label: 'GoPay', desc: 'Bayar via dompet GoPay' },
        { id: 'ovo', icon: '💜', label: 'OVO', desc: 'Bayar via dompet OVO' },
        { id: 'cod', icon: '🚚', label: 'Bayar di Tempat (COD)', desc: 'Bayar saat paket tiba' },
      ].map(m => `
        <div class="payment-option" id="pay_${m.id}" onclick="selectPayment('${m.id}')">
          <div class="payment-icon">${m.icon}</div>
          <div>
            <div class="payment-label">${m.label}</div>
            <div class="payment-desc">${m.desc}</div>
          </div>
        </div>`).join('')}
      <div style="display:flex;justify-content:space-between;margin-top:8px;">
        <button class="btn-secondary" onclick="prevCheckoutStep()"><i class="fas fa-arrow-left"></i> Kembali</button>
        <button class="btn-primary" onclick="nextCheckoutStep()">Lihat Ringkasan <i class="fas fa-arrow-right"></i></button>
      </div>`;
    window._selectedPayment = 'transfer';
    document.getElementById('pay_transfer').classList.add('selected');
  }

  else if (checkoutStep === 2) {
    const sub = cart.reduce((s, i) => s + i.harga * i.qty, 0);
    const ongkir = 15000;
    const total = sub + ongkir;
    content.innerHTML = `
      <div style="background:var(--bg-gray);border-radius:var(--radius);padding:16px;margin-bottom:20px;">
        <div class="detail-label" style="margin-bottom:12px;">Ringkasan Pesanan</div>
        ${cart.map(i => `
          <div class="order-summary-item">
            <span>${i.nama} x${i.qty}</span>
            <strong>${formatRupiah(i.harga * i.qty)}</strong>
          </div>`).join('')}
        <div class="order-summary-item"><span>Ongkos Kirim</span><strong>${formatRupiah(ongkir)}</strong></div>
        <div class="order-summary-total">
          <span>Total Pembayaran</span>
          <span>${formatRupiah(total)}</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <button class="btn-secondary" onclick="prevCheckoutStep()"><i class="fas fa-arrow-left"></i> Kembali</button>
        <button class="btn-primary" id="submitOrderBtn" onclick="submitOrder(${total}, ${ongkir})">
          <i class="fas fa-check"></i> Buat Pesanan
        </button>
      </div>`;
  }
}

let _checkoutData = {};
function nextCheckoutStep() {
  if (checkoutStep === 0) {
    const nama = document.getElementById('c_nama').value.trim();
    const telp = document.getElementById('c_telp').value.trim();
    const alamat = document.getElementById('c_alamat').value.trim();
    const kota = document.getElementById('c_kota').value.trim();
    if (!nama || !telp || !alamat || !kota) { showToast('Harap lengkapi data pengiriman!', 'error'); return; }
    _checkoutData.customer = {
      nama, telepon: telp,
      email: document.getElementById('c_email').value,
      alamat, kota,
      provinsi: document.getElementById('c_prov').value,
      kodePos: document.getElementById('c_kodepos').value
    };
  }
  checkoutStep++;
  renderCheckoutStep();
}

function prevCheckoutStep() {
  checkoutStep--;
  renderCheckoutStep();
}

function selectPayment(method) {
  window._selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('pay_' + method).classList.add('selected');
}

async function submitOrder(total, ongkir) {
  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

  const res = await apiPost({
    action: 'createOrder',
    items: cart,
    customer: _checkoutData.customer,
    payment: { metode: window._selectedPayment || 'transfer' },
    shipping: { biaya: ongkir, kurir: 'JNE' }
  });

  if (res.status === 'ok') {
    const payInfo = res.paymentInfo;
    document.getElementById('checkoutContent').innerHTML = `
      <div style="text-align:center;padding:32px 16px;">
        <div style="font-size:64px;margin-bottom:16px;">🎉</div>
        <div style="font-size:22px;font-weight:800;color:var(--accent-green);margin-bottom:8px;">Pesanan Berhasil!</div>
        <div style="font-size:14px;color:var(--text-muted);margin-bottom:20px;">ID Pesanan: <strong>${res.orderId}</strong></div>
        <div style="background:var(--primary-light);border-radius:var(--radius);padding:20px;text-align:left;margin-bottom:20px;">
          <div style="font-weight:700;margin-bottom:12px;">💳 Info Pembayaran</div>
          <pre style="font-size:13px;white-space:pre-wrap;color:var(--text-main);">${JSON.stringify(payInfo, null, 2).replace(/[{}"]/g, '').replace(/,/g, '').trim()}</pre>
          <div style="margin-top:12px;color:var(--shopee-red);font-weight:700;">Total: ${formatRupiah(res.total)}</div>
        </div>
        <div style="font-size:13px;color:var(--text-muted);">Selesaikan pembayaran dalam 24 jam untuk konfirmasi pesanan.</div>
        <button class="btn-primary" style="margin-top:20px;width:100%;" onclick="closeModal('checkoutModal')">
          <i class="fas fa-home"></i> Kembali Belanja
        </button>
      </div>`;
    cart = [];
    saveCart();
    document.querySelectorAll('#checkoutSteps .step').forEach(s => s.className = 'step done');
    showToast('Pesanan berhasil dibuat! 🎉', 'success');
  } else {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Buat Pesanan';
    showToast(res.message || 'Gagal membuat pesanan', 'error');
  }
}

