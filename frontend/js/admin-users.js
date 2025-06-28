document.addEventListener('DOMContentLoaded', function() {
  // Check admin authentication
  checkAdminAuth();

  // DOM Elements
  const addUserBtn = document.getElementById('add-user-btn');
  const userFormContainer = document.getElementById('user-form-container');
  const userForm = document.getElementById('user-form');
  const cancelUserBtn = document.getElementById('cancel-user-btn');
  const usersTable = document.getElementById('users-table');
  const searchInput = document.getElementById('user-search');

  // Event Listeners
  addUserBtn.addEventListener('click', showUserForm);
  cancelUserBtn.addEventListener('click', hideUserForm);
  userForm.addEventListener('submit', handleUserSubmit);
  searchInput.addEventListener('input', loadUsers);

  // Load initial data
  loadUsers();

  // Functions
  function showUserForm() {
    userFormContainer.style.display = 'block';
    document.getElementById('user-form-title').textContent = 'Add New User';
    document.getElementById('user-submit-btn').textContent = 'Add User';
    userForm.reset();
    document.getElementById('user-id').value = '';
    document.getElementById('user-password').required = true;
  }

  function hideUserForm() {
    userFormContainer.style.display = 'none';
  }

  async function loadUsers() {
    try {
      const token = getCookie('jwt');
      const searchQuery = searchInput.value.trim();
      
      let url = 'http://localhost:3000/api/v1/users';
      if (searchQuery) url += `?search=${searchQuery}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      renderUsersTable(data.data.users);
    } catch (err) {
      console.error('Error loading users:', err);
      showAlert('error', 'Failed to load users');
    }
  }

  function renderUsersTable(users) {
    usersTable.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>${new Date(user.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn-edit" data-id="${user.id}">Edit</button>
          <button class="btn-delete" data-id="${user.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', handleEditUser);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', handleDeleteUser);
    });
  }

  async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(userForm);
    const userData = Object.fromEntries(formData);
    
    if (!userData.id && !userData.password) {
      showAlert('error', 'Password is required for new users');
      return;
    }

    try {
      const token = getCookie('jwt');
      let response;

      if (userData.id) {
        // Update existing user
        if (!userData.password) {
          delete userData.password; // Don't update password if not provided
        }
        
        response = await fetch(`http://localhost:3000/api/v1/users/${userData.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
      } else {
        // Create new user
        response = await fetch('http://localhost:3000/api/v1/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', `User ${userData.id ? 'updated' : 'added'} successfully`);
        hideUserForm();
        loadUsers();
      }
    } catch (err) {
      console.error('Error saving user:', err);
      showAlert('error', 'Failed to save user');
    }
  }

  async function handleEditUser(e) {
    const userId = e.target.dataset.id;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(`http://localhost:3000/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      const user = data.data.user;

      // Populate form
      document.getElementById('user-id').value = user.id;
      document.getElementById('user-username').value = user.username;
      document.getElementById('user-email').value = user.email;
      document.getElementById('user-role').value = user.role;
      document.getElementById('user-password').required = false;

      // Show form
      document.getElementById('user-form-title').textContent = 'Edit User';
      document.getElementById('user-submit-btn').textContent = 'Update User';
      userFormContainer.style.display = 'block';
    } catch (err) {
      console.error('Error loading user:', err);
      showAlert('error', 'Failed to load user');
    }
  }

  async function handleDeleteUser(e) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const userId = e.target.dataset.id;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(`http://localhost:3000/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', 'User deleted successfully');
        loadUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showAlert('error', 'Failed to delete user');
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