// Nurvana Administrative Control Panel Logic
let activeTab = 'overview';
let allCategories = [];

document.addEventListener('DOMContentLoaded', () => {
  // Enforce admin login check
  const user = getUserInfo();
  if (!isLoggedIn() || !user || user.role !== 'admin') {
    showToast('Unauthorized access. Admin privileges required.', 'error');
    setTimeout(() => {
      window.location.href = 'admin-login.html?redirect=admin-dashboard.html';
    }, 1500);
    return;
  }

  // Load URL tab parameters if any
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const validTabs = ['overview', 'plants', 'orders', 'users', 'contacts'];
  if (tabParam && validTabs.includes(tabParam)) {
    activeTab = tabParam;
  }

  // Load Categories & Tab content
  initAdminDashboard();

  // Update initial active class on sidebar buttons
  const sidebarBtns = document.querySelectorAll('.admin-sidebar-btn');
  sidebarBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === activeTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Sidebar navigation click handler
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-sidebar-btn');
      if (btn) {
        e.preventDefault();
        document.querySelectorAll('.admin-sidebar-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        activeTab = btn.getAttribute('data-tab');
        switchTabContent();
      }
    });
  }

  // Bind Plant Management forms
  const addPlantForm = document.getElementById('admin-add-plant-form');
  if (addPlantForm) {
    addPlantForm.addEventListener('submit', handleAddPlantSubmit);
  }

  const editPlantForm = document.getElementById('admin-edit-plant-form');
  if (editPlantForm) {
    editPlantForm.addEventListener('submit', handleEditPlantSubmit);
  }

  // Open Add Plant Modal button
  const openAddBtn = document.getElementById('btn-open-add-plant-modal');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      openModal('add-plant-modal-overlay');
    });
  }

  // Event Delegation for action clicks (Edit, Delete, Resolve)
  document.body.addEventListener('click', async (e) => {
    // Delete Plant Click
    const deletePlantBtn = e.target.closest('.admin-delete-plant-btn');
    if (deletePlantBtn) {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this plant?')) {
        const id = deletePlantBtn.getAttribute('data-id');
        await deletePlant(id);
      }
    }

    // Open Edit Plant Modal
    const editPlantBtn = e.target.closest('.admin-edit-plant-btn');
    if (editPlantBtn) {
      e.preventDefault();
      const id = editPlantBtn.getAttribute('data-id');
      await openEditPlantModal(id);
    }

    // Resolve Contact Inquiry
    const resolveInquiryBtn = e.target.closest('.admin-resolve-msg-btn');
    if (resolveInquiryBtn) {
      e.preventDefault();
      const id = resolveInquiryBtn.getAttribute('data-id');
      await resolveInquiry(id);
    }
  });

  // Event Delegation for status selects in Orders Table
  document.body.addEventListener('change', async (e) => {
    const statusSelect = e.target.closest('.admin-order-status-select');
    if (statusSelect) {
      const orderId = statusSelect.getAttribute('data-id');
      const newStatus = statusSelect.value;
      await updateOrderStatus(orderId, newStatus);
    }
  });
});

// Initializer
async function initAdminDashboard() {
  await fetchCategoriesList();
  switchTabContent();
}

