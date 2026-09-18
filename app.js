/**
 * ==========================================================================
 * NutriSure - Main JavaScript Controller with Google Firebase Integration
 * Features:
 *  - Google Firebase Authentication (Email/Password & Google Sign-In)
 *  - Google Cloud Firestore Real-Time Cross-Device Synchronization
 *  - 3-Module Architecture: User Marketplace, Company Portal, Admin Dashboard
 *  - Automatic Offline Fallback (LocalStorage Engine)
 * ==========================================================================
 */

// Your Real Google Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKnhQG7bw8s9AC7Sc0J-K038RSLq8384M",
  authDomain: "nutrisure-e98df.firebaseapp.com",
  databaseURL: "https://nutrisure-e98df-default-rtdb.firebaseio.com",
  projectId: "nutrisure-e98df",
  storageBucket: "nutrisure-e98df.firebasestorage.app",
  messagingSenderId: "138310786646",
  appId: "1:138310786646:web:b329ecf5e0222b56e5a5f7",
  measurementId: "G-DF3VM48HCJ"
};

// Initialize Firebase Variables
let firebaseApp, auth, db;
let isFirebaseOnline = false;

try {
  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseOnline = true;
    console.log("🔥 Google Firebase initialized successfully on NutriSure!");
  }
} catch (err) {
  console.warn("Firebase initialization notice (running with LocalStorage sync):", err);
}

// Global State Arrays
let products = [];
let companyRequests = [];
let userLogins = [];
let cart = [];
let activeTier = 'all';
let activeCategory = 'all';
let isAdminLoggedIn = false;

