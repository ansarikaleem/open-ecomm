document.addEventListener('DOMContentLoaded', function() {
  // Check admin authentication
  checkAdminAuth();

  // DOM Elements
  const addCategoryBtn = document.getElementById('add-category-btn');
  const categoryFormContainer = document.getElementById('category-form-container');
  const categoryForm = document.getElementById('category-form');
  const cancelCategoryBtn = document.getElementById('cancel-category-btn');
  const categoriesTable = document.getElementById('categories-table');

  // Event Listeners
  addCategoryBtn.addEventListener('click', showCategoryForm);
  cancelCategoryBtn.addEventListener('click', hideCategoryForm);
  categoryForm.addEventListener('submit', handleCategorySubmit);

  // Load initial data
  loadCategories();

  // Functions
  function showCategoryForm() {
    categoryFormContainer.style.display = 'block';
    document.getElementById('category-form-title').textContent = 'Add New Category';
    document.getElementById('category-submit-btn').textContent = 'Add Category';
    categoryForm.reset();
    document.getElementById('category-id').value = '';
  }

  function hideCategoryForm() {
    categoryFormContainer.style.display = 'none';
  }

  async function loadCategories() {
    try {
      const token = getCookie('jwt');
      const response = await fetch('http://localhost:3000/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      renderCategoriesTable(data.data.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
      showAlert('error', 'Failed to load categories');
    }
  }

  function renderCategoriesTable(categories) {
    categoriesTable.innerHTML = categories.map(category => `
      <tr>
        <td>${category.id}</td>
        <td>${category.name}</td>
        <td>${category.description || 'No description'}</td>
        <td>${category.product_count || 0}</td>
        <td>
          <button class="btn-edit" data-id="${category.id}">Edit</button>
          <button class="btn-delete" data-id="${category.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', handleEditCategory);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', handleDeleteCategory);
    });
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(categoryForm);
    const categoryData = Object.fromEntries(formData);

    try {
      const token = getCookie('jwt');
      let response;

      if (categoryData.id) {
        // Update existing category
        response = await fetch(`http://localhost:3000/api/v1/categories/${categoryData.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(categoryData)
        });
      } else {
        // Create new category
        response = await fetch('http://localhost:3000/api/v1/categories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(categoryData)
        });
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', `Category ${categoryData.id ? 'updated' : 'added'} successfully`);
        hideCategoryForm();
        loadCategories();
      }
    } catch (err) {
      console.error('Error saving category:', err);
      showAlert('error', 'Failed to save category');
    }
  }

  async function handleEditCategory(e) {
    const categoryId = e.target.dataset.id;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(`http://localhost:3000/api/v1/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      const category = data.data.category;

      // Populate form
      document.getElementById('category-id').value = category.id;
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-description').value = category.description || '';

      // Show form
      document.getElementById('category-form-title').textContent = 'Edit Category';
      document.getElementById('category-submit-btn').textContent = 'Update Category';
      categoryFormContainer.style.display = 'block';
    } catch (err) {
      console.error('Error loading category:', err);
      showAlert('error', 'Failed to load category');
    }
  }

  async function handleDeleteCategory(e) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    const categoryId = e.target.dataset.id;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(`http://localhost:3000/api/v1/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', 'Category deleted successfully');
        loadCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      showAlert('error', 'Failed to delete category');
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