// Fetch categories from DB
async function fetchCategoriesList() {
  try {
    const res = await authFetch('/categories');
    if (res.success) {
      allCategories = res.data;
      populateCategorySelects();
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

// Populate select boxes in forms
function populateCategorySelects() {
  const selects = ['add-plant-category', 'edit-plant-category'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = allCategories.map(cat => `
        <option value="${cat._id}">${cat.name}</option>
      `).join('');
    }
  });
}

// Route tab clicks to fetch logic
function switchTabContent() {
  // Hide all sections
  document.querySelectorAll('.admin-tab-section').forEach(sec => sec.style.display = 'none');
  
  // Show active section
  const activeSec = document.getElementById(`admin-section-${activeTab}`);
  if (activeSec) {
    activeSec.style.display = 'block';
  }

  // Trigger data loaders
  if (activeTab === 'overview') {
    loadOverviewStats();
  } else if (activeTab === 'plants') {
    loadPlantsAdminTable();
  } else if (activeTab === 'orders') {
    loadOrdersAdminTable();
  } else if (activeTab === 'users') {
    loadUsersAdminTable();
  } else if (activeTab === 'contacts') {
    loadContactsAdminTable();
  }
}

// ==========================================
// 1. OVERVIEW TAB & CUSTOM CHARTS
// ==========================================
async function loadOverviewStats() {
  try {
    const res = await authFetch('/admin/dashboard');
    if (res.success && res.data) {
      const stats = res.data;
      
      // Update counters
      document.getElementById('counter-users').innerText = stats.totalUsers;
      document.getElementById('counter-plants').innerText = stats.totalPlants;
      document.getElementById('counter-orders').innerText = stats.totalOrders;
      document.getElementById('counter-lowstock').innerText = stats.lowStockAlertsCount;

      // Render Low Stock Table
      const lowStockTbody = document.getElementById('lowstock-table-body');
      if (lowStockTbody) {
        if (stats.lowStockAlerts.length === 0) {
          lowStockTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--color-success); padding:16px;">All plants are well stocked!</td></tr>';
        } else {
          lowStockTbody.innerHTML = stats.lowStockAlerts.map(plant => `
            <tr>
              <td style="padding:10px 0;"><b>${plant.name}</b></td>
              <td style="padding:10px;">₹${plant.price.toFixed(2)}</td>
              <td style="padding:10px 0; text-align:right;"><span style="color:var(--color-danger); font-weight:700;">${plant.stock} units</span></td>
            </tr>
          `).join('');
        }
      }

      // Render Recent Orders Table
      const recentOrdersTbody = document.getElementById('recent-orders-table-body');
      if (recentOrdersTbody) {
        if (stats.recentOrders.length === 0) {
          recentOrdersTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding:16px;">No orders placed yet.</td></tr>';
        } else {
          recentOrdersTbody.innerHTML = stats.recentOrders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'short', day: 'numeric'
            });
            const shortId = order._id.substring(order._id.length - 8).toUpperCase();
            
            const statusLower = order.orderStatus ? order.orderStatus.toLowerCase() : 'pending';
            let statusBadgeClass = 'status-pending';
            if (statusLower === 'confirmed') statusBadgeClass = 'status-confirmed';
            else if (statusLower === 'shipped') statusBadgeClass = 'status-shipped';
            else if (statusLower === 'delivered') statusBadgeClass = 'status-delivered';
            else if (statusLower === 'cancelled') statusBadgeClass = 'status-cancelled';

            const statusDisplay = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);

            return `
              <tr>
                <td style="padding:12px 0;"><b>#${shortId}</b></td>
                <td style="padding:12px;">${order.user ? order.user.name : 'Guest'}</td>
                <td style="padding:12px;">${date}</td>
                <td style="padding:12px; font-weight:700;">₹${order.orderTotal.toFixed(2)}</td>
                <td style="padding:12px 0; text-align:right;"><span class="admin-status-badge ${statusBadgeClass}">${statusDisplay}</span></td>
              </tr>
            `;
          }).join('');
        }
      }

      // Load Plants Category Allocations for Donut Chart
      await loadDonutChartData();

      // Load Sales Totals for Bar Chart
      await loadBarChartData();
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// Generate Conic Gradient Donut Chart based on real plant stock allocations
async function loadDonutChartData() {
  const chartEl = document.getElementById('category-donut-chart');
  const legendEl = document.getElementById('donut-legend-container');
  if (!chartEl || !legendEl) return;

  try {
    const res = await authFetch('/plants?limit=100');
    if (res.success && res.data) {
      const plants = res.data;
      
      // Accumulate stock count per category
      const stockMap = {};
      let totalStock = 0;
      
      plants.forEach(plant => {
        const catName = plant.category ? plant.category.name : 'Plants';
        const qty = plant.stock || 0;
        stockMap[catName] = (stockMap[catName] || 0) + qty;
        totalStock += qty;
      });

      if (totalStock === 0) {
        chartEl.style.background = 'conic-gradient(var(--border-color) 0% 100%)';
        legendEl.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">No stock allocated.</span>';
        return;
      }

      // Palette colors
      const palette = ['#123019', '#5e7a64', '#8ca38f', '#b2c0b4', '#dcded7'];
      let accumulatedPercent = 0;
      let conicGradientString = 'conic-gradient(';
      let legendHTML = '';

      const categories = Object.keys(stockMap);
      categories.forEach((cat, index) => {
        const color = palette[index % palette.length];
        const stockVal = stockMap[cat];
        const percent = (stockVal / totalStock) * 100;
        
        const startPercent = accumulatedPercent.toFixed(1);
        accumulatedPercent += percent;
        const endPercent = accumulatedPercent.toFixed(1);

        conicGradientString += `${color} ${startPercent}% ${endPercent}%, `;
        
        legendHTML += `
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${color};"></span>
            <span>${cat}: ${percent.toFixed(0)}% (${stockVal} units)</span>
          </div>
        `;
      });

      // Strip final comma and close paren
      conicGradientString = conicGradientString.substring(0, conicGradientString.length - 2) + ')';
      
      chartEl.style.background = conicGradientString;
      legendEl.innerHTML = legendHTML;
    }
  } catch (err) {
    console.error('Error rendering donut chart:', err);
  }
}

