document.addEventListener('DOMContentLoaded', function() {
  // Initialize session ID if not exists
  if (!getCookie('sessionId')) {
    const sessionId = generateSessionId();
    setCookie('sessionId', sessionId, 7); // Expires in 7 days
  }
  
  // Load cart count
  // updateCartCount();
  
  // Event listeners for add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', addToCart);
  });
  
  // Navigation
  document.getElementById('cart-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/cart.html';
  });
  
  document.getElementById('login-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    // Store current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login.html';
  });
  
  document.getElementById('logout-link')?.addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
  
  // Check auth status
  checkAuthStatus();
});

// Generate unique session ID
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Set cookie
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Get cookie
function getCookie(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
}

async function updateCartCount() {
  try {
    const token = getCookie('jwt');
    let cartCount = 0;
    
    if (token) {
      // User is logged in - get cart from server
      const response = await fetch('http://localhost:3000/api/v1/cart', {
        headers: {
          'X-Session-ID':getCookie('sessionId'),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        cartCount = data.data.cart.reduce((total, item) => total + item.quantity, 0);
      }
    } else {
      // Guest user - get cart from session storage
      if(sessionStorage.getItem('guestCart')){
        const guestCart = JSON.parse(sessionStorage.getItem('guestCart') || []);
        cartCount = guestCart.reduce((total, item) => total + item.quantity, 0);
      }
      
    }
    
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }
  } catch (err) {
    console.error('Error updating cart count:', err);
  }
}

// Add to cart functionality
async function addToCart(e) {
  const productId = e.target.dataset.productId;
  const quantity = parseInt(e.target.dataset.quantity || 1);
  
  try {
    const token = getCookie('jwt');
    
    if (token) {
      // User is logged in - add to server cart
      const response = await fetch('http://localhost:3000/api/v1/cart', {
        method: 'POST',
        headers: {
          'X-Session-ID':getCookie('sessionId'),
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          quantity
        })
      });
      
      if (response.ok) {
        showToast('Product added to cart!');
        updateCartCount();
      }
    } else {
      // Guest user - add to session storage
      let guestCart = [];
      if(sessionStorage.getItem('guestCart')){
        guestCart = JSON.parse(sessionStorage.getItem('guestCart') || []);
      }else{
        sessionStorage.setItem('guestCart','');
      }
      
      // Check if product already exists in cart
      const existingItem = guestCart ? guestCart.find(item => item.product_id == productId):'';
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        // Get product details to store price
        const productResponse = await fetch(`http://localhost:3000/api/v1/products/${productId}`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          guestCart.push({
            product_id: productId,
            quantity: quantity,
            price: productData.data.product.price,
            name: productData.data.product.name,
            image_url: productData.data.product.image_url
          });
        }
      }
      
      sessionStorage.setItem('guestCart', JSON.stringify(guestCart));
      showToast('Product added to cart!');
      updateCartCount();
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    showToast('Error adding product to cart', 'error');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Check authentication status
function checkAuthStatus() {
  const token = getCookie('jwt');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const logoutLink = document.getElementById('logout-link');
  const adminLink = document.getElementById('admin-link');
  
  if (token) {
    if (loginLink) loginLink.style.display = 'none';
    if (signupLink) signupLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'inline-block';
    if (adminLink) adminLink.style.display = 'inline-block';
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (signupLink) signupLink.style.display = 'inline-block';
    if (logoutLink) logoutLink.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

// Logout function
async function logout() {
  try {
    await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'GET',
      credentials: 'include'
    });
    
    // Remove JWT token
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to home page
    window.location.href = '/index.html';
  } catch (err) {
    console.error('Error logging out:', err);
  }
}