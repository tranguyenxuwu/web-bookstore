import { APP_ENV } from '../assets/script/env.js';

document.addEventListener('DOMContentLoaded', () => {
  // Set logo if exists
  const logo = document.querySelector('.logo');
  if (logo) logo.src = APP_ENV.LOGO_IMAGE;
  
  // Check for return URL
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl');
  
  if (returnUrl) {
    // Store the return URL to redirect after login
    localStorage.setItem('loginReturnUrl', returnUrl);
  }
  
  // Setup form
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.createElement('div');
  errorMessage.id = 'error-message';
  errorMessage.className = 'error-message';
  errorMessage.style.display = 'none';
  
  // Insert error message element after the form heading
  const heading = document.querySelector('.login-container h2');
  if (heading && heading.nextSibling) {
    heading.parentNode.insertBefore(errorMessage, heading.nextSibling);
  }
  
  loginForm.addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  
  // Basic validation
  if (!username || !password) {
    errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin!';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Đang xử lý...';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';
    
    const response = await fetch(APP_ENV.LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });
    
    const data = await response.json();
    
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    
    if (!response.ok) {
      // Handle validation errors
      if (response.status === 422 && data.errors) {
        const errorMessage = Object.values(data.errors).flat().join(', ');
        throw new Error(errorMessage);
      }
      
      throw new Error(data.message || 'Đăng nhập thất bại!');
    }
    
    // Login successful - store user data and token
    if (data.data && data.data.token) {
      localStorage.setItem('user', JSON.stringify(data.data.user || {}));
      localStorage.setItem('token', data.data.token);
      
      // Redirect based on user role or return URL
      const returnUrl = localStorage.getItem('loginReturnUrl');
      
      if (data.data.user && data.data.user.is_admin) {
        window.location.href = '../dashboard/index.html';
      } else if (returnUrl) {
        localStorage.removeItem('loginReturnUrl');
        window.location.href = returnUrl;
      } else {
        window.location.href = '../index.html';
      }
    } else {
      throw new Error('Đăng nhập thất bại: Phản hồi không hợp lệ!');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = error.message || 'Đã xảy ra lỗi khi đăng nhập!';
    errorDiv.style.display = 'block';
  }
}