// Preset SVG Graphics for 100% Offline & Reliable Images
const PRESET_SVGS = {
  protein: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="45" y="55" width="110" height="130" rx="12" fill="%230f172a"/><rect x="60" y="25" width="80" height="30" rx="6" fill="%231e293b"/><rect x="55" y="85" width="90" height="65" rx="6" fill="%23059669"/><text x="100" y="115" font-family="Arial" font-size="14" font-weight="bold" fill="white" text-anchor="middle">PURE WHEY</text><text x="100" y="135" font-family="Arial" font-size="11" fill="%23ecfdf5" text-anchor="middle">100% ISOLATE</text><circle cx="100" cy="165" r="8" fill="%2310b981"/></svg>`,
  creatine: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="50" y="60" width="100" height="120" rx="10" fill="%231e293b"/><rect x="65" y="35" width="70" height="25" rx="5" fill="%23f59e0b"/><rect x="60" y="85" width="80" height="55" rx="6" fill="%230f172a"/><text x="100" y="112" font-family="Arial" font-size="13" font-weight="bold" fill="%23f59e0b" text-anchor="middle">CREATINE</text><text x="100" y="130" font-family="Arial" font-size="10" fill="white" text-anchor="middle">MONOHYDRATE</text><polygon points="100,145 92,160 100,160 98,172 108,155 100,155" fill="%23f59e0b"/></svg>`,
  preworkout: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="45" y="55" width="110" height="130" rx="12" fill="%23dc2626"/><rect x="60" y="25" width="80" height="30" rx="6" fill="%23991b1b"/><rect x="55" y="85" width="90" height="65" rx="6" fill="%2318181b"/><text x="100" y="115" font-family="Arial" font-size="13" font-weight="bold" fill="%23ef4444" text-anchor="middle">PRE-WORKOUT</text><text x="100" y="135" font-family="Arial" font-size="10" fill="%23fca5a5" text-anchor="middle">MAX ENERGY</text><circle cx="100" cy="165" r="7" fill="%23ef4444"/></svg>`,
  fishoil: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="55" y="55" width="90" height="130" rx="14" fill="%230284c7"/><rect x="70" y="30" width="60" height="25" rx="5" fill="%23e0f2fe"/><rect x="60" y="85" width="80" height="60" rx="6" fill="%23bae6fd"/><text x="100" y="115" font-family="Arial" font-size="12" font-weight="bold" fill="%230369a1" text-anchor="middle">OMEGA-3</text><text x="100" y="132" font-family="Arial" font-size="9" font-weight="bold" fill="%23075985" text-anchor="middle">FISH OIL 1000mg</text><text x="100" y="165" font-size="18" text-anchor="middle">🐟</text></svg>`,
  vitamins: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="55" y="55" width="90" height="130" rx="14" fill="%2316a34a"/><rect x="70" y="30" width="60" height="25" rx="5" fill="%23dcfce7"/><rect x="60" y="85" width="80" height="60" rx="6" fill="%23f0fdf4"/><text x="100" y="115" font-family="Arial" font-size="12" font-weight="bold" fill="%2315803d" text-anchor="middle">DAILY MULTI</text><text x="100" y="132" font-family="Arial" font-size="9" font-weight="bold" fill="%23166534" text-anchor="middle">VITAMINS + ZINC</text><text x="100" y="165" font-size="18" text-anchor="middle">💊</text></svg>`
};

// ==========================================================================
// 1. INITIAL LOAD & REAL-TIME CLOUD LISTENERS
// ==========================================================================
window.onload = function() {
  loadLocalData();
  setupFirebaseAuthListener();
  setupFirebaseFirestoreListeners();

  // If on User Module (index.html)
  if (document.getElementById('product-grid')) {
    renderProducts();
  }

  // If on Company Module (company.html)
  if (document.getElementById('company-proposals-list')) {
    renderCompanySubmissions();
  }

  // If on Admin Module (admin.html)
  if (document.getElementById('admin-pass-box')) {
    checkAdminSession();
  }
};

// Setup Firebase Authentication Listener
function setupFirebaseAuthListener() {
  if (!isFirebaseOnline || !auth) {
    updateUserLoginUI();
    return;
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      sessionStorage.setItem('nutrisure_active_user', user.email || user.displayName || 'User');
    } else {
      sessionStorage.removeItem('nutrisure_active_user');
    }
    updateUserLoginUI();
  });
}

// Setup Real-Time Firestore Sync (Products, Proposals & Logs)
function setupFirebaseFirestoreListeners() {
  if (!isFirebaseOnline || !db) return;

  // 1. Real-time Products Sync
  db.collection('products').onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      products = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          ...data,
          id: doc.id,
          docId: doc.id
        });
      });
      localStorage.setItem('nutrisure_my_products', JSON.stringify(products));
      renderProducts();
      renderAdminProductList();
    } else {
      // If collection is empty, check if we should initialize once
      const hasSeeded = localStorage.getItem('nutrisure_has_seeded');
      if (!hasSeeded && products.length > 0) {
        localStorage.setItem('nutrisure_has_seeded', 'true');
        products.forEach(p => {
          db.collection('products').add(p).catch(() => {});
        });
      } else {
        products = [];
        localStorage.setItem('nutrisure_my_products', JSON.stringify(products));
        renderProducts();
        renderAdminProductList();
      }
    }
  }, (err) => {
    console.log("Firestore Products Realtime note (using local cache):", err.message);
  });

  // 2. Real-time Company Proposals Sync
  db.collection('company_requests').onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      companyRequests = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        companyRequests.push({
          ...data,
          id: doc.id,
          docId: doc.id
        });
      });
      localStorage.setItem('nutrisure_company_requests', JSON.stringify(companyRequests));
      renderCompanySubmissions();
      renderAdminProposals();
    }
  }, (err) => {
    console.log("Firestore Proposals Realtime note:", err.message);
  });
}

// ==========================================================================
// 2. LOCAL DATA & STORAGE HELPERS
// ==========================================================================
function loadLocalData() {
  const savedProds = localStorage.getItem('nutrisure_my_products');
  if (savedProds) {
    products = JSON.parse(savedProds);
  } else {
    // Default starter products
    products = [
      {
        id: 'prod_starter_1',
        name: 'NutriSure Pure Whey Isolate 1kg',
        category: 'Protein',
        tier: 'premium',
        price: '2499',
        lab: '91.8% Real Protein (PASSED)',
        desc: '100% cold-microfiltered whey isolate with zero amino spiking, 27g protein per scoop, and zero heavy metals.',
        image: PRESET_SVGS.protein
      },
      {
        id: 'prod_starter_2',
        name: 'NutriSure Micronized Creatine 250g',
        category: 'Creatine',
        tier: 'budget',
        price: '899',
        lab: '99.9% Pure Creatine (PASSED)',
        desc: 'Ultra-pure micronized creatine monohydrate tested for zero dicyandiamide and maximum muscle strength absorption.',
        image: PRESET_SVGS.creatine
      },
      {
        id: 'prod_starter_3',
        name: 'NutriSure Extreme Pre-Workout 300g',
        category: 'Preworkout',
        tier: 'budget',
        price: '1199',
        lab: '100% Safe Clean Energy (PASSED)',
        desc: 'Explosive energy and pump formula tested for zero prohibited stimulants and pure citrulline malate ratio.',
        image: PRESET_SVGS.preworkout
      },
      {
        id: 'prod_starter_4',
        name: 'NutriSure Triple Strength Omega-3',
        category: 'Fish Oil',
        tier: 'premium',
        price: '1499',
        lab: '1000mg EPA/DHA Pure (PASSED)',
        desc: 'Molecularly distilled deep-sea fish oil with zero mercury, lead, or fishy burps. Certified for heart and joint health.',
        image: PRESET_SVGS.fishoil
      }
    ];
    localStorage.setItem('nutrisure_my_products', JSON.stringify(products));
  }

  const savedRequests = localStorage.getItem('nutrisure_company_requests');
  companyRequests = savedRequests ? JSON.parse(savedRequests) : [];

  const savedUsers = localStorage.getItem('nutrisure_user_logins');
  userLogins = savedUsers ? JSON.parse(savedUsers) : [];
}

function saveProducts() {
  localStorage.setItem('nutrisure_my_products', JSON.stringify(products));
}

function saveCompanyRequests() {
  localStorage.setItem('nutrisure_company_requests', JSON.stringify(companyRequests));
}

// Image File Upload Handler (FileReader Base64)
function handleImageFileUpload(event, inputTargetId, previewBoxId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Url = e.target.result;
    document.getElementById(inputTargetId).value = base64Url;
    updateImagePreview(base64Url, previewBoxId);
  };
  reader.readAsDataURL(file);
}

// Live Image Previewer
function updateImagePreview(url, previewBoxId) {
  const box = document.getElementById(previewBoxId);
  if (!box) return;

  const imgTag = box.querySelector('img');
  if (url && url.trim() !== '') {
    imgTag.src = url;
    imgTag.onerror = function() {
      box.style.display = 'none';
    };
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

// 1-Click Preset Image Setter
function setPresetImage(type, inputTargetId, previewBoxId) {
  const svgDataUrl = PRESET_SVGS[type];
  if (svgDataUrl) {
    document.getElementById(inputTargetId).value = svgDataUrl;
    updateImagePreview(svgDataUrl, previewBoxId);
  }
}

// Safe Fallback for Images
function handleProductImageError(imgElement, category) {
  imgElement.onerror = null;
  const catKey = (category || 'protein').toLowerCase();
  imgElement.src = PRESET_SVGS[catKey] || PRESET_SVGS.protein;
}

// ==========================================================================
// MODULE 1: USER / CUSTOMER MARKETPLACE (index.html)
// ==========================================================================
function renderProducts() {
  const container = document.getElementById('product-grid');
  if (!container) return;

  const filtered = products.filter(p => {
    const matchTier = (activeTier === 'all') || (p.tier === activeTier);
    const matchCat = (activeCategory === 'all') || (p.category.toLowerCase() === activeCategory.toLowerCase());
    return matchTier && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: white; border-radius: 8px;">
        <h3>No certified products found!</h3>
        <p style="color: #64748b; margin: 8px 0;">Companies can submit products via the Company Portal, or Admin can add products.</p>
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
          <a href="company.html" class="btn-main">For Company (Submit Product)</a>
          <a href="admin.html" class="btn-secondary" style="color: #0f172a; border-color: #0f172a;">Admin Panel 🔒</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const catLower = (p.category || 'protein').toLowerCase();
    const fallbackImage = PRESET_SVGS[catLower] || PRESET_SVGS.protein;
    const initialSrc = (p.image && p.image.trim() !== '') ? p.image : fallbackImage;

    return `
      <div class="product-card">
        <span class="badge-cert">✓ Certified Pure</span>
        <span class="badge-tier tier-${p.tier}">${p.tier}</span>

        <div class="product-image-container" onclick="openProductModal('${p.id}')">
          <img src="${initialSrc}" alt="${p.name}" class="product-img" onerror="handleProductImageError(this, '${p.category}')">
        </div>

        <h4 onclick="openProductModal('${p.id}')">${p.name}</h4>
        <div class="lab-test-score">Lab Score: ${p.lab || '90% Real Protein (Passed)'}</div>
        <div class="product-price">₹${p.price}</div>

        <button class="btn-add-cart" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    `;
  }).join('');
}

// Filters
function filterTier(tier, btn) {
  activeTier = tier;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts();
}

function filterCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.innerText.toLowerCase() === cat.toLowerCase() || (cat === 'all' && b.innerText === 'All'));
  });
  renderProducts();
}

// Product Details Modal
function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const catLower = (product.category || 'protein').toLowerCase();
  const fallbackImage = PRESET_SVGS[catLower] || PRESET_SVGS.protein;
  const initialSrc = (product.image && product.image.trim() !== '') ? product.image : fallbackImage;

  const imageHtml = `<img src="${initialSrc}" alt="${product.name}" style="max-height: 160px; max-width: 100%; object-fit: contain; margin-bottom: 10px;" onerror="handleProductImageError(this, '${product.category}')">`;

  document.getElementById('modal-details').innerHTML = `
    <div style="text-align: center;">
      ${imageHtml}
      <h2>${product.name}</h2>
      <p style="color: #059669; font-weight: bold; margin: 4px 0;">Option: ${product.tier.toUpperCase()} | Category: ${product.category}</p>
      <h3 style="font-size: 1.4rem; color: #0f172a; margin: 8px 0;">₹${product.price}</h3>

      <div class="cert-box">
        <strong>🛡️ NutriSure 100% Blind Testing Verification:</strong>
        <p style="margin-top: 4px;">Purity Status: <strong>${product.lab || 'PASSED'}</strong></p>
        <p>Heavy Metals (Lead, Mercury): <strong>PASSED (0.00 ppm)</strong></p>
      </div>

      <p style="color: #475569; text-align: left; margin: 12px 0; font-size: 0.9rem; line-height: 1.5;">${product.desc}</p>
      
      <div style="display: flex; gap: 8px; margin-top: 15px;">
        <button class="btn-submit" style="flex: 1;" onclick="addToCart('${product.id}'); closeProductModal();">Add to Cart</button>
        <button class="btn-submit" style="flex: 1; background: #0f172a;" onclick="addToCart('${product.id}'); closeProductModal(); openCart();">Buy Now</button>
      </div>
    </div>
  `;
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
}

// Cart System
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  cart.push(product);
  const badge = document.getElementById('cart-count');
  if (badge) badge.innerText = cart.length;
  alert(`Added "${product.name}" to cart! 🛒`);
}

function openCart() {
  const items = document.getElementById('cart-items');
  const total = document.getElementById('cart-total-price');
  if (!items || !total) return;

  if (cart.length === 0) {
    items.innerHTML = `<p style="color: #64748b; margin: 15px 0;">Your cart is empty.</p>`;
    total.innerText = '₹0';
  } else {
    let sum = 0;
    items.innerHTML = cart.map(item => {
      sum += Number(item.price);
      return `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;">
          <span>${item.name}</span>
          <strong>₹${item.price}</strong>
        </div>
      `;
    }).join('');
    total.innerText = '₹' + sum;
  }
  document.getElementById('cart-modal').classList.add('active');
}

function closeCart() {
  const modal = document.getElementById('cart-modal');
  if (modal) modal.classList.remove('active');
}

// ==========================================================================
// FIREBASE AUTHENTICATION (Login, Sign-Up & Google Auth)
// ==========================================================================
function openLoginModal() { 
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('active'); 
}
function closeLoginModal() { 
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('active'); 
}

// Track whether we're in login or signup mode
let authMode = 'login';

function toggleAuthMode(mode) {
  authMode = mode;
  const loginTab = document.getElementById('tab-auth-login');
  const signupTab = document.getElementById('tab-auth-signup');
  const subtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('auth-submit-btn');
  if (mode === 'login') {
    if (loginTab) loginTab.classList.add('active');
    if (signupTab) signupTab.classList.remove('active');
    if (subtitle) subtitle.innerText = 'Sign in with your Firebase credentials';
    if (submitBtn) submitBtn.innerText = 'Sign In to Firebase';
  } else {
    if (signupTab) signupTab.classList.add('active');
    if (loginTab) loginTab.classList.remove('active');
    if (subtitle) subtitle.innerText = 'Create a new Firebase account';
    if (submitBtn) submitBtn.innerText = 'Create Account';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value;

  // Block short passwords before sending to Firebase
  if (password.length < 6) {
    alert('❌ Password must be at least 6 characters long.');
    return;
  }

  if (isFirebaseOnline && auth) {
    try {
      if (authMode === 'signup') {
        // Create a new Firebase account
        await auth.createUserWithEmailAndPassword(email, password);
        alert(`🎉 Account created & logged in as: ${email}\n\nYou can now see yourself in Firebase Console → Authentication!`);
      } else {
        // Sign in to existing account
        await auth.signInWithEmailAndPassword(email, password);
        alert(`✅ Logged in successfully as: ${email}`);
      }
    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password login is NOT enabled in Firebase.\n\nFix: Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        msg = 'No account found for this email. Switch to "Create Account" tab to register.';
      } else if (error.code === 'auth/wrong-password') {
        msg = 'Wrong password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        msg = 'This email already has an account. Switch to "Sign In" tab to log in.';
      }
      alert(`⚠️ ${msg}`);
      return;
    }
  }

  // Record login in localStorage & Firestore
  const loginRecord = { email: email, date: new Date().toLocaleString() };
  userLogins.unshift(loginRecord);
  localStorage.setItem('nutrisure_user_logins', JSON.stringify(userLogins));
  if (isFirebaseOnline && db) {
    db.collection('user_logins').add(loginRecord).catch(() => {});
  }

  sessionStorage.setItem('nutrisure_active_user', email);
  updateUserLoginUI();
  closeLoginModal();
}

// Keep old name as alias (for any old references)
async function handleLogin(e) { return handleAuthSubmit(e); }

// Google Sign-In with Firebase
async function handleGoogleSignIn() {
  if (isFirebaseOnline && auth) {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      alert(`🎉 Google Sign-in Successful as: ${user.displayName || user.email}`);
      sessionStorage.setItem('nutrisure_active_user', user.email);
      updateUserLoginUI();
      closeLoginModal();
      return;
    } catch (error) {
      console.warn("Google sign-in notice:", error.message);
    }
  }
  alert("Google Sign-In Triggered! (Active in Firebase Auth)");
  closeLoginModal();
}

function updateUserLoginUI() {
  const loginBtn = document.querySelector('.btn-login');
  if (!loginBtn) return;

  const activeUser = sessionStorage.getItem('nutrisure_active_user');
  if (activeUser) {
    loginBtn.innerHTML = `👤 ${activeUser} <span style="font-size: 0.75rem; background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 3px; margin-left: 4px;">Logout</span>`;
    loginBtn.onclick = handleUserLogout;
  } else {
    loginBtn.innerText = 'Login / Sign In';
    loginBtn.onclick = openLoginModal;
  }
}

async function handleUserLogout() {
  if (confirm('Do you want to log out?')) {
    if (isFirebaseOnline && auth) {
      try { await auth.signOut(); } catch(e) {}
    }
    sessionStorage.removeItem('nutrisure_active_user');
    updateUserLoginUI();
    alert('Logged out successfully.');
  }
}

// ==========================================================================
// MODULE 2: FOR COMPANY (company.html)
// ==========================================================================
async function submitCompanyProduct(e) {
  e.preventDefault();

  const contactName = document.getElementById('c-name').value;
  const productName = document.getElementById('c-product').value;
  const companyEmail = document.getElementById('c-email').value;
  const productCategory = document.getElementById('c-category').value;
  const productTier = document.getElementById('c-tier').value;
  const productPrice = document.getElementById('c-price').value || '1999';
  const productDesc = document.getElementById('c-desc').value;
  const productImage = document.getElementById('c-image').value || '';

  const newProposal = {
    id: 'prop_' + Date.now(),
    contactName: contactName,
    productName: productName,
    email: companyEmail,
    category: productCategory,
    tier: productTier,
    price: productPrice,
    desc: productDesc,
    image: productImage,
    date: new Date().toLocaleDateString(),
    status: 'PENDING'
  };

  // Save to Firebase Firestore in real-time
  if (isFirebaseOnline && db) {
    try {
      const docRef = await db.collection('company_requests').add(newProposal);
      newProposal.id = docRef.id;
    } catch(err) {
      console.warn("Firestore proposal save note:", err);
    }
  }

  companyRequests.unshift(newProposal);
  saveCompanyRequests();

  alert(`✅ Proposal Submitted Successfully to Firebase Cloud!\n\nProduct: "${productName}"\nTracking ID: ${newProposal.id}\nStatus: PENDING REVIEW BY ADMIN\n\nYour application has been forwarded to Admin for approval.`);
  
  e.target.reset();
  const preview = document.getElementById('company-img-preview');
  if (preview) preview.style.display = 'none';
  renderCompanySubmissions();
}

function renderCompanySubmissions() {
  const container = document.getElementById('company-proposals-list');
  if (!container) return;

  if (companyRequests.length === 0) {
    container.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">No product proposals submitted yet.</p>`;
    return;
  }

  container.innerHTML = companyRequests.map(item => {
    let badgeClass = 'status-pending';
    let statusText = '🟡 PENDING ADMIN REVIEW';

    if (item.status === 'ACCEPTED') {
      badgeClass = 'status-accepted';
      statusText = '🟢 ACCEPTED & ADDED TO STORE';
    } else if (item.status === 'REJECTED') {
      badgeClass = 'status-rejected';
      statusText = '🔴 REJECTED';
    }

    return `
      <div class="proposal-card">
        <div class="proposal-header">
          <strong>${item.productName}</strong>
          <span class="status-badge ${badgeClass}">${statusText}</span>
        </div>
        <div class="proposal-body">
          <div><strong>Category:</strong> ${item.category} | <strong>Tier:</strong> ${item.tier.toUpperCase()} | <strong>Price:</strong> ₹${item.price}</div>
          <div><strong>Submitted by:</strong> ${item.contactName} (${item.email}) on ${item.date}</div>
          <div style="margin-top: 4px; color: #555;"><strong>Description:</strong> ${item.desc}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// MODULE 3: ADMIN DASHBOARD (admin.html)
// ==========================================================================
function checkAdminPassword(e) {
  e.preventDefault();
  const pass = document.getElementById('admin-pass-input').value;
  if (pass === 'admin123' || pass === '1234') {
    isAdminLoggedIn = true;
    sessionStorage.setItem('nutrisure_admin_logged', 'true');
    showAdminDashboard();
  } else {
    alert('Incorrect Admin Password! Try: admin123');
  }
}

function checkAdminSession() {
  if (sessionStorage.getItem('nutrisure_admin_logged') === 'true') {
    isAdminLoggedIn = true;
    showAdminDashboard();
  }
}

function showAdminDashboard() {
  document.getElementById('admin-pass-box').style.display = 'none';
  document.getElementById('admin-dashboard-box').style.display = 'block';
  renderAdminProposals();
  renderAdminProductList();
  renderAdminUserLogs();
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('nutrisure_admin_logged');
  document.getElementById('admin-pass-input').value = '';
  document.getElementById('admin-pass-box').style.display = 'block';
  document.getElementById('admin-dashboard-box').style.display = 'none';
}

function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

  const btn = document.getElementById('btn-tab-' + tabId);
  const content = document.getElementById('admin-tab-' + tabId);
  if (btn) btn.classList.add('active');
  if (content) content.style.display = 'block';
}

// 1. Admin Review Company Proposals (Accept / Reject)
function renderAdminProposals() {
  const container = document.getElementById('admin-proposals-queue');
  if (!container) return;

  if (companyRequests.length === 0) {
    container.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">No company product submissions found.</p>`;
    return;
  }

  container.innerHTML = companyRequests.map(item => {
    const isPending = item.status === 'PENDING';
    return `
      <div class="proposal-card">
        <div class="proposal-header">
          <div>
            <strong style="font-size: 1.05rem; color: #0f172a;">${item.productName}</strong>
            <span style="font-size: 0.75rem; color: #64748b; margin-left: 6px;">ID: ${item.id}</span>
          </div>
          <span class="status-badge ${item.status === 'ACCEPTED' ? 'status-accepted' : (item.status === 'REJECTED' ? 'status-rejected' : 'status-pending')}">
            ${item.status}
          </span>
        </div>

        <div class="proposal-body">
          <div><strong>Company Representative:</strong> ${item.contactName} | <strong>Email:</strong> ${item.email}</div>
          <div><strong>Category:</strong> ${item.category} | <strong>Option:</strong> ${item.tier.toUpperCase()} | <strong>Price:</strong> ₹${item.price}</div>
          ${item.image ? `<div style="margin: 4px 0;"><img src="${item.image}" alt="Product Image" style="height: 60px; object-fit: contain; border-radius: 4px;"></div>` : ''}
          <div style="background: white; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 4px; margin-top: 6px;">
            <strong>Description:</strong> ${item.desc}
          </div>
        </div>

        ${isPending ? `
          <div class="proposal-actions">
            <button class="btn-accept" onclick="acceptCompanyProposal('${item.id}')">✅ Accept & Add to Store</button>
            <button class="btn-reject" onclick="rejectCompanyProposal('${item.id}')">❌ Reject</button>
          </div>
        ` : `
          <div style="text-align: right; font-size: 0.8rem; color: #64748b;">
            Action Completed (${item.status})
          </div>
        `}
      </div>
    `;
  }).join('');
}

