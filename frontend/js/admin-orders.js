document.addEventListener('DOMContentLoaded', function() {
  // Check admin authentication
  checkAdminAuth();

  // DOM Elements
  const ordersTable = document.getElementById('orders-table');
  const statusFilter = document.getElementById('order-status-filter');
  const dateRangeFilter = document.getElementById('date-range-filter');
  const searchInput = document.getElementById('order-search');

  // Event Listeners
  statusFilter.addEventListener('change', loadOrders);
  dateRangeFilter.addEventListener('change', loadOrders);
  searchInput.addEventListener('input', loadOrders);

  // Load initial data
  loadOrders();

  // Functions
  async function loadOrders() {
    try {
      const token = getCookie('jwt');
      const status = statusFilter.value;
      const dateRange = dateRangeFilter.value;
      const searchQuery = searchInput.value.trim();
      
      let url = 'http://localhost:3000/api/v1/orders';
      const params = new URLSearchParams();
      
      if (status !== 'all') params.append('status', status);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      if (searchQuery) params.append('search', searchQuery);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      renderOrdersTable(data.data.orders);
    } catch (err) {
      console.error('Error loading orders:', err);
      showAlert('error', 'Failed to load orders');
    }
  }

  function renderOrdersTable(orders) {
    ordersTable.innerHTML = orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.user_id ? `User ${order.user_id}` : 'Guest'}</td>
        <td>${new Date(order.created_at).toLocaleDateString()}</td>
        <td>${order.items.length}</td>
        <td>$${order.total_amount.toFixed(2)}</td>
        <td><span class="status-badge ${order.status}">${order.status}</span></td>
        <td>
          <button class="btn-view" data-id="${order.id}">View</button>
          <select class="status-select" data-id="${order.id}">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('');

    // Add event listeners to view buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', handleViewOrder);
    });

    // Add event listeners to status selects
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', handleStatusChange);
    });
  }

  async function handleViewOrder(e) {
    const orderId = e.target.dataset.id;
    // In a real app, you would show a modal with order details
    alert(`Viewing order ${orderId}`);
  }

  async function handleStatusChange(e) {
    const orderId = e.target.dataset.id;
    const newStatus = e.target.value;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(`http://localhost:3000/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', 'Order status updated successfully');
        loadOrders();
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      showAlert('error', 'Failed to update order status');
      loadOrders(); // Refresh to show correct status
    }
  }

  function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.querySelector('.main-content').prepend(alertDiv);
    
    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  async function checkAdminAuth() {
    const token = getCookie('jwt');
    
    if (!token) {
      window.location.href = '../login.html';
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.data.user.role !== 'admin') {
        window.location.href = '../index.html';
      } else {
        document.getElementById('admin-username').textContent = data.data.user.username;
      }
    } catch (err) {
      window.location.href = '../login.html';
    }
  }
});