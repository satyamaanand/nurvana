// Nurvana Plant Details & Reviews Handler
let plantId = null;
let currentPlant = null;

document.addEventListener('DOMContentLoaded', () => {
  // Extract ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  plantId = urlParams.get('id');

  if (!plantId) {
    showToast('No plant ID specified. Returning to catalog.', 'error');
    setTimeout(() => {
      window.location.href = 'buy.html';
    }, 1500);
    return;
  }

  // Load details and reviews
  initDetails();

  // Bind Cart action button
  const cartBtn = document.getElementById('details-add-cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPlant) {
        addToCart(
          currentPlant._id,
          currentPlant.name,
          currentPlant.price,
          currentPlant.images[0] || 'images/product-preview.png',
          currentPlant.stock
        );
      }
    });
  }

  // Bind Wishlist action button
  const wishlistBtn = document.getElementById('details-add-wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (currentPlant) {
        const toggled = await toggleWishlist(currentPlant._id, currentPlant.name);
        if (toggled) {
          updateWishlistButtonUI();
        }
      }
    });
  }
});

// Initializer
async function initDetails() {
  await loadPlantDetails();
  await loadReviews();
}

// Load detailed specs
async function loadPlantDetails() {
  try {
    const res = await authFetch(`/plants/${plantId}`);
    if (res.success && res.data) {
      currentPlant = res.data;
      renderPlantDetails(res.data);
    }
  } catch (err) {
    console.error('Error loading plant specs:', err);
    const mainContainer = document.querySelector('main .container');
    if (mainContainer) {
      mainContainer.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: var(--color-danger);">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h2 style="font-weight:700;">Plant Specs Not Found</h2>
          <p style="margin-top:8px;">This product may have been removed or the ID is invalid.</p>
          <a href="buy.html" class="btn btn-secondary btn-sm mt-3" style="display:inline-flex; width:auto;">Return to Catalog</a>
        </div>
      `;
    }
  }
}

// Render dynamic DOM elements
function renderPlantDetails(plant) {
  // Update page titles
  document.title = `Nurvana - ${plant.name}`;
  const breadcrumbCurrent = document.getElementById('breadcrumb-current-name');
  if (breadcrumbCurrent) breadcrumbCurrent.innerText = plant.name;

  // Image
  const imgElement = document.getElementById('details-plant-img');
  if (imgElement) {
    imgElement.src = plant.images[0] || 'images/product-preview.png';
    imgElement.alt = plant.name;
  }

  // Name & Category
  const nameHeading = document.getElementById('details-plant-name-heading');
  if (nameHeading) nameHeading.innerText = plant.name;
  
  const catBadge = document.getElementById('details-plant-cat');
  if (catBadge) {
    catBadge.innerText = plant.category ? plant.category.name : 'Plants';
  }
  
  // Price
  const priceEl = document.getElementById('details-plant-price');
  if (priceEl) priceEl.innerText = `₹${plant.price.toFixed(2)}`;
  
  // Description
  const descEl = document.getElementById('details-plant-desc');
  if (descEl) descEl.innerText = plant.description;

  // Stock badge
  const stockBadgeContainer = document.getElementById('details-stock-badge');
  const cartBtn = document.getElementById('details-add-cart-btn');

  if (stockBadgeContainer) {
    if (plant.stock === 0) {
      stockBadgeContainer.innerHTML = '<span class="badge badge-danger">Sold Out</span>';
      if (cartBtn) {
        cartBtn.disabled = true;
        cartBtn.innerText = 'Sold Out';
      }
    } else if (plant.stock < 5) {
      stockBadgeContainer.innerHTML = `<span class="badge badge-warning">Only ${plant.stock} Left in Stock</span>`;
      if (cartBtn) {
        cartBtn.disabled = false;
        cartBtn.innerText = 'Add to Cart';
      }
    } else {
      stockBadgeContainer.innerHTML = '<span class="badge badge-success">In Stock</span>';
      if (cartBtn) {
        cartBtn.disabled = false;
        cartBtn.innerText = 'Add to Cart';
      }
    }
  }

  // Star Ratings Summary
  const starsContainer = document.getElementById('details-rating-stars');
  if (starsContainer) {
    const avgRating = plant.averageRating || 5;
    const starRatingHTML = Array(Math.round(avgRating)).fill('★').join('') + Array(5 - Math.round(avgRating)).fill('☆').join('');
    starsContainer.innerHTML = `${starRatingHTML} &nbsp;<span style="color: var(--text-muted); font-size: 0.85rem;">${avgRating.toFixed(1)} / 5.0 (${plant.numReviews || 0} customer reviews)</span>`;
  }

  // Care Instructions Cards
  const careLight = document.getElementById('care-light');
  const careWater = document.getElementById('care-water');
  const careSoil = document.getElementById('care-soil');
  const careTemp = document.getElementById('care-temp');

  if (careLight) careLight.innerText = plant.careInstructions.light || 'Indirect sunlight';
  if (careWater) careWater.innerText = plant.careInstructions.water || 'Water when topsoil dries';
  if (careSoil) careSoil.innerText = plant.careInstructions.soil || 'Well-draining rich soil mix';
  if (careTemp) careTemp.innerText = plant.careInstructions.temperature || '15°C - 30°C';

  // Update Wishlist button visual state
  updateWishlistButtonUI();
}

// Highlight Wishlist button if selected
function updateWishlistButtonUI() {
  const wishlistBtn = document.getElementById('details-add-wishlist-btn');
  if (!wishlistBtn) return;

  const isWish = wishlist.includes(plantId);
  const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isWish ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
  
  if (isWish) {
    wishlistBtn.innerHTML = `${heartSvg} &nbsp;Wishlisted`;
    wishlistBtn.classList.remove('btn-secondary');
    wishlistBtn.classList.add('btn-primary');
    wishlistBtn.style.backgroundColor = 'var(--color-success)';
    wishlistBtn.style.borderColor = 'var(--color-success)';
    wishlistBtn.style.color = '#ffffff';
  } else {
    wishlistBtn.innerHTML = `${heartSvg}`;
    wishlistBtn.classList.remove('btn-primary');
    wishlistBtn.classList.add('btn-secondary');
    wishlistBtn.style.backgroundColor = '';
    wishlistBtn.style.borderColor = '';
    wishlistBtn.style.color = '';
  }
}

// Fetch plant reviews list
async function loadReviews() {
  const reviewsListContainer = document.getElementById('reviews-list-container');
  if (!reviewsListContainer) return;

  try {
    const res = await authFetch(`/reviews/${plantId}`);
    if (res.success) {
      renderReviewsList(res.data);
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
  }

  // Toggle Review Form display depending on auth
  const formWrapper = document.getElementById('write-review-wrapper');
  if (formWrapper) {
    if (isLoggedIn()) {
      formWrapper.innerHTML = `
        <h3 style="font-size: 1.25rem; font-weight:700; margin-bottom: 20px;">Write a review</h3>
        <form id="add-review-form">
          <div class="form-group">
            <label>Your Rating</label>
            <div class="star-input-group">
              <input type="radio" name="rating" id="star-5" value="5" required>
              <label for="star-5">★</label>
              <input type="radio" name="rating" id="star-4" value="4">
              <label for="star-4">★</label>
              <input type="radio" name="rating" id="star-3" value="3">
              <label for="star-3">★</label>
              <input type="radio" name="rating" id="star-2" value="2">
              <label for="star-2">★</label>
              <input type="radio" name="rating" id="star-1" value="1">
              <label for="star-1">★</label>
            </div>
          </div>
          <div class="form-group">
            <label for="review-comment">Review Comments</label>
            <textarea id="review-comment" class="form-control" rows="4" placeholder="Share your experience growing this plant..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
        </form>
      `;
      // Re-bind form submission since we dynamically injected it
      document.getElementById('add-review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitReview();
      });
    } else {
      formWrapper.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
          <p style="font-weight:600; margin-bottom: 12px;">Want to share your feedback?</p>
          <a href="login.html?redirect=details.html?id=${plantId}" class="btn btn-secondary btn-sm" style="display:inline-flex; width:auto;">Login to Review</a>
        </div>
      `;
    }
  }
}

