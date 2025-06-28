let BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
  // Check admin authentication
  checkAdminAuth();

  // DOM Elements
  const addProductBtn = document.getElementById('add-product-btn');
  const productFormContainer = document.getElementById('product-form-container');
  const productForm = document.getElementById('product-form');
  const cancelProductBtn = document.getElementById('cancel-product-btn');
  const productsTable = document.getElementById('products-table');
  const categorySelect = document.getElementById('product-category');

  // Event Listeners
  addProductBtn.addEventListener('click', showProductForm);
  cancelProductBtn.addEventListener('click', hideProductForm);
  productForm.addEventListener('submit', handleProductSubmit);

  // Load initial data
  loadProducts();
  loadCategories();

  // Functions
  function showProductForm() {
    productFormContainer.style.display = 'block';
    document.getElementById('product-form-title').textContent = 'Add New Product';
    document.getElementById('product-submit-btn').textContent = 'Add Product';
    productForm.reset();
    document.getElementById('product-id').value = '';
  }

  function hideProductForm() {
    productFormContainer.style.display = 'none';
  }

  async function loadProducts() {
    try {
      const token = getCookie('jwt');
      const response = await fetch(BASE_URL+'/api/v1/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      renderProductsTable(data.data.products);
    } catch (err) {
      console.error('Error loading products:', err);
      showAlert('error', 'Failed to load products');
    }
  }

  async function loadCategories() {
    try {
      const token = getCookie('jwt');
      const response = await fetch(BASE_URL+'/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      renderCategorySelect(data.data.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  function renderProductsTable(products) {
    productsTable.innerHTML = products.map(product => `
      <tr>
        <td>${product.id}</td>
        <td><img src="${product.image_url || '../images/placeholder-product.jpg'}" alt="${product.name}" width="50"></td>
        <td>${product.name}</td>
        <td>$${parseFloat(product.price).toFixed(2)}</td>
        <td>${product.stock_quantity}</td>
        <td>${product.category_name || 'Uncategorized'}</td>
        <td>
          <button class="btn-edit" data-id="${product.id}">Edit</button>
          <button class="btn-delete" data-id="${product.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', handleEditProduct);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', handleDeleteProduct);
    });
  }

  function renderCategorySelect(categories) {
    categorySelect.innerHTML = `
      <option value="">Select Category</option>
      ${categories.map(category => `
        <option value="${category.id}">${category.name}</option>
      `).join('')}
    `;
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(productForm);
    const productData = Object.fromEntries(formData);
    productData.price = parseFloat(productData.price);
    productData.stock_quantity = parseInt(productData.stock_quantity);
    productData.category_id = productData.category_id || null;

    try {
      const token = getCookie('jwt');
      let response;

      if (productData.id) {
        // Update existing product
        response = await fetch(BASE_URL+`/api/v1/products/${productData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        response = await fetch(BASE_URL+'/api/v1/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', `Product ${productData.id ? 'updated' : 'added'} successfully`);
        hideProductForm();
        loadProducts();
      }
    } catch (err) {
      console.error('Error saving product:', err);
      showAlert('error', 'Failed to save product');
    }
  }

  async function handleEditProduct(e) {
    const productId = e.target.dataset.id;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(BASE_URL+`/api/v1/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      const product = data.data.product;

      // Populate form
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-description').value = product.description || '';
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-stock').value = product.stock_quantity;
      document.getElementById('product-category').value = product.category_id || '';
      document.getElementById('product-image').value = product.image_url || '';

      // Show form
      document.getElementById('product-form-title').textContent = 'Edit Product';
      document.getElementById('product-submit-btn').textContent = 'Update Product';
      productFormContainer.style.display = 'block';
    } catch (err) {
      console.error('Error loading product:', err);
      showAlert('error', 'Failed to load product');
    }
  }

  async function handleDeleteProduct(e) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const productId = e.target.dataset.id;
    
    try {
      const token = getCookie('jwt');
      const response = await fetch(BASE_URL+`/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showAlert('success', 'Product deleted successfully');
        loadProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      showAlert('error', 'Failed to delete product');
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
      const response = await fetch(BASE_URL+'/api/v1/auth/me', {
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