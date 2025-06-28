document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkAuthStatus();
  
  // Login form handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      debugger;
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'X-Session-ID':getCookie('sessionId'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include' // Important for cookies/sessions
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
          // Store token in cookie
          document.cookie = `jwt=${data.token}; path=/; max-age=${60 * 60 * 24 * 90}`; // 90 days
          
          // Check for cart items in session storage
          const sessionCart = sessionStorage.getItem('guestCart');
          if (sessionCart) {
            await mergeGuestCart(JSON.parse(sessionCart));
            sessionStorage.removeItem('guestCart');
          }
          
          // Redirect to home page or intended page
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/index.html';
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        } else {
          showAlert('error', data.message || 'Login failed');
        }
      } catch (err) {
        showAlert('error', 'An error occurred during login');
      }
    });
  }
  
  // Signup form handler
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      
      if (password !== passwordConfirm) {
        showAlert('error', 'Passwords do not match');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password, passwordConfirm })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
          showAlert('success', 'Account created successfully! Please log in.');
          setTimeout(() => {
            window.location.href = '/login.html';
          }, 1500);
        } else {
          showAlert('error', data.message || 'Signup failed');
        }
      } catch (err) {
        showAlert('error', 'An error occurred during signup');
      }
    });
  }
  
  // Logout handler
  const logoutLinks = document.querySelectorAll('#logout-link');
  logoutLinks.forEach(link => {
    link.addEventListener('click', async function(e) {
      e.preventDefault();
      await logout();
    });
  });
});

async function mergeGuestCart(cartItems) {
  try {
    const token = getCookie('jwt');
    
    for (const item of cartItems) {
      await fetch('http://localhost:3000/api/v1/cart', {
        method: 'POST',
        headers: {
          'X-Session-ID':getCookie('sessionId'),
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: item.product_id,
          quantity: item.quantity
        })
      });
    }
  } catch (err) {
    console.error('Error merging guest cart:', err);
  }
}

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

function checkAuthStatus() {
  const token = getCookie('jwt');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const logoutLink = document.getElementById('logout-link');
  
  if (token) {
    // User is logged in
    if (loginLink) loginLink.style.display = 'none';
    if (signupLink) signupLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'inline-block';
  } else {
    // User is not logged in
    if (loginLink) loginLink.style.display = 'inline-block';
    if (signupLink) signupLink.style.display = 'inline-block';
    if (logoutLink) logoutLink.style.display = 'none';
  }
}

function showAlert(type, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  const authContainer = document.querySelector('.auth-container');
  authContainer.insertBefore(alertDiv, authContainer.firstChild);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}