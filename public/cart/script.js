document.addEventListener('DOMContentLoaded', () => {
  loadCartItems();
  document.getElementById('checkout-button').addEventListener('click', checkout);
});

function loadCartItems() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const cartTable = document.getElementById('cart-items');
  cartTable.innerHTML = '';

  let total = 0;

  cartItems.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.title}</td>
      <td>${item.price} VND</td>
      <td>
        <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="quantity-input" />
      </td>
      <td>${item.price * item.quantity} VND</td>
      <td>
        <button class="remove-button" data-id="${item.id}">Xóa</button>
      </td>
    `;
    cartTable.appendChild(row);
    total += item.price * item.quantity;
  });

  document.getElementById('cart-total').textContent = `${total} VND`;

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', updateQuantity);
  });

  document.querySelectorAll('.remove-button').forEach(button => {
    button.addEventListener('click', removeItem);
  });
}

function updateQuantity(event) {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const itemId = event.target.getAttribute('data-id');
  const newQuantity = parseInt(event.target.value);

  const item = cartItems.find(item => item.id == itemId);
  if (item) {
    item.quantity = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cartItems));
    loadCartItems();
  }
}

function removeItem(event) {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const itemId = event.target.getAttribute('data-id');

  const updatedCartItems = cartItems.filter(item => item.id != itemId);
  localStorage.setItem('cart', JSON.stringify(updatedCartItems));
  loadCartItems();
}

function checkout() {
  alert('Thanh toán thành công!');
  localStorage.removeItem('cart');
  loadCartItems();
}
