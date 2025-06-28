document.addEventListener('DOMContentLoaded', function() {
  // loadFeaturedProducts();
  
  // If on products page, load all products
  if (window.location.pathname.includes('products.html')) {
    loadAllProducts();
  }
  
  // If on product details page, load single product
  if (window.location.pathname.includes('product-details.html')) {
    loadProductDetails();
  }
});

async function loadFeaturedProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/products?limit=4');
    const data = await response.json();
    
    const productsContainer = document.getElementById('featured-products');
    
    if (data.data.products.length === 0) {
      productsContainer.innerHTML = '<p>No featured products available</p>';
      return;
    }
    
    let html = '';
    
    data.data.products.forEach(product => {
      html += `
        <div class="product-card">
          <img src="${product.image_url || '/images/placeholder-product.jpg'}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
            <button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>
            <a href="product-details.html?id=${product.id}" class="btn">View Details</a>
          </div>
        </div>
      `;
    });
    
    productsContainer.innerHTML = html;
    
    // Add event listeners to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', addToCart);
    });
  } catch (err) {
    console.error('Error loading featured products:', err);
  }
}

async function loadAllProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/products');
    const data = await response.json();
    
    const productsContainer = document.getElementById('products-grid');
    
    if (data.data.products.length === 0) {
      productsContainer.innerHTML = '<p>No products available</p>';
      return;
    }
    
    let html = '';
    
    data.data.products.forEach(product => {
      html += `
        <div class="product-card">
          <img src="${product.image_url || 'http://localhost:3000/images/placeholder-product.jpg'}" alt="${product.name}">
          <div class="product-info">
            
            
            <a href="product-details.html?id=${product.id}"><h3>${product.name}</h3>
            <p class="price">$${parseFloat(product.price).toFixed(2)}</p></a>
            <button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>
          </div>
        </div>
      `;
    });
    
    productsContainer.innerHTML = html;
    
    // Add event listeners to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', addToCart);
    });
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

async function loadProductDetails() {
  try {
    const productId = new URLSearchParams(window.location.search).get('id');
    
    if (!productId) {
      window.location.href = 'products.html';
      return;
    }
    
    const response = await fetch(`http://localhost:3000/api/v1/products/${productId}`);
    const data = await response.json();
    
    if (!data.data.product) {
      window.location.href = 'products.html';
      return;
    }
    
    const product = data.data.product;
    const detailsContainer = document.getElementById('product-details');
    
    detailsContainer.innerHTML = `
      <div class="product-image">
        <img src="${product.image_url || 'http://localhost:3000/images/placeholder-product.jpg'}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h1>${product.name}</h1>
        <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
        <p class="description">${product.description || 'No description available'}</p>
        <div class="quantity-control">
          <label for="quantity">Quantity:</label>
          <input type="number" id="quantity" name="quantity" min="1" value="1">
        </div>
        <button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>
      </div>
    `;
    
    // Add event listener to cart button
    document.querySelector('.add-to-cart').addEventListener('click', function() {
      const quantity = parseInt(document.getElementById('quantity').value);
      addToCart({ target: this }, quantity);
    });
  } catch (err) {
    console.error('Error loading product details:', err);
    window.location.href = 'products.html';
  }
}