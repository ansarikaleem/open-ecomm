document.addEventListener('DOMContentLoaded', function() {
  // Check if this is a guest checkout
  const isGuestCheckout = new URLSearchParams(window.location.search).has('guest');
  
  if (isGuestCheckout) {
    document.getElementById('account-notice').style.display = 'block';
  }
  
  // Load order summary
  loadOrderSummary(isGuestCheckout);
  
  // Setup checkout steps
  setupCheckoutSteps();
  
  // Event listeners
  document.getElementById('billing-same').addEventListener('change', function() {
    document.getElementById('billing-fields').style.display = this.checked ? 'none' : 'block';
  });
  
  document.getElementById('continue-to-payment').addEventListener('click', function() {
    if (validateShippingForm()) {
      document.getElementById('shipping-section').style.display = 'none';
      document.getElementById('payment-section').style.display = 'block';
      updateCheckoutSteps(2);
    }
  });
  
  document.getElementById('back-to-shipping').addEventListener('click', function() {
    document.getElementById('payment-section').style.display = 'none';
    document.getElementById('shipping-section').style.display = 'block';
    updateCheckoutSteps(1);
  });
  
  document.getElementById('continue-to-review').addEventListener('click', function() {
    if (validatePaymentForm()) {
      document.getElementById('payment-section').style.display = 'none';
      document.getElementById('review-section').style.display = 'block';
      updateCheckoutSteps(3);
      updateReviewSection();
    }
  });
  
  document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    placeOrder(isGuestCheckout);
  });
});