// Generate sales bar chart based on order revenue metrics
async function loadBarChartData() {
  const container = document.getElementById('bar-chart-container');
  if (!container) return;

  try {
    const res = await authFetch('/admin/orders');
    if (res.success && res.data) {
      const orders = res.data;
      
      // Calculate revenue monthly accumulation (last 6 months)
      const monthlyRevenue = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize last 6 months list
      const last6MonthsKeys = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
        last6MonthsKeys.push(key);
        monthlyRevenue[key] = 0;
      }

      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
        if (monthlyRevenue[key] !== undefined && order.orderStatus?.toLowerCase() !== 'cancelled') {
          monthlyRevenue[key] += order.orderTotal;
        }
      });

      // Find max revenue value to scale bar heights
      const maxRevenue = Math.max(...Object.values(monthlyRevenue), 1000); // minimum scale ceiling

      container.innerHTML = last6MonthsKeys.map(month => {
        const rev = monthlyRevenue[month];
        const heightPercent = Math.max((rev / maxRevenue) * 90, 4); // caps max height to 90%, min to 4% for visibility

        return `
          <div class="bar-chart-bar-wrapper">
            <div class="bar-chart-bar" style="height: ${heightPercent}%;" data-val="₹${rev.toFixed(0)}"></div>
            <span class="bar-chart-label">${month}</span>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error rendering bar chart:', err);
  }
}

// ==========================================
// 2. PLANTS INVENTORY MANAGEMENT
// ==========================================
async function loadPlantsAdminTable() {
  const tbody = document.getElementById('admin-plants-table-body');
  if (!tbody) return;

  try {
    const res = await authFetch('/plants?limit=100');
    if (res.success) {
      tbody.innerHTML = res.data.map(plant => {
        const imageUrl = plant.images[0] || '../assets/images/product-preview.png';
        const categoryName = plant.category ? plant.category.name : 'Plants';
        const stockLevel = plant.stock;
        
        let stockBadgeStyle = 'background-color:#d1fae5; color:#059669;';
        if (stockLevel === 0) stockBadgeStyle = 'background-color:#fee2e2; color:#dc2626;';
        else if (stockLevel < 5) stockBadgeStyle = 'background-color:#fef3c7; color:#d97706;';

        return `
          <tr>
            <td><img src="${imageUrl}" alt="${plant.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);"></td>
            <td><b>${plant.name}</b></td>
            <td>${categoryName}</td>
            <td>₹${plant.price.toFixed(2)}</td>
            <td>
              <span class="order-status-badge" style="${stockBadgeStyle}">
                ${stockLevel} units
              </span>
            </td>
            <td>
              <div style="display:flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm admin-edit-plant-btn" data-id="${plant._id}" style="padding:6px 12px; font-size:0.8rem;">
                  Edit
                </button>
                <button class="btn btn-secondary btn-sm admin-delete-plant-btn" data-id="${plant._id}" style="padding:6px 12px; font-size:0.8rem; border-color:var(--color-danger); color:var(--color-danger);">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error fetching admin plants:', err);
  }
}

// Submit Add Plant form
async function handleAddPlantSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await authFetch('/plants', {
      method: 'POST',
      body: formData
    });

    if (res.success) {
      showToast(`${res.data.name} added successfully!`, 'success');
      form.reset();
      closeModal('add-plant-modal-overlay');
      loadPlantsAdminTable();
    }
  } catch (err) {
    console.error('Error adding plant:', err);
  }
}

// Open Edit Plant Modal
async function openEditPlantModal(id) {
  try {
    const res = await authFetch(`/plants/${id}`);
    if (res.success && res.data) {
      const plant = res.data;
      
      document.getElementById('edit-plant-id').value = plant._id;
      document.getElementById('edit-plant-name').value = plant.name;
      document.getElementById('edit-plant-price').value = plant.price;
      document.getElementById('edit-plant-stock').value = plant.stock;
      document.getElementById('edit-plant-category').value = plant.category ? plant.category._id : '';
      document.getElementById('edit-plant-description').value = plant.description;
      
      document.getElementById('edit-care-light').value = plant.careInstructions.light || '';
      document.getElementById('edit-care-water').value = plant.careInstructions.water || '';
      document.getElementById('edit-care-soil').value = plant.careInstructions.soil || '';
      document.getElementById('edit-care-temp').value = plant.careInstructions.temperature || '';

      openModal('edit-plant-modal-overlay');
    }
  } catch (err) {
    console.error('Error editing plant spec details:', err);
  }
}

