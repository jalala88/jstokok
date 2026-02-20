/**
 * shopkita-config.js
 * Konfigurasi & state global ShopKita
 * Ganti API_URL dengan URL Web App Google Apps Script Anda
 * 
 * Usage (di Blogspot Template):
 *   <script src="https://cdn.jsdelivr.net/gh/USERNAME/shopkita-assets@latest/shopkita-config.js"></script>
 */

// ============================================================
// KONFIGURASI - GANTI INI!
// ============================================================
const API_URL = 'GANTI_DENGAN_URL_WEB_APP_GOOGLE_APPS_SCRIPT';
const STORE_NAME = 'ShopKita';
// ============================================================


// ============================================================
// STATE GLOBAL
// ============================================================
let cart          = JSON.parse(localStorage.getItem('shopkita_cart') || '[]');
let currentPage   = 1;
let currentCategory = 'all';
let currentSort   = '';
let currentSource = 'all'; // 'all' | 'own' | 'affiliate'
let currentUser   = JSON.parse(localStorage.getItem('shopkita_user') || 'null');
let allProducts   = [];
let checkoutStep  = 0;
let _currentProduct = null;
let _checkoutData = {};
let carouselIdx   = 0;
let carouselTimer;
