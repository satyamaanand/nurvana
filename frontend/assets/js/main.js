/*
  Nurvana - Online Plant Nursery Management System
  Unified Global JavaScript Controller (Vanilla JS)
  Handles Navigation, Cart Drawer, Wishlist, Notifications, Loader, and Auth status.
*/

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Layout and Common Elements
  initGlobalUI();

  // 2. Load and Sync Cart
  initCart();

  // 3. Load and Sync Wishlist
  initWishlist();

  // 4. Update Header Nav & Actions based on login status
  updateNavbarState();

  // 5. Scroll Header Behavior
  window.addEventListener('scroll', handleHeaderScroll);
  handleHeaderScroll(); // Trigger initially

  // 6. Enforce Client-Side Route Protection
  enforceClientRouteProtection();
});

// ==========================================================================
// 1. Global UI & Common Layout Helpers
// ==========================================================================
function initGlobalUI() {
  // Mobile Nav Toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Inject Cart Drawer if it doesn't exist in HTML
  if (!document.querySelector('.cart-drawer')) {
    const overlay = document.createElement('div');
    overlay.className = 'cart-drawer-overlay';
    document.body.appendChild(overlay);

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-drawer-header">
        <h3 class="cart-drawer-title">Shopping Cart (<span id="cart-drawer-count-val">0</span>)</h3>
        <button class="cart-drawer-close">&times;</button>
      </div>
      <div class="cart-drawer-body" id="cart-drawer-items-list">
        <!-- Dynamically injected items -->
      </div>
      <div class="cart-drawer-footer">
        <div class="cart-subtotal-row">
          <span>Subtotal</span>
          <span class="cart-subtotal-val" id="cart-drawer-subtotal">₹0.00</span>
        </div>
        <a href="pay.html" class="btn btn-primary btn-block" id="cart-checkout-btn">Proceed to Checkout</a>
      </div>
    `;
    document.body.appendChild(drawer);

    // Bind Close Events
    const closeBtn = drawer.querySelector('.cart-drawer-close');
    closeBtn.addEventListener('click', () => toggleCartDrawer(false));
    overlay.addEventListener('click', () => toggleCartDrawer(false));
  }

  // Global event delegation for Cart Drawer toggle triggers
  document.body.addEventListener('click', (e) => {
    // Open cart drawer trigger (any button/link with .js-cart-trigger or icon-btn representing cart)
    const cartTrigger = e.target.closest('.js-cart-trigger') || e.target.closest('[data-action="open-cart"]');
    if (cartTrigger) {
      e.preventDefault();
      toggleCartDrawer(true);
    }
  });

  // Global event delegation for newsletter form submissions (since footer is present globally)
  document.body.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'newsletter-form') {
      e.preventDefault();
      showToast('Thank you for subscribing!', 'success');
      e.target.reset();
    }
  });

  // Global event delegation for delivery location button
  document.body.addEventListener('click', (e) => {
    const locBtn = e.target.closest('#location-select-btn');
    if (locBtn) {
      e.preventDefault();
      const currentZip = localStorage.getItem('delivery_zip') || '';
      const zip = prompt('Enter your Delivery Pincode / Zip Code:', currentZip);
      if (zip !== null) {
        const trimmed = zip.trim();
        if (trimmed) {
          localStorage.setItem('delivery_zip', trimmed);
          showToast(`Location set to ${trimmed}!`, 'success');
        } else {
          localStorage.removeItem('delivery_zip');
          showToast('Location cleared.', 'info');
        }
        updateNavbarState(); // refresh navbar locations
      }
    }
  });

  // Inject Edit Profile Modal if it doesn't exist in HTML
  if (!document.getElementById('edit-profile-modal-overlay')) {
    const editModal = document.createElement('div');
    editModal.id = 'edit-profile-modal-overlay';
    editModal.className = 'modal-overlay';
    editModal.innerHTML = `
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Profile</h3>
          <span class="modal-close" id="edit-profile-close-trigger" style="font-size: 1.5rem; cursor: pointer;">&times;</span>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <form id="edit-profile-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Full Name</label>
              <input type="text" id="edit-profile-name" required class="form-control" style="width: 100%; background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.95rem; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Phone Number</label>
              <input type="tel" id="edit-profile-phone" required class="form-control" style="width: 100%; background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.95rem; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">New Password (leave blank to keep current)</label>
              <input type="password" id="edit-profile-password" placeholder="••••••••" class="form-control" style="width: 100%; background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.95rem; box-sizing: border-box;">
            </div>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px; display: flex; width: 100%;">Save Changes</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(editModal);

    // Bind Close Events
    const closeTrigger = editModal.querySelector('#edit-profile-close-trigger');
    const closeModal = () => editModal.classList.remove('active');
    if (closeTrigger) closeTrigger.addEventListener('click', closeModal);
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeModal();
    });
  }

  // Global submit delegation for edit-profile-form
  document.body.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'edit-profile-form') {
      e.preventDefault();
      const name = document.getElementById('edit-profile-name').value.trim();
      const phone = document.getElementById('edit-profile-phone').value.trim();
      const password = document.getElementById('edit-profile-password').value;

      const bodyData = { name, phone };
      if (password) bodyData.password = password;

      try {
        const res = await authFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(bodyData)
        });

        if (res.success) {
          showToast('Profile updated successfully!', 'success');
          // Update user info in localStorage
          const userInfo = getUserInfo() || {};
          userInfo.name = name;
          localStorage.setItem('nurvana_user', JSON.stringify(userInfo));

          // Hide modal
          const editModal = document.getElementById('edit-profile-modal-overlay');
          if (editModal) editModal.classList.remove('active');

          // Refresh layout
          updateNavbarState();
          
          // Dispatch a custom event to sync details on other pages (e.g. account page)
          document.dispatchEvent(new Event('profileUpdated'));
        } else {
          showToast(res.message || 'Failed to update profile.', 'error');
        }
      } catch (err) {
        console.error('Error saving profile modifications:', err);
        showToast('Error updating profile settings.', 'error');
      }
    }
  });
}

function handleHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (header) {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
      header.style.backgroundColor = 'rgba(251, 251, 248, 0.95)';
      header.style.height = '70px';
      header.style.boxShadow = 'var(--shadow-sm)';
    } else {
      header.classList.remove('scrolled');
      header.style.backgroundColor = 'rgba(251, 251, 248, 0.85)';
      header.style.height = 'var(--header-height)';
      header.style.boxShadow = 'none';
    }
  }
}

// ==========================================================================
// 2. Shopping Cart Management
// ==========================================================================
let cart = [];

function initCart() {
  // Load from local storage
  const storedCart = localStorage.getItem('nurvana_cart');
  if (storedCart) {
    try {
      cart = JSON.parse(storedCart);
    } catch (e) {
      cart = [];
    }
  }

  // Listen for DB synchronization on cart updates
  document.addEventListener('cartSynced', () => {
    const syncedCart = localStorage.getItem('nurvana_cart');
    if (syncedCart) {
      try {
        cart = JSON.parse(syncedCart);
        renderCartDrawer();
        updateCartBadges();
      } catch (e) {}
    }
  });

  // Fetch cart from backend if logged in
  if (isLoggedIn()) {
    fetchBackendCart();
  } else {
    renderCartDrawer();
    updateCartBadges();
  }

  // Cart Drawer Item Controls (delegated inside cart drawer)
  const cartList = document.getElementById('cart-drawer-items-list');
  if (cartList) {
    cartList.addEventListener('click', async (e) => {
      const target = e.target;
      const plantId = target.getAttribute('data-id');
      if (!plantId) return;

      if (target.classList.contains('btn-dec')) {
        // Decrease Qty
        updateCartItemQty(plantId, -1);
      } else if (target.classList.contains('btn-inc')) {
        // Increase Qty
        updateCartItemQty(plantId, 1);
      } else if (target.classList.contains('cart-item-delete')) {
        // Delete Item
        await removeCartItem(plantId);
      }
    });
  }
}