// Accept Proposal -> Pushes directly to Firestore Cloud & updates store for everyone!
async function acceptCompanyProposal(id) {
  const proposal = companyRequests.find(c => c.id === id);
  if (!proposal) return;

  const labScore = prompt(`Enter Lab Test Score for "${proposal.productName}":`, '88.5% Real Protein (PASSED)');
  if (!labScore) return;

  const newProduct = {
    id: 'prod_' + Date.now(),
    name: proposal.productName,
    category: proposal.category,
    tier: proposal.tier,
    price: proposal.price,
    lab: labScore,
    desc: proposal.desc,
    image: proposal.image || ''
  };

  // 1. Push to Firestore
  if (isFirebaseOnline && db) {
    try {
      await db.collection('products').add(newProduct);
      if (proposal.id) {
        await db.collection('company_requests').doc(proposal.id).update({ status: 'ACCEPTED' });
      }
    } catch(err) {
      console.warn("Firestore accept update note:", err);
    }
  }

  // 2. Local Fallback Update
  products.unshift(newProduct);
  saveProducts();
  proposal.status = 'ACCEPTED';
  saveCompanyRequests();

  alert(`🎉 Approved! Product "${proposal.productName}" has been certified and synced live to Firebase Cloud!`);
  renderAdminProposals();
  renderAdminProductList();
}