// Submit Edit Plant Form
async function handleEditPlantSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const id = document.getElementById('edit-plant-id').value;
  const formData = new FormData(form);

  try {
    const res = await authFetch(`/plants/${id}`, {
      method: 'PUT',
      body: formData
    });

    if (res.success) {
      showToast('Plant specification updated successfully!', 'success');
      closeModal('edit-plant-modal-overlay');
      loadPlantsAdminTable();
    }
  } catch (err) {
    console.error('Error updating plant details:', err);
  }
}

// Delete Plant Spec
async function deletePlant(id) {
  try {
    const res = await authFetch(`/plants/${id}`, {
      method: 'DELETE'
    });
    if (res.success) {
      showToast('Plant removed from nursery catalog.', 'success');
      loadPlantsAdminTable();
    }
  } catch (err) {
    console.error('Error deleting plant spec:', err);
  }
}

// ==========================================
// 3. ORDERS MANAGER
// ==========================================
async function loadOrdersAdminTable() {
  const tbody = document.getElementById('admin-orders-table-body');
  if (!tbody) return;

  try {
    const res = await authFetch('/admin/orders');
    if (res.success) {
      tbody.innerHTML = res.data.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        const shortId = order._id.substring(order._id.length - 8).toUpperCase();

        const statuses = [
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
        const statusLower = order.orderStatus ? order.orderStatus.toLowerCase() : 'pending';
        const optionsHTML = statuses.map(s => `
          <option value="${s.value}" ${statusLower === s.value ? 'selected' : ''}>${s.label}</option>
        `).join('');

        return `
          <tr>
            <td><b>#${shortId}</b></td>
            <td>
              <strong>${order.user ? order.user.name : 'Deleted Customer'}</strong><br>
              <span style="color:var(--text-muted); font-size:0.8rem;">${order.user ? order.user.email : ''}</span>
            </td>
            <td>${date}</td>
            <td style="font-weight:700; color:var(--primary);">₹${order.orderTotal.toFixed(2)}</td>
            <td>
              <select class="admin-select-status admin-order-status-select" data-id="${order._id}">
                ${optionsHTML}
              </select>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading admin orders:', err);
  }
}

// Update order status logs
async function updateOrderStatus(orderId, status) {
  try {
    const res = await authFetch(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    if (res.success) {
      showToast(`Order marked as ${status}.`, 'success');
      loadOrdersAdminTable();
    }
  } catch (err) {
    console.error('Error updating order status:', err);
  }
}

// ==========================================
// 4. REGISTERED USERS DIRECTORY
// ==========================================
async function loadUsersAdminTable() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  try {
    const res = await authFetch('/admin/users');
    if (res.success) {
      tbody.innerHTML = res.data.map(user => {
        const date = new Date(user.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        return `
          <tr>
            <td><b>${user.name}</b></td>
            <td>${user.email}</td>
            <td>
              <span class="order-status-badge ${user.role === 'admin' ? 'status-cancelled' : 'status-delivered'}">
                ${user.role.toUpperCase()}
              </span>
            </td>
            <td style="color:var(--text-muted);">${date}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// ==========================================
// 5. CONTACT MESSAGES & INQUIRIES
// ==========================================
async function loadContactsAdminTable() {
  const tbody = document.getElementById('admin-contacts-table-body');
  if (!tbody) return;

  try {
    const res = await authFetch('/contact');
    if (res.success) {
      tbody.innerHTML = res.data.map(msg => {
        const date = new Date(msg.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'short', day: 'numeric'
        });

        const isResolved = msg.status === 'Resolved';
        const statusBadge = isResolved 
          ? '<span class="order-status-badge status-delivered">Resolved</span>' 
          : '<span class="order-status-badge status-pending">Pending</span>';

        const resolveBtn = isResolved 
          ? '' 
          : `<button class="btn btn-primary btn-sm admin-resolve-msg-btn" data-id="${msg._id}" style="font-size:0.8rem; padding:6px 12px;">Resolve</button>`;

        return `
          <tr style="${isResolved ? 'opacity: 0.6;' : ''}">
            <td>
              <strong>${msg.name}</strong><br>
              <span style="color:var(--text-muted); font-size:0.8rem;">${msg.email}</span>
            </td>
            <td>
              <strong>${msg.subject}</strong>
              <p style="color: var(--text-muted); margin-top: 6px; font-size: 0.85rem; line-height:1.4;">${msg.message}</p>
            </td>
            <td>${date}</td>
            <td>${statusBadge}</td>
            <td>${resolveBtn}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading contacts:', err);
  }
}

// Mark inquiries resolved
async function resolveInquiry(id) {
  try {
    const res = await authFetch(`/contact/${id}/resolve`, {
      method: 'PUT'
    });

    if (res.success) {
      showToast('Inquiry resolved successfully.', 'success');
      loadContactsAdminTable();
    }
  } catch (err) {
    console.error('Error resolving contact inquiry:', err);
  }
}
