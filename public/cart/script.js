document.addEventListener('DOMContentLoaded', () => {
  loadCartItems();
  document.getElementById('checkout-button').addEventListener('click', checkout);
  
  // Set logo
  document.querySelectorAll('.logo').forEach(logo => {
    if (logo.tagName === 'IMG') {
      logo.src = 'https://cdn.elysia-app.live/logo.png';
    }
  });
  
  // Setup search
  setupSearch();
});

function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchButton = document.querySelector('.search-button');
  
  if (searchInput && searchButton) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
    
    searchButton.addEventListener('click', performSearch);
  }
}

function performSearch() {
  const query = document.querySelector('.search-input').value.trim();
  if (!query) return;
  
  window.location.href = `../search.html?query=${encodeURIComponent(query)}`;
}

function loadCartItems() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const cartTable = document.getElementById('cart-items');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  
  if (cartItems.length === 0) {
    // Display message for empty cart
    if (cartTable) cartTable.innerHTML = '';
    if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    document.getElementById('cart-total').textContent = '0 VND';
    document.getElementById('checkout-button').disabled = true;
    return;
  }
  
  if (emptyCartMessage) emptyCartMessage.style.display = 'none';
  if (document.getElementById('checkout-button')) {
    document.getElementById('checkout-button').disabled = false;
  }
  
  if (!cartTable) return;
  
  cartTable.innerHTML = '';
  
  let total = 0;

  cartItems.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.title}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>
        <div class="quantity-controls">
          <button class="quantity-btn minus" data-id="${item.id}">-</button>
          <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="quantity-input" />
          <button class="quantity-btn plus" data-id="${item.id}">+</button>
        </div>
      </td>
      <td>${formatCurrency(itemTotal)}</td>
      <td>
        <button class="remove-button" data-id="${item.id}">Xóa</button>
      </td>
    `;
    cartTable.appendChild(row);
  });

  document.getElementById('cart-total').textContent = formatCurrency(total);

  // Add event listeners
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', updateQuantity);
  });

  document.querySelectorAll('.remove-button').forEach(button => {
    button.addEventListener('click', removeItem);
  });
  
  document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
    btn.addEventListener('click', decreaseQuantity);
  });
  
  document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
    btn.addEventListener('click', increaseQuantity);
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function updateQuantity(event) {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const itemId = event.target.getAttribute('data-id');
  const newQuantity = parseInt(event.target.value);
  
  if (isNaN(newQuantity) || newQuantity < 1) {
    event.target.value = 1;
    return updateQuantity(event);
  }

  const item = cartItems.find(item => item.id == itemId);
  if (item) {
    item.quantity = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cartItems));
    loadCartItems();
  }
}

function decreaseQuantity(event) {
  const itemId = event.target.getAttribute('data-id');
  const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
  const currentValue = parseInt(input.value);
  
  if (currentValue > 1) {
    input.value = currentValue - 1;
    const changeEvent = new Event('change');
    input.dispatchEvent(changeEvent);
  }
}

function increaseQuantity(event) {
  const itemId = event.target.getAttribute('data-id');
  const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
  const currentValue = parseInt(input.value);
  
  input.value = currentValue + 1;
  const changeEvent = new Event('change');
  input.dispatchEvent(changeEvent);
}

function removeItem(event) {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const itemId = event.target.getAttribute('data-id');

  const updatedCartItems = cartItems.filter(item => item.id != itemId);
  localStorage.setItem('cart', JSON.stringify(updatedCartItems));
  loadCartItems();
}

function checkout() {
  // Check if user is logged in
  const userLoggedIn = localStorage.getItem('token') !== null;
  
  if (!userLoggedIn) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `../login/login.html?returnUrl=${returnUrl}`;
    return;
  }
  
  // In a real app, this would connect to a payment API
  alert('Thanh toán thành công!');
  localStorage.removeItem('cart');
  loadCartItems();
}