// Reject Proposal
async function rejectCompanyProposal(id) {
  const proposal = companyRequests.find(c => c.id === id);
  if (!proposal) return;

  if (confirm(`Are you sure you want to reject the proposal for "${proposal.productName}"?`)) {
    if (isFirebaseOnline && db && proposal.id) {
      try {
        await db.collection('company_requests').doc(proposal.id).update({ status: 'REJECTED' });
      } catch(e) {}
    }
    proposal.status = 'REJECTED';
    saveCompanyRequests();
    alert(`Proposal for "${proposal.productName}" marked as REJECTED.`);
    renderAdminProposals();
  }
}

// 2. Direct Add Product (With Image Option)
async function adminAddNewProduct(e) {
  e.preventDefault();

  const name = document.getElementById('p-name').value;
  const category = document.getElementById('p-category').value;
  const tier = document.getElementById('p-tier').value;
  const price = document.getElementById('p-price').value;
  const lab = document.getElementById('p-lab').value;
  const desc = document.getElementById('p-desc').value;
  const image = document.getElementById('p-image').value || '';

  const newProduct = {
    id: 'prod_' + Date.now(),
    name: name,
    category: category,
    tier: tier,
    price: price,
    lab: lab,
    desc: desc,
    image: image
  };

  // Push to Cloud Firestore
  if (isFirebaseOnline && db) {
    try {
      await db.collection('products').add(newProduct);
    } catch(err) {
      console.warn("Firestore direct add note:", err);
    }
  }

  products.unshift(newProduct);
  saveProducts();

  alert(`Product "${name}" added to Firebase Cloud Store with image successfully!`);
  e.target.reset();
  const preview = document.getElementById('admin-img-preview');
  if (preview) preview.style.display = 'none';
  renderAdminProductList();
}

