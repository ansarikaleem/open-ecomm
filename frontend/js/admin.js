document.addEventListener('DOMContentLoaded', function() {
  checkAdminAuth();
  
  // Load appropriate content based on page
  if (window.location.pathname.includes('admin/products.html')) {
    loadAdminProducts();
    setupProductForm();
  } else if (window.location.pathname.includes('admin/categories.html')) {
    loadAdminCategories();
    setupCategoryForm();
  }
});

// Get cookie
function getCookie(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
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
    }
  } catch (err) {
    window.location.href = '../login.html';
  }
}

async function loadAdminProducts() {
  try {
    const token = getCookie('jwt');
    const response = await fetch('http://localhost:3000/api/v1/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    const products = data.data.products;
    const tableBody = document.getElementById('products-table-body');
    
    let html = '';
    
    products.forEach(product => {
      html += `
        <tr>
          <td>${product.id}</td>
          <td>${product.name}</td>
          <td>$${product.price.toFixed(2)}</td>
          <td>${product.stock_quantity}</td>
          <td>
            <button class="btn-edit" data-id="${product.id}">Edit</button>
            <button class="btn-delete" data-id="${product.id}">Delete</button>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', handleEditProduct);
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', handleDeleteProduct);
    });
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

async function handleEditProduct(e) {
  const productId = e.target.dataset.id;
  
  try {
    const token = getCookie('jwt');
    const response = await fetch(`http://localhost:3000/api/v1/products/${productId}`, {
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
    
    // Change form to edit mode
    document.getElementById('product-form-title').textContent = 'Edit Product';
    document.getElementById('product-submit-btn').textContent = 'Update Product';
  } catch (err) {
    console.error('Error loading product for edit:', err);
  }
}

async function handleDeleteProduct(e) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  const productId = e.target.dataset.id;
  
  try {
    const token = getCookie('jwt');
    const response = await fetch(`http://localhost:3000/api/v1/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      loadAdminProducts();
    }
  } catch (err) {
    console.error('Error deleting product:', err);
  }
}

function setupProductForm() {
  const form = document.getElementById('product-form');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const productData = Object.fromEntries(formData);
    
    try {
      const token = getCookie('jwt');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      let response;
      
      if (productData.id) {
        // Update existing product
        response = await fetch(`http://localhost:3000/api/v1/products/${productData.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        response = await fetch('http://localhost:3000/api/v1/products', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(productData)
        });
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Reset form and reload products
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-form-title').textContent = 'Add New Product';
        document.getElementById('product-submit-btn').textContent = 'Add Product';
        loadAdminProducts();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  });
}