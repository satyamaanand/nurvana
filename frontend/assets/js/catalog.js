// Nurvana Catalog Management System
let currentPage = 1;
let totalPages = 1;
let currentCategory = 'All';
let currentSearch = '';
let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', () => {
  // Parse query parameters if they exist
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('category')) {
    const rawCategory = urlParams.get('category').trim();
    // Normalize to database category name formats
    const categoryMapping = {
      'Indoor': 'Indoor Plants',
      'Indoor Plants': 'Indoor Plants',
      'Outdoor': 'Outdoor Plants',
      'Outdoor Plants': 'Outdoor Plants',
      'Flower': 'Flowering Plants',
      'Flowering': 'Flowering Plants',
      'Flowering Plants': 'Flowering Plants',
      'Herbal': 'Herbal & Medicinal Plants',
      'Herbal Plants': 'Herbal & Medicinal Plants',
      'Herbal & Medicinal': 'Herbal & Medicinal Plants',
      'Herbal & Medicinal Plants': 'Herbal & Medicinal Plants',
      'Succulents': 'Succulents & Cacti',
      'Succulents & Cacti': 'Succulents & Cacti',
      'Fruit': 'Fruit Plants',
      'Fruit Plants': 'Fruit Plants',
      'Vegetable': 'Vegetable Plants',
      'Vegetable Plants': 'Vegetable Plants',
      'Air': 'Air Purifying Plants',
      'Air Purifying': 'Air Purifying Plants',
      'Air Purifying Plants': 'Air Purifying Plants',
      'Bonsai': 'Bonsai Plants',
      'Bonsai Plants': 'Bonsai Plants',
      'Hanging': 'Hanging & Creeper Plants',
      'Hanging & Creeper': 'Hanging & Creeper Plants',
      'Hanging & Creeper Plants': 'Hanging & Creeper Plants'
    };
    // Match case-insensitively
    const matchKey = Object.keys(categoryMapping).find(
      key => key.toLowerCase() === rawCategory.toLowerCase()
    );
    currentCategory = matchKey ? categoryMapping[matchKey] : rawCategory;
  }
  if (urlParams.has('search')) {
    currentSearch = urlParams.get('search').trim();
  }

  // Load categories and initial plant list
  initCatalog();

  // Bind Search box triggers
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    if (currentSearch) {
      searchInput.value = currentSearch;
    }
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        fetchPlants();
      }, 400);
    });
  }

  // Bind Sort selector trigger
  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      fetchPlants();
    });
  }

  // Bind category tabs event delegation
  const tabsContainer = document.getElementById('category-filter-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.catalog-tab');
      if (tab) {
        document.querySelectorAll('.catalog-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        currentCategory = tab.getAttribute('data-category');
        currentPage = 1;
        fetchPlants();
      }
    });
  }

  // Update heart icons on wishlist loaded event
  document.addEventListener('wishlistLoaded', () => {
    updateWishlistHearts();
  });
});

// Load everything
async function initCatalog() {
  await fetchCategories();
  await fetchPlants();
}