// Render list of review items
function renderReviewsList(reviews) {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;

  if (!reviews || reviews.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px 0; color: var(--text-muted);">
        <p>No reviews yet. Be the first to review this plant!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(rev => {
    // Stars
    const rating = rev.rating || 5;
    const starsHTML = Array(rating).fill('★').join('') + Array(5 - rating).fill('☆').join('');

    const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const reviewerName = rev.user ? rev.user.name : 'Verified Buyer';

    return `
      <div class="review-item">
        <div class="review-header">
          <span class="review-user-name">${reviewerName}</span>
          <span class="review-rating">${starsHTML}</span>
        </div>
        <p class="review-comment">${rev.comment}</p>
        <div class="review-date">Reviewed on ${formattedDate}</div>
      </div>
    `;
  }).join('');
}

// Post a review
async function submitReview() {
  const ratingInput = document.querySelector('input[name="rating"]:checked');
  const commentInput = document.getElementById('review-comment');

  if (!ratingInput) {
    showToast('Please select a star rating.', 'error');
    return;
  }

  const rating = ratingInput.value;
  const comment = commentInput.value.trim();

  try {
    const res = await authFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        plantId,
        rating,
        comment
      })
    });

    if (res.success) {
      showToast('Review submitted successfully!', 'success');
      // Reload plant specs to update aggregate rating and reload reviews list
      await loadPlantDetails();
      await loadReviews();
    }
  } catch (err) {
    // Error notification handled by authFetch
    console.error('Error submitting review:', err);
  }
}