async function fetchBackendCart() {
  try {
    const res = await authFetch('/cart');
    if (res.success && res.data) {
      // Map database format to local format
      cart = res.data.items.map(item => ({
        id: item.plant._id,
        name: item.plant.name,
        price: item.plant.price,
        image: item.plant.images[0] || '../assets/images/product-preview.png',
        qty: item.quantity,
        stock: item.plant.stock
      }));
      localStorage.setItem('nurvana_cart', JSON.stringify(cart));
      renderCartDrawer();
      updateCartBadges();
    }
  } catch (error) {
    console.error('Error fetching backend cart:', error);
    renderCartDrawer();
    updateCartBadges();
  }
}

function toggleCartDrawer(isOpen) {
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.cart-drawer-overlay');
  if (drawer && overlay) {
    if (isOpen) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      renderCartDrawer();
    } else {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }
  }
}

function renderCartDrawer() {
  const listContainer = document.getElementById('cart-drawer-items-list');
  const subtotalContainer = document.getElementById('cart-drawer-subtotal');
  const countContainer = document.getElementById('cart-drawer-count-val');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (!listContainer) return;

  if (cart.length === 0) {
    listContainer.innerHTML = `
      <div class="cart-empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shopping-bag"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <p class="mt-2">Your shopping cart is empty.</p>
        <a href="plants.html" class="btn btn-secondary btn-sm mt-3" style="width:auto; display:inline-flex;">Browse Plants</a>
      </div>
    `;
    if (subtotalContainer) subtotalContainer.innerText = '₹0.00';
    if (countContainer) countContainer.innerText = '0';
    if (checkoutBtn) {
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '0.5';
    }
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.style.pointerEvents = 'all';
    checkoutBtn.style.opacity = '1';
  }

  let totalItems = 0;
  let totalPrice = 0;

  listContainer.innerHTML = cart.map(item => {
    totalItems += item.qty;
    totalPrice += item.price * item.qty;

    return `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
          <div class="cart-item-controls">
            <div class="qty-selector">
              <button class="qty-btn btn-dec" data-id="${item.id}">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn btn-inc" data-id="${item.id}">+</button>
            </div>
            <button class="cart-item-delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalContainer) subtotalContainer.innerText = `₹${totalPrice.toFixed(2)}`;
  if (countContainer) countContainer.innerText = totalItems.toString();
}

function updateCartBadges() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartBadges = document.querySelectorAll('.cart-badge-count');
  cartBadges.forEach(badge => {
    badge.innerText = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  });
}

// Add Item to Cart (Accessible from other scripts)
async function addToCart(plantId, name, price, image, stock = 10) {
  let item = cart.find(i => i.id === plantId);
  if (item) {
    if (item.qty >= stock) {
      showToast(`Only ${stock} items available in stock.`, 'error');
      return;
    }
    item.qty += 1;
  } else {
    cart.push({
      id: plantId,
      name,
      price: parseFloat(price),
      image: image || '../assets/images/product-preview.png',
      qty: 1,
      stock
    });
  }

  localStorage.setItem('nurvana_cart', JSON.stringify(cart));
  renderCartDrawer();
  updateCartBadges();
  showToast(`${name} added to cart!`, 'success');

  // Open the drawer automatically
  toggleCartDrawer(true);

  // Sync to database if logged in
  if (isLoggedIn()) {
    try {
      const targetQty = cart.find(i => i.id === plantId).qty;
      await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ plantId, quantity: targetQty })
      });
    } catch (e) {
      console.error('Error syncing cart addition:', e);
    }
  }
}

async function updateCartItemQty(plantId, change) {
  let item = cart.find(i => i.id === plantId);
  if (!item) return;

  const targetQty = item.qty + change;
  if (targetQty <= 0) {
    await removeCartItem(plantId);
    return;
  }

  const maxStock = item.stock || 10;
  if (targetQty > maxStock) {
    showToast(`Only ${maxStock} items available in stock.`, 'error');
    return;
  }

  item.qty = targetQty;
  localStorage.setItem('nurvana_cart', JSON.stringify(cart));
  renderCartDrawer();
  updateCartBadges();

  if (isLoggedIn()) {
    try {
      await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ plantId, quantity: item.qty })
      });
    } catch (e) {
      console.error('Error syncing cart qty update:', e);
    }
  }
}

async function removeCartItem(plantId) {
  const item = cart.find(i => i.id === plantId);
  cart = cart.filter(i => i.id !== plantId);
  localStorage.setItem('nurvana_cart', JSON.stringify(cart));
  renderCartDrawer();
  updateCartBadges();

  if (item) {
    showToast(`${item.name} removed from cart.`, 'info');
  }

  if (isLoggedIn()) {
    try {
      await authFetch(`/cart/${plantId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Error syncing cart removal:', e);
    }
  }
}

// ==========================================================================
// 3. Wishlist Management
// ==========================================================================
let wishlist = [];

function initWishlist() {
  const storedWishlist = localStorage.getItem('nurvana_wishlist');
  if (storedWishlist) {
    try {
      wishlist = JSON.parse(storedWishlist);
    } catch (e) {
      wishlist = [];
    }
  }

  if (isLoggedIn()) {
    fetchBackendWishlist();
  } else {
    updateWishlistBadges();
  }
}

async function fetchBackendWishlist() {
  try {
    const res = await authFetch('/wishlist');
    if (res.success && res.data) {
      wishlist = res.data.plants.map(p => p._id);
      localStorage.setItem('nurvana_wishlist', JSON.stringify(wishlist));
      updateWishlistBadges();
      // Dispatch an event so custom page renderers can update heart active states
      document.dispatchEvent(new Event('wishlistLoaded'));
    }
  } catch (error) {
    console.error('Error fetching wishlist:', error);
  }
}

function updateWishlistBadges() {
  const count = wishlist.length;
  const badges = document.querySelectorAll('.wishlist-badge-count');
  badges.forEach(badge => {
    badge.innerText = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

async function toggleWishlist(plantId, name = 'Plant') {
  if (!isLoggedIn()) {
    showToast('Please login to manage your wishlist.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1));
    }, 1200);
    return false;
  }

  const isLiked = wishlist.includes(plantId);
  try {
    if (isLiked) {
      // Remove
      wishlist = wishlist.filter(id => id !== plantId);
      localStorage.setItem('nurvana_wishlist', JSON.stringify(wishlist));
      updateWishlistBadges();
      showToast(`${name} removed from wishlist.`, 'info');

      await authFetch(`/wishlist/${plantId}`, {
        method: 'DELETE'
      });
    } else {
      // Add
      wishlist.push(plantId);
      localStorage.setItem('nurvana_wishlist', JSON.stringify(wishlist));
      updateWishlistBadges();
      showToast(`${name} added to wishlist!`, 'success');

      await authFetch('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ plantId })
      });
    }

    // Toggle styling locally in any list
    const heartBtns = document.querySelectorAll(`.product-card-wishlist[data-id="${plantId}"]`);
    heartBtns.forEach(btn => {
      btn.classList.toggle('active', !isLiked);
    });

    return true;
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    return false;
  }
}

// ==========================================================================
// 4. Header Navigation & User Profile Dropdown States
// ==========================================================================
function updateNavbarState() {
  const headerContainer = document.querySelector('.header-container');
  if (!headerContainer) return;

  // Dynamically restructure header layout if not done yet
  let headerLeft = headerContainer.querySelector('.header-left');
  let headerCenter = headerContainer.querySelector('.header-center');
  let headerRight = headerContainer.querySelector('.header-right');

  if (!headerLeft || !headerCenter || !headerRight) {
    const logoEl = headerContainer.querySelector('.site-logo');
    const navEl = headerContainer.querySelector('nav');
    const actionsEl = headerContainer.querySelector('.header-actions');

    headerLeft = document.createElement('div');
    headerLeft.className = 'header-left';
    if (logoEl) headerLeft.appendChild(logoEl);

    headerCenter = document.createElement('div');
    headerCenter.className = 'header-center';

    headerRight = document.createElement('div');
    headerRight.className = 'header-right';

    if (navEl) headerRight.appendChild(navEl);
    if (actionsEl) {
      headerRight.appendChild(actionsEl);
    } else {
      const newActions = document.createElement('div');
      newActions.className = 'header-actions';
      headerRight.appendChild(newActions);
    }

    headerContainer.innerHTML = '';
    headerContainer.appendChild(headerLeft);
    headerContainer.appendChild(headerCenter);
    headerContainer.appendChild(headerRight);
  }

  // Clean up old location button if it exists in headerLeft
  const oldLocBtn = headerLeft.querySelector('#location-select-btn');
  if (oldLocBtn) {
    oldLocBtn.remove();
  }

  // Update Search form state
  let searchForm = headerCenter.querySelector('.search-form');
  if (!searchForm) {
    searchForm = document.createElement('form');
    searchForm.action = 'plants.html';
    searchForm.method = 'GET';
    searchForm.className = 'search-form';
    searchForm.style.width = '100%';
    headerCenter.appendChild(searchForm);
  }
  const urlParams = new URLSearchParams(window.location.search);
  const searchVal = urlParams.get('search') || '';
  searchForm.innerHTML = `
    <input type="text" name="search" class="search-input" placeholder="What are you looking for?" value="${searchVal.replace(/"/g, '&quot;')}" required />
    <button type="submit" class="search-submit-btn" title="Search">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    </button>
  `;

  const navMenu = headerRight.querySelector('.nav-menu');
  const headerActions = headerRight.querySelector('.header-actions');

  if (!navMenu || !headerActions) return;

  const currentPath = window.location.pathname;
  const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

  const user = getUserInfo();
  const loggedIn = isLoggedIn();

  // Parse URL tab query parameters for admin page active states
  const tabParam = new URLSearchParams(window.location.search).get('tab');

  // Role-based Navigation Menu Links
  let menuHTML = '';

  if (!loggedIn) {
    // Guest: Home, Plants, About, Contact, Sign In (mobile), Register (mobile)
    menuHTML = `
      <li class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}"><a href="index.html" class="nav-link">Home</a></li>
      <li class="${currentPage === 'plants.html' ? 'active' : ''}"><a href="plants.html" class="nav-link">Plants</a></li>
      <li class="${currentPage === 'about.html' ? 'active' : ''}"><a href="about.html" class="nav-link">About</a></li>
      <li class="${currentPage === 'contact.html' ? 'active' : ''}"><a href="contact.html" class="nav-link">Contact</a></li>
      <li class="mobile-only"><a href="login.html" class="nav-link">Sign In</a></li>
      <li class="mobile-only"><a href="signup.html" class="nav-link">Register</a></li>
    `;
  } else if (user && user.role === 'admin') {
    // Admin: Dashboard, Plants, Orders, Users, Message Logs, Logout (mobile)
    menuHTML = `
      <li class="${currentPage === 'admin-dashboard.html' && (!tabParam || tabParam === 'overview') ? 'active' : ''}"><a href="admin-dashboard.html?tab=overview" class="nav-link">Dashboard</a></li>
      <li class="${currentPage === 'admin-dashboard.html' && tabParam === 'plants' ? 'active' : ''}"><a href="admin-dashboard.html?tab=plants" class="nav-link">Plants</a></li>
      <li class="${currentPage === 'admin-dashboard.html' && tabParam === 'orders' ? 'active' : ''}"><a href="admin-dashboard.html?tab=orders" class="nav-link">Orders</a></li>
      <li class="${currentPage === 'admin-dashboard.html' && tabParam === 'users' ? 'active' : ''}"><a href="admin-dashboard.html?tab=users" class="nav-link">Users</a></li>
      <li class="${currentPage === 'admin-dashboard.html' && tabParam === 'contacts' ? 'active' : ''}"><a href="admin-dashboard.html?tab=contacts" class="nav-link">Message Logs</a></li>
      <li class="mobile-only"><a href="#" id="mobile-logout-btn" class="nav-link" style="color: var(--color-danger);">Logout</a></li>
    `;
  } else {
    // User/Customer: Home, Plants, About, Contact, My Orders, Wishlist (mobile), Profile (mobile), Logout (mobile)
    menuHTML = `
      <li class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}"><a href="index.html" class="nav-link">Home</a></li>
      <li class="${currentPage === 'plants.html' ? 'active' : ''}"><a href="plants.html" class="nav-link">Plants</a></li>
      <li class="${currentPage === 'about.html' ? 'active' : ''}"><a href="about.html" class="nav-link">About</a></li>
      <li class="${currentPage === 'contact.html' ? 'active' : ''}"><a href="contact.html" class="nav-link">Contact</a></li>
      <li class="${currentPage === 'account.html' ? 'active' : ''}"><a href="account.html" class="nav-link">My Orders</a></li>
      <li class="mobile-only ${currentPage === 'wishlist.html' ? 'active' : ''}"><a href="wishlist.html" class="nav-link">Wishlist</a></li>
      <li class="mobile-only"><a href="#" id="mobile-profile-trigger-btn" class="nav-link">Profile</a></li>
      <li class="mobile-only"><a href="#" id="mobile-logout-btn" class="nav-link" style="color: var(--color-danger);">Logout</a></li>
    `;
  }

  navMenu.innerHTML = menuHTML;

  // Redesign Header Actions (Select Address, Wishlist Icon, Cart Drawer Icon, Profile Icon)
  let actionsHTML = '';

  const isAdmin = loggedIn && user && user.role === 'admin';

  if (!isAdmin) {
    // 1. Delivery Location Button (to the left of wishlist)
    const currentZip = localStorage.getItem('delivery_zip');
    const locationText = currentZip ? `Deliver to ${currentZip}` : 'Select Delivery Location';
    actionsHTML += `
      <button id="location-select-btn" class="location-btn desktop-only" title="Select Delivery Location" style="margin-right: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-dark);">${locationText}</span>
      </button>
    `;

    // 2. Wishlist Icon (if logged in, goes to wishlist, if not, triggers login warning)
    actionsHTML += `
      <a href="${loggedIn ? 'wishlist.html' : 'login.html'}" class="action-icon-btn desktop-only" title="My Wishlist">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span class="badge-count wishlist-badge-count" style="display:none;">0</span>
      </a>
    `;

    // 3. Cart Drawer Trigger (Classic Cart Icon SVG)
    actionsHTML += `
      <button class="action-icon-btn js-cart-trigger" title="Shopping Cart" data-action="open-cart">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <span class="badge-count cart-badge-count" style="display:none;">0</span>
      </button>
    `;
  }

  // 4. Auth/Profile Trigger
  if (loggedIn && user) {
    const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    actionsHTML += `
      <div class="profile-dropdown-wrapper desktop-only" style="position: relative; display: inline-block;">
        <button class="action-icon-btn" id="profile-dropdown-btn" title="${user.name}">
          <span style="font-size: 0.85rem; font-weight: 800; background-color: var(--primary); color: var(--bg-primary); width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border-color);">${userInitial}</span>
        </button>
        <div class="profile-dropdown-menu" id="profile-dropdown-menu" style="display: none; position: absolute; right: 0; top: 120%; width: 200px; background-color: var(--bg-white); border: 1px solid var(--border-color); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 1010; padding: 8px 0;">
          <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-color); font-weight: 700; font-size: 0.85rem; color: var(--text-dark);">${user.name}</div>
          ${isAdmin ? '<a href="#" id="edit-profile-trigger-btn" style="display: block; padding: 10px 16px; font-size: 0.9rem;">My Profile</a>' : '<a href="#" id="edit-profile-trigger-btn" style="display: block; padding: 10px 16px; font-size: 0.9rem;">Edit Profile</a>'}
          <a href="#" id="global-logout-btn" style="display: block; padding: 10px 16px; font-size: 0.9rem; color: var(--color-danger); border-top: 1px solid var(--border-color);">Logout</a>
        </div>
      </div>
    `;
  } else {
    actionsHTML += `
      <a href="login.html" class="btn btn-primary btn-sm desktop-only" style="padding: 8px 18px;">Sign In</a>
    `;
  }

  // Add Hamburger icon at the end (mobile screen size only)
  actionsHTML += `
    <button class="mobile-nav-toggle">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  `;

  headerActions.innerHTML = actionsHTML;

  // Re-bind Mobile Toggle
  const newMobileToggle = headerActions.querySelector('.mobile-nav-toggle');
  if (newMobileToggle) {
    newMobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Bind Profile Dropdown click handler
  const profileBtn = document.getElementById('profile-dropdown-btn');
  const profileMenu = document.getElementById('profile-dropdown-menu');
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.style.display = profileMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      profileMenu.style.display = 'none';
    });
  }

  // Bind Edit Profile click handler
  const editProfileBtn = document.getElementById('edit-profile-trigger-btn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      // Fetch details from backend /me to populate name and phone
      try {
        const res = await authFetch('/auth/me');
        if (res.success && res.data) {
          const user = res.data;
          document.getElementById('edit-profile-name').value = user.name || '';
          document.getElementById('edit-profile-phone').value = user.phone || '';
          document.getElementById('edit-profile-password').value = '';
          
          const editModal = document.getElementById('edit-profile-modal-overlay');
          if (editModal) editModal.classList.add('active');
        }
      } catch (err) {
        console.error('Error fetching user profile info:', err);
        showToast('Failed to retrieve profile data.', 'error');
      }
    });
  }

  // Bind Logout Button (dropdown)
  const logoutBtn = document.getElementById('global-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Bind Logout Button (navbar menu link)
  const logoutBtnNav = document.getElementById('global-logout-btn-nav');
  if (logoutBtnNav) {
    logoutBtnNav.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Bind Mobile Profile Click Handler
  const mobileProfileBtn = document.getElementById('mobile-profile-trigger-btn');
  if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      navMenu.classList.remove('active');
      try {
        const res = await authFetch('/auth/me');
        if (res.success && res.data) {
          const user = res.data;
          document.getElementById('edit-profile-name').value = user.name || '';
          document.getElementById('edit-profile-phone').value = user.phone || '';
          document.getElementById('edit-profile-password').value = '';
          
          const editModal = document.getElementById('edit-profile-modal-overlay');
          if (editModal) editModal.classList.add('active');
        }
      } catch (err) {
        console.error('Error fetching user profile info:', err);
        showToast('Failed to retrieve profile data.', 'error');
      }
    });
  }

  // Bind Mobile Logout Click Handler
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Bind collapse on link selection to hide mobile nav overlay
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });

  // Update counts
  updateCartBadges();
  updateWishlistBadges();
}

function logoutUser() {
  clearSession();
  localStorage.removeItem('nurvana_cart');
  localStorage.removeItem('nurvana_wishlist');
  showToast('Logged out successfully!', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ==========================================================================
// 5. Client Route Protection Controller
// ==========================================================================
function enforceClientRouteProtection() {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);

  const user = getUserInfo();
  const loggedIn = isLoggedIn();

  // Pages requiring user login
  const protectedUserPages = ['wishlist.html', 'account.html', 'pay.html'];
  // Pages requiring admin login
  const protectedAdminPages = ['admin-dashboard.html'];

  if (protectedAdminPages.includes(currentPage)) {
    if (!loggedIn || !user || user.role !== 'admin') {
      showToast('Access denied. Administrator session required.', 'error');
      setTimeout(() => {
        window.location.href = 'admin-login.html?redirect=' + encodeURIComponent(currentPage);
      }, 1500);
    }
  } else if (protectedUserPages.includes(currentPage)) {
    if (!loggedIn) {
      showToast('Please login to access this page.', 'info');
      setTimeout(() => {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
      }, 1500);
    }
  }
}
