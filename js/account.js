// Nurvana User Account Dashboard & Order Tracker

document.addEventListener('DOMContentLoaded', () => {
  // Enforce login
  if (!isLoggedIn()) {
    showToast('Please login to view your account dashboard.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=account.html';
    }, 1200);
    return;
  }

  // Load profile & orders
  initAccount();

  // Order click event delegation (View Details)
  const tableBody = document.getElementById('orders-table-body');
  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const orderRow = e.target.closest('.order-history-row');
      if (orderRow) {
        const orderId = orderRow.getAttribute('data-id');
        viewOrderDetails(orderId);
      }
    });
  }

  // Bind close modal triggers
  const modalOverlay = document.getElementById('order-details-modal-overlay');
  const closeTrigger = document.getElementById('modal-close-trigger');
  const closeBtn = document.getElementById('modal-close-btn');

  if (modalOverlay) {
    const closeModal = () => modalOverlay.classList.remove('active');

    if (closeTrigger) closeTrigger.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
});

async function initAccount() {
  renderProfileInfo();
  await loadOrderHistory();
}

// Display basic user info
function renderProfileInfo() {
  const user = getUserInfo();
  if (user) {
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.innerText = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.innerText = user.name;
    
    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.innerText = user.email;
    
    const roleEl = document.getElementById('profile-role');
    if (roleEl) {
      roleEl.innerText = user.role === 'admin' ? 'Administrator' : 'Customer';
    }
  }
}

