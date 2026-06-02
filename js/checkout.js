// Nurvana Checkout & Dummy Payment Processor

document.addEventListener('DOMContentLoaded', () => {
  // Enforce user login
  if (!isLoggedIn()) {
    showToast('Please login to checkout your cart.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=pay.html';
    }, 1200);
    return;
  }

  // Load and render order summary
  renderOrderSummary();

  // Setup payment methods selectors
  const paymentCards = document.querySelectorAll('.payment-method-card');
  const selectedMethodInput = document.getElementById('selected-payment-method');
  const cardPanel = document.getElementById('card-payment-inputs');
  const upiPanel = document.getElementById('upi-payment-inputs');
  const codPanel = document.getElementById('cod-payment-inputs');

  const cardInputs = cardPanel.querySelectorAll('input, select');
  const upiInputs = upiPanel.querySelectorAll('input');

  function updatePaymentFields(method) {
    if (selectedMethodInput) {
      selectedMethodInput.value = method;
    }

    // Toggle panels
    if (cardPanel) cardPanel.classList.remove('active');
    if (upiPanel) upiPanel.classList.remove('active');
    if (codPanel) codPanel.classList.remove('active');

    if (method === 'card') {
      if (cardPanel) cardPanel.classList.add('active');
      cardInputs.forEach(input => input.setAttribute('required', 'true'));
      upiInputs.forEach(input => input.removeAttribute('required'));
    } else if (method === 'upi') {
      if (upiPanel) upiPanel.classList.add('active');
      upiInputs.forEach(input => input.setAttribute('required', 'true'));
      cardInputs.forEach(input => input.removeAttribute('required'));
    } else if (method === 'cod') {
      if (codPanel) codPanel.classList.add('active');
      cardInputs.forEach(input => input.removeAttribute('required'));
      upiInputs.forEach(input => input.removeAttribute('required'));
    }
  }

  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const method = card.getAttribute('data-method');
      updatePaymentFields(method);
    });
  });

  // Initialize payment panels
  updatePaymentFields('card');

  // Format card number with spaces as typed
  const cardNumberInput = document.getElementById('card-number');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formatted = '';
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += ' ';
        }
        formatted += value[i];
      }
      e.target.value = formatted;
    });
  }

  // Bind form submission
  const checkoutForm = document.getElementById('checkout-payment-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processOrderCheckout();
    });
  }
});

// Compile cart items from local storage and render summary
function renderOrderSummary() {
  const summaryContainer = document.getElementById('checkout-items-summary');
  const grandTotalContainer = document.getElementById('checkout-grand-total');

  if (!summaryContainer) return;

  // Retrieve cart from local storage (synced with main.js)
  const cartStr = localStorage.getItem('nurvana_cart');
  const items = cartStr ? JSON.parse(cartStr) : [];

  if (!items || items.length === 0) {
    summaryContainer.innerHTML = '<div style="text-align: center; padding: 20px 0; color: var(--text-muted);">Your cart is empty.</div>';
    if (grandTotalContainer) grandTotalContainer.innerText = '₹0.00';
    
    // Redirect back to buy page if trying to checkout empty cart
    showToast('Your cart is empty. Redirecting to catalog.', 'info');
    setTimeout(() => {
      window.location.href = 'buy.html';
    }, 1500);
    return;
  }

  summaryContainer.innerHTML = items.map(item => {
    return `
      <div class="summary-item-row">
        <span style="font-weight: 500;">${item.name} <span style="color: var(--text-muted); font-size: 0.85rem;">x${item.qty}</span></span>
        <span style="font-weight: 700; color: var(--primary);">₹${(item.qty * item.price).toFixed(2)}</span>
      </div>
    `;
  }).join('');

  const totalPrice = items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  if (grandTotalContainer) {
    grandTotalContainer.innerText = `₹${totalPrice.toFixed(2)}`;
  }
}

// Handle order checkout logic
async function processOrderCheckout() {
  const cartStr = localStorage.getItem('nurvana_cart');
  const cartItems = cartStr ? JSON.parse(cartStr) : [];

  if (!cartItems || cartItems.length === 0) {
    showToast('Your cart is empty.', 'error');
    return;
  }

  const items = cartItems.map(item => ({
    plant: item.id,
    quantity: item.qty,
    price: item.price
  }));

  const shippingAddress = {
    name: document.getElementById('ship-name').value.trim(),
    street: document.getElementById('ship-street').value.trim(),
    city: document.getElementById('ship-city').value.trim(),
    state: document.getElementById('ship-state').value.trim(),
    zip: document.getElementById('ship-zip').value.trim(),
    phone: document.getElementById('ship-phone').value.trim()
  };

  // Basic validation for shipping fields
  if (!shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.phone) {
    showToast('Please complete all shipping address fields.', 'error');
    return;
  }

  const selectedMethod = document.getElementById('selected-payment-method').value;

  // Conditional validation based on payment method
  if (selectedMethod === 'card') {
    const cardName = document.getElementById('card-name').value.trim();
    const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
    const cardMonth = document.getElementById('expiry_month').value;
    const cardYear = document.getElementById('expiry_year').value;
    const cardCVV = document.getElementById('card-cvv').value.trim();

    if (!cardName || !cardNumber || !cardMonth || !cardYear || !cardCVV) {
      showToast('Please complete all credit card fields.', 'error');
      return;
    }

    // Flexible checkout validation: accept digits of length 15-19
    const cardRegex = /^\d{15,19}$/;
    if (!cardRegex.test(cardNumber) || cardCVV.length < 3 || cardCVV.length > 4) {
      showToast('Please enter a valid credit card and CVV.', 'error');
      return;
    }
  } else if (selectedMethod === 'upi') {
    const upiId = document.getElementById('upi-id').value.trim();
    if (!upiId) {
      showToast('Please enter your UPI ID.', 'error');
      return;
    }
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId)) {
      showToast('Please enter a valid UPI ID (e.g. name@bank).', 'error');
      return;
    }
  }

  try {
    const res = await authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items,
        shippingAddress,
        paymentMethod: selectedMethod
      })
    });

    if (res.success && res.data) {
      showToast('Order placed successfully!', 'success');
      
      // Clear local storage cart
      localStorage.removeItem('nurvana_cart');
      
      // Re-trigger cart counts and drawers
      document.dispatchEvent(new Event('cartSynced'));

      setTimeout(() => {
        window.location.href = `success.html?orderId=${res.data._id}`;
      }, 1200);
    } else {
      showToast(res.message || 'Failed to place order.', 'error');
    }
  } catch (err) {
    console.error('Checkout error:', err);
  }
}

