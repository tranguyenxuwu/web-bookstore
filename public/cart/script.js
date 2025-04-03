// --- START OF FILE script.js ---

// Page loading animation
import { APP_ENV } from "../assets/script/env.js";

document.addEventListener("DOMContentLoaded", () => {
  const pageTransition = document.querySelector(".page-transition");

  if (pageTransition) {
    setTimeout(() => {
      pageTransition.style.opacity = "0";
      setTimeout(() => {
        pageTransition.style.display = "none";
      }, 500);
    }, 500);
  }

  loadCartItems();
  const checkoutButton = document.getElementById("checkout-button");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", checkout);
  }

  // Set logo
  document.querySelectorAll(".logo").forEach((logo) => {
    if (logo.tagName === "IMG") {
      logo.src = "https://cdn.elysia-app.live/logo.png";
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
      window.location.href = `../search.html?title=${encodeURIComponent(
        searchTerm || ""
      )}`;
    });
  }
}

// Cập nhật hàm loadCartItems để thêm hình ảnh và hiệu ứng
function loadCartItems() {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const cartTable = document.getElementById("cart-items");
  const emptyCartMessage = document.getElementById("empty-cart-message");
  const checkoutButton = document.getElementById("checkout-button"); // Get button ref

  if (cartItems.length === 0) {
    // Display message for empty cart
    if (cartTable) cartTable.innerHTML = "";
    if (emptyCartMessage) emptyCartMessage.style.display = "flex";
    document.getElementById("cart-total").textContent = "0 ₫";
    if (checkoutButton) checkoutButton.disabled = true; // Disable button
    return;
  }

  if (emptyCartMessage) emptyCartMessage.style.display = "none";
  if (checkoutButton) {
    checkoutButton.disabled = false; // Enable button
  }

  if (!cartTable) return;

  cartTable.innerHTML = "";

  let total = 0;

  cartItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const row = document.createElement("tr");
    row.className = "cart-item";
    row.setAttribute("data-id", item.id);

    // Thêm placeholder ảnh nếu không có
    const imageUrl =
      item.image || "https://cdn.elysia-app.live/placeholder.jpg";

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
          <input type="number" value="${item.quantity}" min="1" data-id="${
      item.id
    }" class="quantity-input" />
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

  document.getElementById("cart-total").textContent = formatCurrency(total);

  // Add event listeners
  document.querySelectorAll(".quantity-input").forEach((input) => {
    input.addEventListener("change", updateQuantity);
  });

  document.querySelectorAll(".remove-button").forEach((button) => {
    button.addEventListener("click", removeItem);
  });

  document.querySelectorAll(".quantity-btn.minus").forEach((btn) => {
    btn.addEventListener("click", decreaseQuantity);
  });

  document.querySelectorAll(".quantity-btn.plus").forEach((btn) => {
    btn.addEventListener("click", increaseQuantity);
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function updateQuantity(event) {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const itemId = event.target.getAttribute("data-id");
  const newQuantity = parseInt(event.target.value);

  if (isNaN(newQuantity) || newQuantity < 1) {
    // Find the original quantity before resetting to 1
    const originalItem = cartItems.find((item) => item.id == itemId);
    event.target.value = originalItem ? originalItem.quantity : 1;
    // No need to update cart/reload if value is invalid/reset
    return;
  }

  const item = cartItems.find((item) => item.id == itemId);
  if (item) {
    item.quantity = newQuantity;
    localStorage.setItem("cart", JSON.stringify(cartItems));

    // Use a slight delay to give animation effect and prevent rapid reloads
    // Debounce or throttle might be better for rapid input changes, but setTimeout is simpler here
    setTimeout(() => {
      loadCartItems(); // Reload to update totals and potentially row visuals
    }, 300);
  }
}

function decreaseQuantity(event) {
  const itemId = event.target.getAttribute("data-id");
  const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
  const currentValue = parseInt(input.value);

  if (currentValue > 1) {
    input.value = currentValue - 1;
    // Trigger the change event manually to update quantity and totals
    const changeEvent = new Event("change", { bubbles: true });
    input.dispatchEvent(changeEvent);
  }
}

// Cập nhật hàm increaseQuantity với hiệu ứng
function increaseQuantity(event) {
  const itemId = event.target.getAttribute("data-id");
  const input = document.querySelector(`.quantity-input[data-id="${itemId}"]`);
  const currentValue = parseInt(input.value);

  input.value = currentValue + 1;
  // Trigger the change event manually to update quantity and totals
  const changeEvent = new Event("change", { bubbles: true });
  input.dispatchEvent(changeEvent);

  // Thêm hiệu ứng highlight
  const row = input.closest(".cart-item"); // Find the parent row more reliably
  if (row) {
    row.classList.add("item-added");
    setTimeout(() => {
      row.classList.remove("item-added");
    }, 600);
  }
}

// Cải thiện hàm removeItem
function removeItem(event) {
  // Use closest to ensure the button or its icon triggers the removal correctly
  const button = event.target.closest(".remove-button");
  if (!button) return; // Exit if the click wasn't on a remove button or its child

  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const itemId = button.getAttribute("data-id");

  // Add animation class to the row before removal
  const row = button.closest(".cart-item"); // Find the parent row
  if (row) {
    row.classList.add("item-removed");

    // Use transitionend event for smoother removal after animation (optional but better UX)
    row.addEventListener(
      "transitionend",
      () => {
        const updatedCartItems = cartItems.filter((item) => item.id != itemId);
        localStorage.setItem("cart", JSON.stringify(updatedCartItems));
        loadCartItems(); // Reload cart which will remove the row from DOM implicitly
      },
      { once: true }
    ); // Ensure listener fires only once

    // Fallback if transition doesn't fire (e.g., no transition defined in CSS)
    setTimeout(() => {
      // Check if the row still exists (might have been removed by transitionend already)
      if (document.querySelector(`.cart-item[data-id="${itemId}"]`)) {
        const updatedCartItems = cartItems.filter((item) => item.id != itemId);
        localStorage.setItem("cart", JSON.stringify(updatedCartItems));
        loadCartItems();
      }
    }, 500); // Match timeout with transition duration
  } else {
    // Fallback if row isn't found for animation (remove immediately)
    const updatedCartItems = cartItems.filter((item) => item.id != itemId);
    localStorage.setItem("cart", JSON.stringify(updatedCartItems));
    loadCartItems();
  }
}

/**
 * Handles the checkout process:
 * 1. Validates cart and address.
 * 2. Constructs the order payload.
 * 3. Sends a POST request to the order API.
 * 4. Handles success (clears cart, shows message) or failure (shows error).
 */
async function checkout() {
  // Make the function async to use await
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const checkoutButton = document.getElementById("checkout-button");

  if (cartItems.length === 0) {
    alert("Giỏ hàng của bạn đang trống!");
    return;
  }

  // Check if user has entered address information (optional, but kept from original logic)
  const addressData = JSON.parse(localStorage.getItem("shipping_address"));
  if (!addressData) {
    alert("Vui lòng nhập địa chỉ giao hàng trước khi đặt hàng.");
    window.location.href = "../address.html"; // Redirect to address page if no address found
    return;
  }

  // --- Prepare data for POST request ---
  const customerId = 2; // ** IMPORTANT: Hardcoded based on example. Fetch dynamically in a real app! **
  const orderDetails = cartItems.map((item) => ({
    ma_sach: parseInt(item.id), // Ensure ID is an integer
    so_luong: item.quantity,
    gia_tien: item.price, // Assuming item.price is the correct unit price expected by the API
  }));

  const payload = {
    ma_khach_hang: customerId,
    chi_tiet: orderDetails,
  };

  // --- Send POST request ---
  const apiUrl = `${APP_ENV.API_URL}/orders`; // Adjust '/orders' if needed

  // Disable button during request
  if (checkoutButton) checkoutButton.disabled = true;
  // Optional: Add a visual loading indicator here

  try {
    console.log("Sending order payload:", JSON.stringify(payload));
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization headers if required by your API
        // 'Authorization': `Bearer ${your_auth_token}`
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Order successful
      const result = await response.json(); // Assuming API returns JSON confirmation
      console.log("Order successful:", result);
      alert("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.");

      // Clear cart after successful order
      localStorage.removeItem("cart");
      loadCartItems(); // Update the cart display (will show empty cart message)

      // Optional: Redirect to an order confirmation page
      // window.location.href = '../order-confirmation.html?orderId=' + result.orderId;
    } else {
      // Order failed - Handle API error response
      let errorMessage = `Đặt hàng thất bại. Status: ${response.status}`;
      try {
        const errorData = await response.json(); // Try to get detailed error from API
        errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`;
      } catch (e) {
        // If response is not JSON or parsing fails
        const textError = await response.text();
        errorMessage += ` - ${textError || "Unknown server error"}`;
      }
      console.error("Checkout failed:", errorMessage);
      alert(errorMessage);
      // Re-enable button on failure
      if (checkoutButton) checkoutButton.disabled = false;
    }
  } catch (error) {
    // Handle network errors or other exceptions during fetch
    console.error("Checkout network/fetch error:", error);
    alert(
      `Đã xảy ra lỗi khi kết nối đến máy chủ: ${error.message}. Vui lòng thử lại.`
    );
    // Re-enable button on failure
    if (checkoutButton) checkoutButton.disabled = false;
  } finally {
    // Optional: Remove visual loading indicator here
    // Note: Button state is handled within success/error blocks now
  }
}

// --- END OF FILE script.js ---
