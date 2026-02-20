/**
 * shopkita-products.js
 * Banner, kategori, flash sale, daftar produk, detail produk, affiliasi
 * Butuh: shopkita-config.js, shopkita-core.js
 */

// ===== BANNERS =====
async function loadBanners() {
  const carousel   = document.getElementById('carousel');
  const bannerSide = document.getElementById('bannerSide');

  // Ambil dari API (sheet Banner + 5 produk random)
  let banners = [];
  try {
    const res = await apiGet({ action: 'getBanners' });
    if (res.status === 'ok' && res.data && res.data.length) {
      banners = res.data;
    }
  } catch(e) {}

  // Fallback jika API belum siap
  if (!banners.length) {
    banners = [
      { id:'fb1', judul:'Flash Sale', gambar:'https://placehold.co/900x300/ee4d2d/ffffff?text=Flash+Sale', url:'#' },
      { id:'fb2', judul:'Gratis Ongkir', gambar:'https://placehold.co/900x300/26aa99/ffffff?text=GRATIS+ONGKIR', url:'#' },
      { id:'fb3', judul:'Produk Baru', gambar:'https://placehold.co/900x300/f05537/ffffff?text=PRODUK+BARU', url:'#' }
    ];
  }

  // Pisahkan: banner manual (dari sheet Banner) vs banner produk
  const manualBanners  = banners.filter(b => !b.isProduk);
  const produkBanners  = banners.filter(b => b.isProduk);

  // ── Carousel utama: banner manual dulu, lalu produk ──
  const allSlides = [...manualBanners, ...produkBanners];

  allSlides.forEach((b, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
    slide.style.cursor = b.url && b.url !== '#' ? 'pointer' : 'default';
    if (b.url && b.url !== '#') slide.onclick = () => {
      if (b.isProduk && b.id) openProduct(b.id.replace('prod-',''));
      else window.location.href = b.url;
    };

    // Overlay info untuk banner produk
    const overlay = b.isProduk ? `
      <div style="position:absolute;bottom:0;left:0;right:0;
        background:linear-gradient(transparent,rgba(0,0,0,.65));
        padding:20px 20px 14px;color:white;">
        <div style="font-size:13px;opacity:.85;margin-bottom:2px;">Produk Pilihan</div>
        <div style="font-size:17px;font-weight:800;margin-bottom:4px;">${b.judul}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;font-weight:800;color:#ffde59;">
            Rp${Number(b.harga||0).toLocaleString('id-ID')}
          </span>
          ${b.diskon ? `<span style="background:var(--shopee-red);padding:2px 8px;border-radius:3px;font-size:12px;font-weight:700;">-${b.diskon}</span>` : ''}
          <span style="font-size:12px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;margin-left:auto;">
            Lihat Produk →
          </span>
        </div>
      </div>` : '';

    slide.innerHTML = `<img src="${b.gambar}" alt="${b.judul}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"/>${overlay}`;
    carousel.insertBefore(slide, carousel.querySelector('.prev'));
  });

  // Dots
  const dotsEl = document.getElementById('carouselDots');
  allSlides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goToSlide(i);
    dotsEl.appendChild(d);
  });

  // ── Banner samping: 2 produk random dari produkBanners ──
  const sideItems = produkBanners.length >= 2
    ? produkBanners.slice(0, 2)
    : [
        { judul:'Promo Hari Ini',  gambar:'https://placehold.co/200x130/4ecdc4/ffffff?text=Promo', url:'#', isProduk:false },
        { judul:'Voucher Belanja', gambar:'https://placehold.co/200x130/ff6b9d/ffffff?text=Voucher', url:'#', isProduk:false }
      ];

  bannerSide.innerHTML = sideItems.map(b => `
    <div class="banner-small" style="cursor:pointer;flex:1;position:relative;overflow:hidden;border-radius:8px;"
      onclick="${b.isProduk ? `openProduct('${(b.id||'').replace('prod-','')}')` : `window.location.href='${b.url||'#'}'`}">
      <img src="${b.gambar}" alt="${b.judul}" style="width:100%;height:100%;object-fit:cover;"/>
      <div style="position:absolute;bottom:0;left:0;right:0;
        background:linear-gradient(transparent,rgba(0,0,0,.55));
        padding:8px 10px;color:white;font-size:11px;font-weight:700;">
        ${b.judul}
      </div>
    </div>`).join('');

  autoCarousel();
}

let carouselIdx = 0, carouselTimer;
function carouselMove(dir) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('#carouselDots .dot');
  slides[carouselIdx].classList.remove('active');
  dots[carouselIdx].classList.remove('active');
  carouselIdx = (carouselIdx + dir + slides.length) % slides.length;
  slides[carouselIdx].classList.add('active');
  dots[carouselIdx].classList.add('active');
}
function goToSlide(i) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('#carouselDots .dot');
  slides[carouselIdx].classList.remove('active');
  dots[carouselIdx].classList.remove('active');
  carouselIdx = i;
  slides[i].classList.add('active');
  dots[i].classList.add('active');
}
function autoCarousel() {
  carouselTimer = setInterval(() => carouselMove(1), 4000);
}

// ===== COUNTDOWN =====
function startCountdown() {
  const now   = new Date();
  const end   = new Date(now);
  end.setHours(23, 59, 59, 0);
  function tick() {
    const diff = end - new Date();
    if (diff <= 0) { end.setDate(end.getDate() + 1); return; }
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    document.getElementById('ch').textContent = h;
    document.getElementById('cm').textContent = m;
    document.getElementById('cs').textContent = s;
  }
  tick();
  setInterval(tick, 1000);
}

// ===== KATEGORI =====
async function loadCategories() {
  const res = await apiGet({ action: 'getCategories' });
  const grid = document.getElementById('categoriesGrid');
  const nav  = document.getElementById('navbar');

  const categories = res.status === 'ok' ? res.data : [
    { id: 'all', nama: 'Semua', ikon: '🛍️' },
    { id: 'cat1', nama: 'Pakaian Pria', ikon: '👔' },
    { id: 'cat2', nama: 'Pakaian Wanita', ikon: '👗' },
    { id: 'cat3', nama: 'Sepatu', ikon: '👟' },
    { id: 'cat4', nama: 'Tas', ikon: '👜' },
    { id: 'cat5', nama: 'Kecantikan', ikon: '💄' },
    { id: 'cat6', nama: 'Elektronik', ikon: '📱' },
    { id: 'cat7', nama: 'Rumah', ikon: '🏠' },
    { id: 'cat8', nama: 'Olahraga', ikon: '⚽' },
    { id: 'cat9', nama: 'Buku', ikon: '📚' },
  ];

  grid.innerHTML = categories.slice(0, 10).map(c => `
    <div class="category-item" onclick="filterByCategory('${c.nama}', null)">
      <div class="category-icon">${c.ikon || '🛍️'}</div>
      <div class="category-name">${c.nama}</div>
    </div>`).join('');

  // Add to navbar
  categories.forEach(c => {
    const el = document.createElement('div');
    el.className = 'nav-item';
    el.textContent = c.nama;
    el.onclick = () => filterByCategory(c.nama === 'Semua' ? 'all' : c.nama, el);
    nav.appendChild(el);
  });
}

function filterByCategory(cat, el) {
  currentCategory = cat;
  currentPage = 1;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  loadProducts(true);
}

// ===== FLASH SALE =====
async function loadFlashSale() {
  const res = await apiGet({ action: 'getProducts', sort: 'popular', limit: 10 });
  const container = document.getElementById('flashSale');
  if (res.status !== 'ok' || !res.data.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:20px;">Flash sale akan segera hadir!</div>';
    return;
  }
  container.innerHTML = res.data.map(p => renderProductCard(p, true)).join('');
}

// ===== PRODUK =====
async function loadProducts(reset = false) {
  if (reset) { allProducts = []; currentPage = 1; }
  const grid = document.getElementById('productsGrid');
  if (currentPage === 1) {
    grid.innerHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');
  }

  // Kalau tab Affiliasi → pakai action getAffiliasi
  // Kalau tab Produk Kami → getProducts source=own
  // Kalau Semua → getProducts (backend gabungkan)
  let apiParams;
  if (currentSource === 'affiliate') {
    apiParams = { action:'getAffiliasi', category:currentCategory, page:currentPage, limit:24 };
  } else {
    apiParams = {
      action:   'getProducts',
      category: currentCategory,
      sort:     currentSort,
      source:   currentSource === 'own' ? 'own' : 'all',
      minPrice: document.getElementById('minPrice').value || '',
      maxPrice: document.getElementById('maxPrice').value || '',
      page:     currentPage,
      limit:    24
    };
  }
  const res = await apiGet(apiParams);

  if (res.status !== 'ok') {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);"><i class="fas fa-exclamation-circle" style="font-size:40px;margin-bottom:12px;"></i><br/>Gagal memuat produk. Periksa koneksi &amp; konfigurasi API.</div>';
    return;
  }

  allProducts = currentPage === 1 ? res.data : [...allProducts, ...res.data];
  renderProductGrid();
  document.getElementById('loadMoreBtn').style.display = res.page < res.totalPages ? 'inline-flex' : 'none';
}

function renderProductGrid() {
  const grid = document.getElementById('productsGrid');
  if (!allProducts.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">Produk tidak ditemukan</div>';
    return;
  }
  grid.innerHTML = allProducts.map(p => renderProductCard(p, false)).join('');
}

function renderProductCard(p, compact) {
  const disc       = formatDiscount(p.hargaCoret, p.harga);
  const isAff      = !!p.isAffiliate;
  const platformIco = { Shopee:'🛍', Tokopedia:'🟢', Lazada:'🔵', Bukalapak:'🔴', Amazon:'📦', Blibli:'🔷' };
  const platIcon   = platformIco[p.platform] || '🔗';
  return `
    <div class="product-card ${compact ? '' : 'product-card-full'}" onclick="openProduct('${p.id}')">
      <div class="product-image">
        <img src="${p.gambar || 'https://placehold.co/300x300/f0f0f0/999999?text=No+Image'}" alt="${p.nama}" loading="lazy" onerror="this.src='https://placehold.co/300x300/f0f0f0/999999?text=No+Image'"/>
        ${disc ? `<div class="product-badge badge-sale">-${disc}</div>` : ''}
        ${isAff ? `<div class="badge-affiliate">${platIcon} ${p.platform || 'Affiliate'}</div>` : ''}
        ${!isAff ? `<button class="product-wishlist" onclick="event.stopPropagation();toggleWishlist('${p.id}')"><i class="far fa-heart"></i></button>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.nama}</div>
        <div class="product-price">
          ${formatRupiah(p.harga)}
          ${disc ? `<span class="product-discount">-${disc}</span>` : ''}
        </div>
        ${p.hargaCoret && p.hargaCoret > p.harga ? `<div class="product-price-original">${formatRupiah(p.hargaCoret)}</div>` : ''}
        <div class="product-stats">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="sold-count">${isAff ? `${p.terjual||0} klik` : `Terjual ${p.terjual||0}`}</span>
        </div>
        ${isAff ? `<div class="location-tag"><i class="fas fa-external-link-alt"></i> Beli di ${p.platform||'Partner'}</div>` : '<div class="location-tag"><i class="fas fa-map-marker-alt"></i> Jakarta</div>'}
      </div>
    </div>`;
}

function setSourceTab(source, btn) {
  currentSource = source;
  currentPage   = 1;
  // Update active tab style
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadProducts(true);
}

function applySort() {
  currentSort = document.getElementById('sortSelect').value;
  currentPage = 1;
  loadProducts(true);
}

function loadMore() {
  currentPage++;
  loadProducts(false);
}

// ===== PRODUCT DETAIL =====
async function openProduct(id) {
  const modal = document.getElementById('productModal');
  const content = document.getElementById('productDetailContent');
  modal.classList.add('open');
  content.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;"><div class="spinner"></div></div>';

  const [pRes, rRes] = await Promise.all([
    apiGet({ action: 'getProduct', id }),
    apiGet({ action: 'getReviews', productId: id })
  ]);

  if (pRes.status !== 'ok') {
    content.innerHTML = '<div style="padding:40px;text-align:center;">Produk tidak ditemukan</div>';
    return;
  }
  const p = pRes.data;
  _currentProduct = p; // cache untuk addToCart/buyNow
  const reviews = rRes.data || [];
  const disc = formatDiscount(p.hargaCoret, p.harga);

  content.innerHTML = `
    <div class="product-gallery">
      <div class="gallery-main">
        <img id="galleryMain" src="${p.gambar}" alt="${p.nama}" onerror="this.src='https://placehold.co/400x400/f0f0f0/999999?text=No+Image'"/>
      </div>
      <div class="gallery-thumbs">
        <div class="gallery-thumb active" onclick="switchThumb(this, '${p.gambar}')">
          <img src="${p.gambar}" alt="" onerror="this.src='https://placehold.co/60x60/f0f0f0/999999?text=img'"/>
        </div>
      </div>
    </div>
    <div>
      <div class="product-detail-name">${p.nama}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="color:#ffc107;">${renderStars(p.rating)}</span>
        <span style="font-size:13px;color:var(--text-muted);">${p.rating || 0} (${reviews.length} ulasan)</span>
        <span style="font-size:13px;color:var(--text-muted);">| Terjual ${p.terjual || 0}</span>
      </div>
      <div class="detail-price">
        <span class="detail-price-main">${formatRupiah(p.harga)}</span>
        ${p.hargaCoret && p.hargaCoret > p.harga ? `
          <span class="detail-price-old">${formatRupiah(p.hargaCoret)}</span>
          <span class="detail-price-disc">-${disc}</span>` : ''}
      </div>
      <div class="detail-section">
        <div class="detail-label">Detail Produk</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.7;">${p.deskripsi || '-'}</div>
      </div>
      <div class="detail-section">
        <div style="display:flex;gap:16px;font-size:13px;">
          <div><span style="color:var(--text-muted);">Kondisi:</span> <strong>${p.kondisi || 'Baru'}</strong></div>
          <div><span style="color:var(--text-muted);">Stok:</span> <strong>${p.stok || 0} ${p.satuan || 'pcs'}</strong></div>
          ${p.merek ? `<div><span style="color:var(--text-muted);">Merek:</span> <strong>${p.merek}</strong></div>` : ''}
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Jumlah</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(-1)">−</button>
          <input class="qty-input" type="number" id="qtyInput" value="1" min="1" max="${p.stok || 99}"/>
          <button class="qty-btn" onclick="changeQty(1)">+</button>
        </div>
      </div>
      ${p.isAffiliate ? `
      <div class="detail-section">
        <span class="platform-badge">${{Shopee:'🛍',Tokopedia:'🟢',Lazada:'🔵',Bukalapak:'🔴',Amazon:'📦',Blibli:'🔷'}[p.platform]||'🔗'} ${p.platform || 'Partner'}</span>
        ${p.komisi ? `<span class="platform-badge" style="background:#fffbeb;color:#d97706;border-color:#fde68a;">💰 Komisi ${p.komisi}</span>` : ''}
      </div>
      <div class="detail-actions" style="grid-template-columns:1fr;">
        <button class="affiliate-goto-btn" onclick="goToAffiliate('${p.linkAffiliate}','${p.id}')">
          <i class="fas fa-external-link-alt"></i> Lihat & Beli di ${p.platform || 'Toko Partner'}
        </button>
      </div>
      <div class="affiliate-komisi-note">
        🔗 Anda akan diarahkan ke toko partner. Pembelian melalui link ini mendukung toko kami.
      </div>` : `
      <div class="detail-actions">
        <button class="btn-secondary" onclick="addToCartById('${p.id}')">
          <i class="fas fa-cart-plus"></i> + Keranjang
        </button>
        <button class="btn-primary" onclick="buyNowById('${p.id}')">
          <i class="fas fa-bolt"></i> Beli Sekarang
        </button>
      </div>`}
      ${reviews.length ? `
        <div class="detail-section" style="margin-top:24px;border-top:1px solid var(--border);padding-top:16px;">
          <div class="detail-label">Ulasan Pembeli</div>
          ${reviews.slice(0, 3).map(r => `
            <div style="padding:12px 0;border-bottom:1px solid var(--border);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="width:32px;height:32px;background:var(--shopee-red);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;">${(r.nama||'A').charAt(0)}</div>
                <div>
                  <div style="font-size:13px;font-weight:600;">${r.nama || 'Anonim'}</div>
                  <div style="color:#ffc107;font-size:11px;">${renderStars(r.rating)}</div>
                </div>
              </div>
              <div style="font-size:13px;color:var(--text-muted);">${r.komentar || ''}</div>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}

function changeQty(d) {
  const inp = document.getElementById('qtyInput');
  if (!inp) return;
  inp.value = Math.max(1, parseInt(inp.value || 1) + d);
}

function switchThumb(el, src) {
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('galleryMain').src = src;
}

