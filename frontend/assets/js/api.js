// Nurvana API Wrapper & Utilities
const API_URL = window.location.origin + '/api';

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Get logged in user info
function getUserInfo() {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
}

// Set login session
function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('userInfo', JSON.stringify(user));
}

// Clear login session
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
}

// Auth Fetch Helper - Automatically appends Authorization header
async function authFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    ...options.headers,
  };

  // If body is not FormData, set Content-Type to JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Get token
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    showLoader();
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    hideLoader();

    if (!response.ok) {
      // If unauthorized, logout
      if (response.status === 401) {
        clearSession();
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    hideLoader();
    console.error(`API Fetch Error (${endpoint}):`, error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Global Loader Controls
function showLoader() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
    `;
    document.body.appendChild(loader);
  }
  loader.classList.add('active');
}

function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.remove('active');
  }
}

// Toast Notification Manager
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  const icon = type === 'success' 
    ? '<i class="fa fa-check-circle"></i>' 
    : type === 'error' 
      ? '<i class="fa fa-exclamation-circle"></i>' 
      : '<i class="fa fa-info-circle"></i>';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  // Auto-remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 4000);
}

// Cart Sync utilities
async function syncCartWithDB() {
  if (!isLoggedIn()) return;
  
  try {
    const localCartStr = localStorage.getItem('nurvana_cart');
    if (!localCartStr) return;
    
    const localCart = JSON.parse(localCartStr);
    if (!localCart || localCart.length === 0) return;

    // Map local cart items to API sync format
    const syncItems = localCart.map(item => ({
      plantId: item.id,
      quantity: item.qty
    }));

    const res = await authFetch('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items: syncItems })
    });

    if (res.success) {
      console.log('Cart synchronized with server.');
      // Re-save synced server cart to local storage format
      const updatedLocalCart = res.data.items.map(item => ({
        id: item.plant._id,
        name: item.plant.name,
        price: item.plant.price,
        image: item.plant.images[0] || '../assets/images/product-preview.png',
        qty: item.quantity
      }));
      localStorage.setItem('nurvana_cart', JSON.stringify(updatedLocalCart));
      // Dispatch cart updated event
      document.dispatchEvent(new Event('cartUpdated'));
    }
  } catch (error) {
    console.error('Cart sync error:', error);
  }
}
