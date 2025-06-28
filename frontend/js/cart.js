let BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  
  // Event listeners
  document.getElementById('checkout-btn')?.addEventListener('click', proceedToCheckout);
  document.getElementById('login-checkout-btn')?.addEventListener('click', loginBeforeCheckout);
  document.getElementById('guest-checkout-btn')?.addEventListener('click', guestCheckout);
  
  // Quantity change handlers
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('quantity-increase')) {
      updateCartItem(e.target.dataset.itemId, 'increase');
    } else if (e.target.classList.contains('quantity-decrease')) {
      updateCartItem(e.target.dataset.itemId, 'decrease');
    } else if (e.target.classList.contains('remove-item')) {
      removeCartItem(e.target.dataset.itemId);
    }
  });
});

async function loadCart() {
  try {
    const token = getCookie('jwt');
    let cartItems = [];
    let isGuest = false;
    
    if (token) {
      // User is logged in - get cart from server
      const response = await fetch(BASE_URL+'/api/v1/cart', {
        headers: {
          'X-Session-ID':getCookie('sessionId'),
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        cartItems = data.data.cart;
      }
    } else {
      // Guest user - get cart from session storage
      if(sessionStorage.getItem('guestCart')){
        cartItems = JSON.parse(sessionStorage.getItem('guestCart') || []);
      }
      
      isGuest = true;
    }
    
    renderCart(cartItems, isGuest);
  } catch (err) {
    console.error('Error loading cart:', err);
    showToast('Error loading your cart', 'error');
  }
}

function renderCart(cartItems, isGuest = false) {
  const cartContainer = document.getElementById('cart-items');
  const summaryContainer = document.getElementById('cart-summary');
  const checkoutOptions = document.getElementById('checkout-options');
  
  if (cartItems.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added any items yet</p>
        <a href="/products.html" class="btn btn-primary">Continue Shopping</a>
      </div>
    `;
    summaryContainer.innerHTML = '';
    return;
  }
  
  // Render cart items
  cartContainer.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image_url || '/images/placeholder-product.jpg'}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h3 class="cart-item-title">${item.name}</h3>
        <p class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</p>
        <div class="cart-item-quantity">
          <button class="quantity-decrease" data-item-id="${isGuest ? item.product_id : item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-increase" data-item-id="${isGuest ? item.product_id : item.id}">+</button>
          <button class="remove-item" data-item-id="${isGuest ? item.product_id : item.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;
  
  // Render summary
  summaryContainer.innerHTML = `
    <h3>Order Summary</h3>
    <div class="summary-row">
      <span>Subtotal</span>
      <span>$${subtotal.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Shipping</span>
      <span>$${shipping.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Tax</span>
      <span>$${tax.toFixed(2)}</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>$${total.toFixed(2)}</span>
    </div>
  `;
  
  // Show appropriate checkout options
  if (isGuest) {
    checkoutOptions.innerHTML = `
      <div class="checkout-option">
        <h3>Checkout as Guest</h3>
        <p>Continue without creating an account</p>
        <button id="guest-checkout-btn" class="btn btn-secondary">Continue as Guest</button>
      </div>
      <div class="checkout-option">
        <h3>Have an Account?</h3>
        <p>Login to save your cart and checkout faster</p>
        <button id="login-checkout-btn" class="btn btn-primary">Login & Checkout</button>
      </div>
    `;
  } else {
    checkoutOptions.innerHTML = `
      <button id="checkout-btn" class="btn btn-primary">Proceed to Checkout</button>
    `;
  }
}

async function updateCartItem(itemId, action) {
  try {
    const token = getCookie('jwt');
    
    if (token) {
      // User is logged in - update server cart
      const response = await fetch(+BASE_URL`/api/v1/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        loadCart();
        updateCartCount();
      }
    } else {
      // Guest user - update session storage
      let guestCart = JSON.parse(sessionStorage.getItem('guestCart') || []);
      const itemIndex = guestCart.findIndex(item => item.product_id == itemId);
      
      if (itemIndex !== -1) {
        if (action === 'increase') {
          guestCart[itemIndex].quantity += 1;
        } else if (action === 'decrease' && guestCart[itemIndex].quantity > 1) {
          guestCart[itemIndex].quantity -= 1;
        }
        
        sessionStorage.setItem('guestCart', JSON.stringify(guestCart));
        loadCart();
        updateCartCount();
      }
    }
  } catch (err) {
    console.error('Error updating cart item:', err);
    showToast('Error updating cart', 'error');
  }
}

async function removeCartItem(itemId) {
  try {
    const token = getCookie('jwt');
    
    if (token) {
      // User is logged in - remove from server cart
      const response = await fetch(BASE_URL+`/api/v1/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadCart();
        updateCartCount();
      }
    } else {
      // Guest user - remove from session storage
      let guestCart = JSON.parse(sessionStorage.getItem('guestCart') || []);
      guestCart = guestCart.filter(item => item.product_id != itemId);
      
      sessionStorage.setItem('guestCart', JSON.stringify(guestCart));
      loadCart();
      updateCartCount();
    }
  } catch (err) {
    console.error('Error removing cart item:', err);
    showToast('Error removing item', 'error');
  }
}

function proceedToCheckout() {
  window.location.href = '/checkout.html';
}

function loginBeforeCheckout() {
  // Store current cart URL for redirect after login
  sessionStorage.setItem('redirectAfterLogin', '/cart.html');
  window.location.href = '/login.html';
}

function guestCheckout() {
  window.location.href = '/checkout.html?guest=true';
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

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

async function updateCartCount() {
  try {
    const token = getCookie('jwt');
    let cartCount = 0;
    
    if (token) {
      // User is logged in - get cart from server
      const response = await fetch(BASE_URL+'/api/v1/cart', {
        
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
      const guestCart = JSON.parse(sessionStorage.getItem('guestCart') || []);
      cartCount = guestCart.reduce((total, item) => total + item.quantity, 0);
    }
    
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }
  } catch (err) {
    console.error('Error updating cart count:', err);
  }
}