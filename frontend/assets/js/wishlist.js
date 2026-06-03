// Nurvana User Wishlist Handler

document.addEventListener('DOMContentLoaded', () => {
  // Enforce login
  if (!isLoggedIn()) {
    showToast('Please login to view your wishlist.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=wishlist.html';
    }, 1200);
    return;
  }

  // Load wishlist plants
  loadWishlist();

  // Wishlist actions click delegation
  document.getElementById('wishlist-grid-container').addEventListener('click', async (e) => {
    // Remove item click
    const removeBtn = e.target.closest('.wishlist-remove-btn');
    if (removeBtn) {
      e.preventDefault();
      const plantId = removeBtn.getAttribute('data-id');
      const name = removeBtn.getAttribute('data-name');
      await removeFromWishlist(plantId, name);
    }

    // Move to cart click
    const moveBtn = e.target.closest('.wishlist-move-cart-btn');
    if (moveBtn) {
      e.preventDefault();
      const plantId = moveBtn.getAttribute('data-id');
      const name = moveBtn.getAttribute('data-name');
      const price = parseFloat(moveBtn.getAttribute('data-price'));
      const image = moveBtn.getAttribute('data-image');
      const stock = parseInt(moveBtn.getAttribute('data-stock') || '10', 10);

      // 1. Add to cart drawer
      await addToCart(plantId, name, price, image, stock);
      
      // 2. Remove silently from wishlist in backend
      await removeFromWishlistSilently(plantId);
    }
  });
});

// Fetch user wishlist items
async function loadWishlist() {
  const container = document.getElementById('wishlist-grid-container');
  if (!container) return;

  try {
    const res = await authFetch('/wishlist');
    if (res.success && res.data) {
      renderWishlist(res.data.plants);
    }
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    container.innerHTML = `
      <div style="grid-column: span 4; text-align: center; padding: 40px; color: var(--color-danger);">
        <p style="font-weight: 700;">Failed to load wishlist.</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">Please verify your database connection.</p>
      </div>
    `;
  }
}

// Render wishlist items
function renderWishlist(plants) {
  const container = document.getElementById('wishlist-grid-container');
  if (!container) return;

  if (!plants || plants.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 4; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 16px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <h3 style="font-weight: 700;">Your wishlist is empty</h3>
        <p style="font-size: 0.95rem; margin-top: 6px;">Browse our catalog and tap the heart icon to add plants here.</p>
        <a href="plants.html" class="btn btn-secondary btn-sm mt-3" style="display:inline-flex; width:auto;">Shop Collection</a>
      </div>
    `;
    return;
  }

  container.innerHTML = plants.map(plant => {
    const imageUrl = plant.images[0] || '../assets/images/product-preview.png';
    const isOutOfStock = plant.stock === 0;

    let stockBadge = '';
    if (isOutOfStock) {
      stockBadge = '<span class="badge badge-danger product-card-badge">Sold Out</span>';
    } else if (plant.stock < 5) {
      stockBadge = `<span class="badge badge-warning product-card-badge">Only ${plant.stock} Left</span>`;
    }

    return `
      <div class="product-card" data-id="${plant._id}">
        <div class="product-card-img-wrapper">
          ${stockBadge}
          <a href="details.html?id=${plant._id}">
            <img src="${imageUrl}" alt="${plant.name}">
          </a>
        </div>
        <div class="product-card-info">
          <h3 class="product-card-name" style="margin-bottom: 8px;"><a href="details.html?id=${plant._id}">${plant.name}</a></h3>
          <div class="product-card-price" style="margin-bottom: 20px;">₹${plant.price.toFixed(2)}</div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
            ${isOutOfStock 
              ? `<button class="btn btn-secondary btn-sm" disabled style="font-size: 0.85rem;">Sold Out</button>`
              : `<button class="btn btn-primary btn-sm wishlist-move-cart-btn" 
                  data-id="${plant._id}" 
                  data-name="${plant.name}" 
                  data-price="${plant.price}" 
                  data-image="${imageUrl}"
                  data-stock="${plant.stock}"
                  style="font-size: 0.85rem;">
                  Move to Cart
                 </button>`
            }
            <button class="btn btn-secondary btn-sm wishlist-remove-btn" 
              data-id="${plant._id}" 
              data-name="${plant.name}"
              style="font-size: 0.85rem; border-color: var(--color-danger); color: var(--color-danger);">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Remove item from wishlist
async function removeFromWishlist(plantId, name) {
  try {
    const res = await authFetch(`/wishlist/${plantId}`, {
      method: 'DELETE'
    });

    if (res.success) {
      showToast(`${name || 'Plant'} removed from wishlist.`, 'info');
      // Update local storage
      let localWishlist = JSON.parse(localStorage.getItem('nurvana_wishlist') || '[]');
      localWishlist = localWishlist.filter(id => id !== plantId);
      localStorage.setItem('nurvana_wishlist', JSON.stringify(localWishlist));
      
      // Update badge count
      const badges = document.querySelectorAll('.wishlist-badge-count');
      badges.forEach(badge => {
        badge.innerText = localWishlist.length;
        badge.style.display = localWishlist.length > 0 ? 'flex' : 'none';
      });

      // Re-render list
      renderWishlist(res.data.plants);
    }
  } catch (err) {
    console.error('Error removing from wishlist:', err);
  }
}

// Remove item silently (used during "Move to Cart")
async function removeFromWishlistSilently(plantId) {
  try {
    const res = await authFetch(`/wishlist/${plantId}`, {
      method: 'DELETE'
    });
    if (res.success) {
      let localWishlist = JSON.parse(localStorage.getItem('nurvana_wishlist') || '[]');
      localWishlist = localWishlist.filter(id => id !== plantId);
      localStorage.setItem('nurvana_wishlist', JSON.stringify(localWishlist));
      
      const badges = document.querySelectorAll('.wishlist-badge-count');
      badges.forEach(badge => {
        badge.innerText = localWishlist.length;
        badge.style.display = localWishlist.length > 0 ? 'flex' : 'none';
      });

      renderWishlist(res.data.plants);
    }
  } catch (err) {
    console.error('Silent removal error:', err);
  }
}