// Fetch categories from DB and render filter buttons
async function fetchCategories() {
  try {
    const res = await authFetch('/categories');
    const tabsContainer = document.getElementById('category-filter-tabs');
    
    if (res.success && tabsContainer) {
      const categories = res.data;
      
      // Render All tab + DB categories
      tabsContainer.innerHTML = `
        <span class="catalog-tab ${currentCategory === 'All' ? 'active' : ''}" data-category="All">All Plants</span>
        ${categories.map(cat => `
          <span class="catalog-tab ${currentCategory === cat.name ? 'active' : ''}" data-category="${cat.name}">${cat.name}</span>
        `).join('')}
      `;
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

// Fetch plants and render them
async function fetchPlants() {
  const gridContainer = document.getElementById('plant-grid-container');
  if (!gridContainer) return;

  try {
    const endpoint = `/plants?page=${currentPage}&limit=8&category=${currentCategory}&search=${encodeURIComponent(currentSearch)}&sort=${currentSort}`;
    const res = await authFetch(endpoint);

    if (res.success) {
      // Check if we got no plants for a category search, and try fallback
      if ((!res.data || res.data.length === 0) && currentCategory !== 'All') {
        console.warn(`No plants returned from API for category "${currentCategory}". Attempting client-side fallback...`);
        // Fallback: fetch all plants (without category limit, say up to 100)
        const fallbackEndpoint = `/plants?page=1&limit=100&search=${encodeURIComponent(currentSearch)}&sort=${currentSort}`;
        const fallbackRes = await authFetch(fallbackEndpoint);
        
        if (fallbackRes.success && fallbackRes.data && fallbackRes.data.length > 0) {
          // Filter client-side
          const filtered = fallbackRes.data.filter(plant => {
            if (!plant.category || !plant.category.name) return false;
            const plantCat = plant.category.name.toLowerCase();
            const queryCat = currentCategory.toLowerCase();
            
            // Try different match options
            return plantCat === queryCat || 
                   plantCat.startsWith(queryCat) || 
                   queryCat.startsWith(plantCat) ||
                   plantCat.includes(queryCat) || 
                   queryCat.includes(plantCat);
          });
          
          if (filtered.length > 0) {
            console.log(`Fallback success: found ${filtered.length} matching plants client-side.`);
            totalPages = Math.ceil(filtered.length / 8);
            // Paginate client-side for the current page
            const startIndex = (currentPage - 1) * 8;
            const paginatedData = filtered.slice(startIndex, startIndex + 8);
            renderPlantsList(paginatedData);
            renderPaginationControls();
            return;
          }
        }
      }

      totalPages = res.pages;
      renderPlantsList(res.data);
      renderPaginationControls();
    }
  } catch (err) {
    console.error('Error loading plants, trying fallback:', err);
    if (currentCategory !== 'All') {
      try {
        const fallbackEndpoint = `/plants?page=1&limit=100&search=${encodeURIComponent(currentSearch)}&sort=${currentSort}`;
        const fallbackRes = await authFetch(fallbackEndpoint);
        if (fallbackRes.success && fallbackRes.data && fallbackRes.data.length > 0) {
          const filtered = fallbackRes.data.filter(plant => {
            if (!plant.category || !plant.category.name) return false;
            const plantCat = plant.category.name.toLowerCase();
            const queryCat = currentCategory.toLowerCase();
            return plantCat === queryCat || 
                   plantCat.startsWith(queryCat) || 
                   queryCat.startsWith(plantCat) ||
                   plantCat.includes(queryCat) || 
                   queryCat.includes(plantCat);
          });
          if (filtered.length > 0) {
            totalPages = Math.ceil(filtered.length / 8);
            const startIndex = (currentPage - 1) * 8;
            const paginatedData = filtered.slice(startIndex, startIndex + 8);
            renderPlantsList(paginatedData);
            renderPaginationControls();
            return;
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
    }

    gridContainer.innerHTML = `
      <div style="grid-column: span 4; text-align: center; padding: 40px; color: var(--color-danger);">
        <p style="font-weight: 700;">Could not connect to the database to fetch plants.</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">Ensure the backend Express server is running on port 5000.</p>
      </div>
    `;
  }
}

// Render the grid of plant cards
function renderPlantsList(plants) {
  const gridContainer = document.getElementById('plant-grid-container');
  if (!gridContainer) return;

  if (!plants || plants.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: span 4; text-align: center; padding: 60px; color: var(--text-muted);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <h3 style="font-weight: 700; margin-top: 16px;">No plants found</h3>
        <p style="font-size: 0.95rem; margin-top: 6px;">Try adjusting your search criteria or change categories.</p>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = plants.map(plant => {
    // Check wishlist state
    const isWish = wishlist.includes(plant._id);
    const wishlistClass = isWish ? 'active' : '';

    // Stock state
    let stockBadge = '';
    let isOutOfStock = false;
    if (plant.stock === 0) {
      stockBadge = '<span class="badge badge-danger product-card-badge">Sold Out</span>';
      isOutOfStock = true;
    } else if (plant.stock < 5) {
      stockBadge = `<span class="badge badge-warning product-card-badge">Only ${plant.stock} Left</span>`;
    }

    // Build star rating
    const avgRating = plant.averageRating || 5;
    const starRatingHTML = Array(Math.round(avgRating)).fill('★').join('') + Array(5 - Math.round(avgRating)).fill('☆').join('');

    const imageUrl = plant.images[0] || '../assets/images/product-preview.png';
    const categoryName = plant.category ? plant.category.name : 'Plants';

    return `
      <div class="product-card" data-id="${plant._id}">
        <div class="product-card-img-wrapper">
          ${stockBadge}
          <a href="details.html?id=${plant._id}">
            <img src="${imageUrl}" alt="${plant.name}">
          </a>
          <button class="product-card-wishlist ${wishlistClass}" data-id="${plant._id}" onclick="event.stopPropagation(); handleCatalogWishlistToggle('${plant._id}', '${plant.name}')" title="Add to Wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        </div>
        <div class="product-card-info">
          <span class="product-card-category">${categoryName}</span>
          <h3 class="product-card-name"><a href="details.html?id=${plant._id}">${plant.name}</a></h3>
          <div class="product-card-rating">
            ${starRatingHTML}
            <span>(${plant.numReviews || 0})</span>
          </div>
          <div class="product-card-footer">
            <span class="product-card-price">₹${plant.price.toFixed(2)}</span>
            ${isOutOfStock 
              ? `<button class="btn btn-secondary btn-sm" disabled style="padding: 6px 12px; font-size:0.8rem;">Sold Out</button>`
              : `<button class="product-card-cart-btn" onclick="addToCart('${plant._id}', '${plant.name}', ${plant.price}, '${imageUrl}', ${plant.stock})" title="Add to Cart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                 </button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Update wishlist hearts to match global state
function updateWishlistHearts() {
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const plantId = card.getAttribute('data-id');
    const heart = card.querySelector('.product-card-wishlist');
    if (plantId && heart) {
      heart.classList.toggle('active', wishlist.includes(plantId));
    }
  });
}

// Wishlist toggle handler for catalog cards
async function handleCatalogWishlistToggle(plantId, name) {
  const toggled = await toggleWishlist(plantId, name);
  if (toggled) {
    updateWishlistHearts();
  }
}

// Render pagination page buttons
function renderPaginationControls() {
  const pagContainer = document.getElementById('pagination-container');
  if (!pagContainer) return;

  if (totalPages <= 1) {
    pagContainer.innerHTML = '';
    return;
  }

  let pagHTML = `
    <button class="pag-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    pagHTML += `
      <button class="pag-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
    `;
  }

  pagHTML += `
    <button class="pag-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;

  pagContainer.innerHTML = pagHTML;
}

// Handle page clicks
window.changePage = (pageNum) => {
  if (pageNum >= 1 && pageNum <= totalPages) {
    currentPage = pageNum;
    fetchPlants();
    // Scroll smoothly to grid top
    const grid = document.getElementById('plant-grid-container');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};