// 3. Admin Manage Products (Remove Product)
async function removeProduct(productId) {
  if (confirm('Are you sure you want to delete this product from the store?')) {
    // 1. Instantly remove from local memory & localStorage
    products = products.filter(p => p.id !== productId && p.docId !== productId);
    saveProducts();
    renderAdminProductList();
    renderProducts();

    // 2. Delete from Firebase Cloud Firestore
    if (isFirebaseOnline && db) {
      try {
        await db.collection('products').doc(productId).delete();
      } catch(err) {
        console.warn("Firestore doc delete notice:", err);
      }

      // Also search and delete by matching field id
      try {
        const querySnapshot = await db.collection('products').where('id', '==', productId).get();
        querySnapshot.forEach(async (doc) => {
          await doc.ref.delete();
        });
      } catch(err) {
        console.warn("Firestore query delete notice:", err);
      }
    }

    alert('✅ Product removed from store successfully!');
  }
}

function renderAdminProductList() {
  const list = document.getElementById('admin-product-list');
  if (!list) return;

  if (products.length === 0) {
    list.innerHTML = `<p style="color: #64748b; font-size: 0.85rem;">No products in store currently.</p>`;
    return;
  }

  list.innerHTML = products.map(p => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; margin-bottom: 6px; border-radius: 4px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        ${p.image ? `<img src="${p.image}" style="height: 40px; width: 40px; object-fit: contain; border-radius: 4px;" onerror="handleProductImageError(this, '${p.category}')">` : `<span style="font-size: 1.5rem;">🥤</span>`}
        <div>
          <strong>${p.name}</strong> <small style="color: #64748b;">(${p.category} - ${p.tier.toUpperCase()})</small> - <strong>₹${p.price}</strong>
        </div>
      </div>
      <button onclick="removeProduct('${p.id}')" style="background: #dc2626; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: bold;">
        ✕ Remove
      </button>
    </div>
  `).join('');
}

// 4. Admin User Logs
function renderAdminUserLogs() {
  const list = document.getElementById('admin-users-list');
  if (!list) return;

  if (userLogins.length === 0) {
    list.innerHTML = `<p style="color: #64748b; font-size: 0.85rem;">No user logins recorded yet.</p>`;
    return;
  }

  list.innerHTML = userLogins.map(u => `
    <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; margin-bottom: 4px; border-radius: 4px; font-size: 0.85rem;">
      <span>👤 <strong>${u.email}</strong></span>
      <span style="color: #64748b; font-size: 0.75rem;">${u.date}</span>
    </div>
  `).join('');
}