// Fetch user orders from database
async function loadOrderHistory() {
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;

  try {
    const res = await authFetch('/orders/myorders');
    if (res.success) {
      renderOrdersTable(res.data);
    }
  } catch (err) {
    console.error('Error fetching order logs:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--color-danger); padding: 24px;">
          Failed to fetch orders. Please check your network connection.
        </td>
      </tr>
    `;
  }
}

// Render list of orders
function renderOrdersTable(orders) {
  const tableBody = document.getElementById('orders-table-body');
  const emptyState = document.getElementById('orders-empty-state');
  const tableContainer = document.getElementById('orders-table-container');

  if (!tableBody) return;

  if (!orders || orders.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'block';

  tableBody.innerHTML = orders.map(order => {
    const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    const statusLower = order.orderStatus ? order.orderStatus.toLowerCase() : 'pending';
    let statusBadgeClass = 'order-status-pending';
    if (statusLower === 'confirmed') statusBadgeClass = 'order-status-confirmed';
    else if (statusLower === 'shipped') statusBadgeClass = 'order-status-shipped';
    else if (statusLower === 'delivered') statusBadgeClass = 'order-status-delivered';
    else if (statusLower === 'cancelled') statusBadgeClass = 'order-status-cancelled';

    const statusDisplay = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);

    const shortId = order._id.substring(order._id.length - 8).toUpperCase();

    return `
      <tr class="order-history-row" data-id="${order._id}">
        <td><b>#${shortId}</b></td>
        <td>${date}</td>
        <td>₹${order.orderTotal.toFixed(2)}</td>
        <td><span class="order-status-badge ${statusBadgeClass}">${statusDisplay}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 0.8rem;">
            Details &nbsp;➔
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Fetch single order details and pop open modal
async function viewOrderDetails(orderId) {
  try {
    const res = await authFetch(`/orders/${orderId}`);
    if (res.success && res.data) {
      renderOrderModal(res.data);
      // Toggle custom modal
      const modalOverlay = document.getElementById('order-details-modal-overlay');
      if (modalOverlay) modalOverlay.classList.add('active');
    }
  } catch (err) {
    console.error('Error fetching order details:', err);
  }
}

// Render details and visual tracking stepper inside modal
function renderOrderModal(order) {
  // Set Order Header ID
  document.getElementById('modal-order-id-label').innerText = `#${order._id.toUpperCase()}`;
  
  // Render Address
  const addr = order.shippingAddress;
  document.getElementById('modal-shipping-address').innerHTML = `
    <strong>${addr.name}</strong><br>
    ${addr.street}<br>
    ${addr.city}, ${addr.state} - ${addr.zip}<br>
    <div style="margin-top:8px; font-weight:600;">📞 ${addr.phone}</div>
  `;

  // Render Items List
  const itemsContainer = document.getElementById('modal-order-items');
  itemsContainer.innerHTML = order.items.map(item => {
    const plant = item.plant;
    const plantName = plant ? plant.name : 'Unknown Plant';
    const plantImg = plant && plant.images[0] ? plant.images[0] : 'images/product-preview.png';

    return `
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="${plantImg}" alt="${plantName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm); background-color: var(--bg-secondary);">
          <div>
            <h5 style="margin: 0; font-weight: 700; font-size: 0.95rem;">${plantName}</h5>
            <span style="color: var(--text-muted); font-size: 0.8rem;">Qty: ${item.quantity} &times; ₹${item.price.toFixed(2)}</span>
          </div>
        </div>
        <div style="font-weight: 800; color: var(--primary);">
          ₹${(item.quantity * item.price).toFixed(2)}
        </div>
      </div>
    `;
  }).join('');

  // Total Price
  document.getElementById('modal-order-total').innerText = `₹${order.orderTotal.toFixed(2)}`;

  // Render Stepper Tracker
  const stepperWrapper = document.getElementById('modal-tracker-stepper-wrapper');
  const statusLower = order.orderStatus ? order.orderStatus.toLowerCase() : 'pending';
  
  if (statusLower === 'cancelled') {
    stepperWrapper.innerHTML = `
      <div style="margin-top: 15px; background-color: #fee2e2; color: #dc2626; padding: 20px; border-radius: var(--radius-sm); text-align: center; border: 1px solid #fca5a5;">
        <h4 style="font-weight: 800; margin-bottom: 4px;">This order has been cancelled</h4>
        <p style="margin: 0; font-size: 0.85rem;">The products were returned to inventory and payments reverted.</p>
      </div>
    `;
  } else {
    let step1Class = ''; // Placed
    let step2Class = ''; // Confirmed
    let step3Class = ''; // Shipped
    let step4Class = ''; // Delivered
    let progressWidth = '0%';

    if (statusLower === 'pending') {
      step1Class = 'active';
      progressWidth = '0%';
    } else if (statusLower === 'confirmed') {
      step1Class = 'completed';
      step2Class = 'active';
      progressWidth = '33.33%';
    } else if (statusLower === 'shipped') {
      step1Class = 'completed';
      step2Class = 'completed';
      step3Class = 'active';
      progressWidth = '66.66%';
    } else if (statusLower === 'delivered') {
      step1Class = 'completed';
      step2Class = 'completed';
      step3Class = 'completed';
      step4Class = 'active';
      progressWidth = '100%';
    }

    stepperWrapper.innerHTML = `
      <div class="stepper-container">
        <div class="stepper-progress" style="width: ${progressWidth};"></div>
        <div class="step-node ${step1Class}">
          <div class="step-node-dot">1</div>
          <div class="step-node-label">Placed</div>
        </div>
        <div class="step-node ${step2Class}">
          <div class="step-node-dot">2</div>
          <div class="step-node-label">Confirmed</div>
        </div>
        <div class="step-node ${step3Class}">
          <div class="step-node-dot">3</div>
          <div class="step-node-label">Shipped</div>
        </div>
        <div class="step-node ${step4Class}">
          <div class="step-node-dot">4</div>
          <div class="step-node-label">Delivered</div>
        </div>
      </div>
    `;
  }

  // Render Status History Log
  const logsContainer = document.getElementById('modal-tracker-logs');
  if (logsContainer && order.trackingLogs) {
    logsContainer.innerHTML = order.trackingLogs.map(log => {
      const date = new Date(log.date).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const logStatusLower = log.status ? log.status.toLowerCase() : '';
      const logStatusDisplay = logStatusLower ? logStatusLower.charAt(0).toUpperCase() + logStatusLower.slice(1) : '';
      return `
        <li style="margin-bottom: 12px; border-left: 2px solid var(--accent); padding-left: 12px; font-size: 0.85rem;">
          <span style="display: block; font-weight: 700; color: var(--primary);">${logStatusDisplay}</span>
          <span style="display: block; color: var(--text-muted); margin: 2px 0;">${log.message}</span>
          <span style="display: block; font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">${date}</span>
        </li>
      `;
    }).reverse().join(''); // Show latest log first
  }
}

// Sync profile details on update
document.addEventListener('profileUpdated', () => {
  renderProfileInfo();
});