async function loadOrderSummary(isGuestCheckout) {
  try {
    let cartItems = [];
    
    if (isGuestCheckout) {
      // Load guest cart from session storage
      cartItems = JSON.parse(sessionStorage.getItem('guestCart') || []);
    } else {
      // Load user cart from server
      const token = getCookie('jwt');
      const response = await fetch('http://localhost:3000/api/v1/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        cartItems = data.data.cart;
      }
    }
    
    if (cartItems.length === 0) {
      window.location.href = '/cart.html';
      return;
    }
    
    // Render order items
    const orderItemsContainer = document.getElementById('order-items');
    orderItemsContainer.innerHTML = cartItems.map(item => `
      <div class="order-item">
        <img src="${item.image_url || '/images/placeholder-product.jpg'}" alt="${item.name}">
        <div class="order-item-details">
          <h4>${item.name}</h4>
          <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
        </div>
        <div class="order-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');
    
    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;
    
    // Update summary
    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
  } catch (err) {
    console.error('Error loading order summary:', err);
    showToast('Error loading order summary', 'error');
  }
}

function setupCheckoutSteps() {
  const steps = document.querySelectorAll('.checkout-steps .step');
  steps.forEach((step, index) => {
    step.addEventListener('click', function() {
      if (index === 0) {
        document.getElementById('shipping-section').style.display = 'block';
        document.getElementById('payment-section').style.display = 'none';
        document.getElementById('review-section').style.display = 'none';
      } else if (index === 1 && validateShippingForm()) {
        document.getElementById('shipping-section').style.display = 'none';
        document.getElementById('payment-section').style.display = 'block';
        document.getElementById('review-section').style.display = 'none';
      } else if (index === 2 && validateShippingForm() && validatePaymentForm()) {
        document.getElementById('shipping-section').style.display = 'none';
        document.getElementById('payment-section').style.display = 'none';
        document.getElementById('review-section').style.display = 'block';
        updateReviewSection();
      }
      
      updateCheckoutSteps(index + 1);
    });
  });
}

function updateCheckoutSteps(activeStep) {
  const steps = document.querySelectorAll('.checkout-steps .step');
  steps.forEach((step, index) => {
    step.classList.toggle('active', index < activeStep);
    step.classList.toggle('completed', index < activeStep - 1);
  });
}

function validateShippingForm() {
  const form = document.getElementById('checkout-form');
  const requiredFields = [
    'shipping_name',
    'shipping_email',
    'shipping_address',
    'shipping_city',
    'shipping_zip',
    'shipping_country',
    'shipping_phone'
  ];
  
  let isValid = true;
  
  requiredFields.forEach(field => {
    const element = document.getElementById(field);
    if (!element.value.trim()) {
      element.classList.add('error');
      isValid = false;
    } else {
      element.classList.remove('error');
    }
  });
  
  // Validate email format
  const email = document.getElementById('shipping_email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.classList.add('error');
    isValid = false;
  }
  
  if (!isValid) {
    showToast('Please fill all required fields correctly', 'error');
  }
  
  return isValid;
}

function validatePaymentForm() {
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
  let isValid = true;
  
  if (paymentMethod === 'credit_card') {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvc = document.getElementById('card-cvc');
    const cardName = document.getElementById('card-name');
    
    // Simple validation - in a real app you'd want more robust validation
    if (!cardNumber.value.trim() || cardNumber.value.trim().replace(/\s/g, '').length !== 16) {
      cardNumber.classList.add('error');
      isValid = false;
    } else {
      cardNumber.classList.remove('error');
    }
    
    if (!cardExpiry.value.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry.value.trim())) {
      cardExpiry.classList.add('error');
      isValid = false;
    } else {
      cardExpiry.classList.remove('error');
    }
    
    if (!cardCvc.value.trim() || cardCvc.value.trim().length < 3) {
      cardCvc.classList.add('error');
      isValid = false;
    } else {
      cardCvc.classList.remove('error');
    }
    
    if (!cardName.value.trim()) {
      cardName.classList.add('error');
      isValid = false;
    } else {
      cardName.classList.remove('error');
    }
  }
  
  if (!isValid) {
    showToast('Please fill all payment details correctly', 'error');
  }
  
  return isValid;
}

function updateReviewSection() {
  // Update shipping info
  const shippingInfo = `
    <p>${document.getElementById('shipping-name').value}</p>
    <p>${document.getElementById('shipping-email').value}</p>
    <p>${document.getElementById('shipping-address').value}</p>
    <p>${document.getElementById('shipping-city').value}, ${document.getElementById('shipping-zip').value}</p>
    <p>${document.getElementById('shipping-country').value}</p>
    <p>${document.getElementById('shipping-phone').value}</p>
  `;
  document.getElementById('review-shipping').innerHTML = shippingInfo;
  
  // Update payment info
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
  let paymentInfo = '';
  
  if (paymentMethod === 'credit_card') {
    paymentInfo = `
      <p>Credit Card ending in ${document.getElementById('card-number').value.slice(-4)}</p>
      <p>Expires ${document.getElementById('card-expiry').value}</p>
    `;
  } else if (paymentMethod === 'paypal') {
    paymentInfo = '<p>PayPal</p>';
  }
  
  document.getElementById('review-payment').innerHTML = paymentInfo;
  
  // Update order summary
  const orderSummary = document.getElementById('order-summary');
  orderSummary.innerHTML = document.querySelector('.order-summary').innerHTML;
}

async function placeOrder(isGuestCheckout) {
  if (!document.getElementById('terms-agree').checked) {
    showToast('Please agree to the terms and conditions', 'error');
    return;
  }
  
  try {
    const token = isGuestCheckout ? null : getCookie('jwt');
    const sessionId = getCookie('sessionId');
    
    // Collect form data
    const formData = {
      shipping_name: document.getElementById('shipping-name').value,
      shipping_email: document.getElementById('shipping-email').value,
      shipping_address: document.getElementById('shipping-address').value,
      shipping_city: document.getElementById('shipping-city').value,
      shipping_zip: document.getElementById('shipping-zip').value,
      shipping_country: document.getElementById('shipping-country').value,
      shipping_phone: document.getElementById('shipping-phone').value,
      payment_method: document.querySelector('input[name="payment_method"]:checked').value,
      billing_same: document.getElementById('billing-same').checked
    };
    
    // Add credit card details if applicable
    if (formData.payment_method === 'credit_card') {
      formData.card_number = document.getElementById('card-number').value;
      formData.card_expiry = document.getElementById('card-expiry').value;
      formData.card_cvc = document.getElementById('card-cvc').value;
      formData.card_name = document.getElementById('card-name').value;
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['x-session-id'] = sessionId;
    }
    
    // Submit order
    const response = await fetch('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Clear cart
      if (token) {
        await fetch('http://localhost:3000/api/v1/cart', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        sessionStorage.removeItem('guestCart');
      }
      
      // Redirect to order confirmation
      window.location.href = `/order-confirmation.html?orderId=${data.data.order.id}`;
    } else {
      showToast(data.message || 'Order failed', 'error');
    }
  } catch (err) {
    console.error('Error placing order:', err);
    showToast('Error placing order', 'error');
  }
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

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}