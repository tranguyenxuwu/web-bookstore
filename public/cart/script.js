// Page loading animation
document.addEventListener('DOMContentLoaded', () => {
  const pageTransition = document.querySelector('.page-transition');
  
  if (pageTransition) {
    setTimeout(() => {
      pageTransition.style.opacity = '0';
      setTimeout(() => {
        pageTransition.style.display = 'none';
      }, 500);
    }, 500);
  }
  
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

// Thêm hàm setupSearch vào script.js
function setupSearch() {
  const searchForm = document.getElementById("search-form");
  
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      const searchTerm = searchInput ? searchInput.value.trim() : "";
      
      // Allow empty searches - this will show all products
      window.location.href = `../search.html?title=${encodeURIComponent(searchTerm || "")}`;
    });
  }
}

// Cập nhật hàm loadCartItems để thêm hình ảnh và hiệu ứng
function loadCartItems() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const cartTable = document.getElementById('cart-items');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  
  if (cartItems.length === 0) {
    // Display message for empty cart
    if (cartTable) cartTable.innerHTML = '';
    if (emptyCartMessage) emptyCartMessage.style.display = 'flex';
    document.getElementById('cart-total').textContent = '0 ₫';
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
    row.className = 'cart-item';
    row.setAttribute('data-id', item.id);
    
    // Thêm placeholder ảnh nếu không có
    const imageUrl = item.image || 'https://cdn.elysia-app.live/placeholder.jpg';
    
    row.innerHTML = `
      <td>
        <div class="product-info">
          <img src="${imageUrl}" alt="${item.title}" class="product-image">
          <div class="product-details">
            <div class="product-title">${item.title}</div>
            <div class="product-author">Mã SP: ${item.id}</div>
          </div>
        </div>
      </td>
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
        <button class="remove-button" data-id="${item.id}">
          <i class="fas fa-trash-alt"></i> Xóa
        </button>
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
    
    // Use a slight delay to give animation effect
    setTimeout(() => {
      loadCartItems();
    }, 300);
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

// Cập nhật hàm increaseQuantity với hiệu ứng
function increaseQuantity(event) {
  const itemId = event.target.getAttribute('data-id');
  const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
  const currentValue = parseInt(input.value);
  
  input.value = currentValue + 1;
  const changeEvent = new Event('change');
  input.dispatchEvent(changeEvent);
  
  // Thêm hiệu ứng highlight
  const row = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  row.classList.add('item-added');
  setTimeout(() => {
    row.classList.remove('item-added');
  }, 600);
}

// Cải thiện hàm removeItem
function removeItem(event) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
  
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const itemId = event.target.getAttribute('data-id') || 
                 event.target.parentElement.getAttribute('data-id');

  // Add animation class to the row before removal
  const row = document.querySelector(`.cart-item[data-id="${itemId}"]`);
  if (row) {
    row.classList.add('item-removed');
  }

  setTimeout(() => {
    const updatedCartItems = cartItems.filter(item => item.id != itemId);
    localStorage.setItem('cart', JSON.stringify(updatedCartItems));
    loadCartItems();
  }, 500);
}

// Modify the checkout function
function checkout() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (cartItems.length === 0) {
    alert('Giỏ hàng của bạn đang trống!');
    return;
  }
  
  // Check if user has entered address information
  const addressData = JSON.parse(localStorage.getItem('shipping_address'));
  
  if (!addressData) {
    // Redirect to address page if no address found
    window.location.href = '../address.html';
    return;
  }
  
  // Continue with checkout process if address exists
  alert('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');
  
  // Clear cart after successful order
  localStorage.removeItem('cart');
  loadCartItems();
}
