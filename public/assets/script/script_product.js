import { APP_ENV } from './env.js';
import { ApiService } from './api-service.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  // Set logo
  document.querySelectorAll('.logo').forEach(logo => {
    logo.src = APP_ENV.LOGO_IMAGE;
  });

  if (productId) {
    try {
      const product = await ApiService.getBookById(productId);
      displayProductDetails(product);
      fetchRelatedProducts(productId);
      
      // Setup buttons
      document.getElementById('add-to-cart').addEventListener('click', () => {
        addToCart(productId);
      });
      
      document.getElementById('buy-now').addEventListener('click', () => {
        addToCart(productId, true);
      });
    } catch (error) {
      console.error('Error:', error);
      displayNotFoundMessage();
    }
  } else {
    displayNotFoundMessage('Không tìm thấy mã sản phẩm');
  }
  
  // Setup search functionality
  setupSearch();
});

function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchButton = document.querySelector('.search-button');
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  
  searchButton.addEventListener('click', performSearch);
}

async function performSearch() {
  const query = document.querySelector('.search-input').value.trim();
  if (!query) return;
  
  try {
    const results = await ApiService.searchBooks(query);
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    window.location.href = `../search.html?query=${encodeURIComponent(query)}`;
  } catch (error) {
    console.error('Search failed:', error);
  }
}

function fetchProductDetails(productId) {
  fetch(`${APP_ENV.FETCH_BY_ID_URL}${productId}`)
    .then(response => {
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    })
    .then(product => {
      displayProductDetails(product);
    })
    .catch(error => {
      console.error('Error fetching product details:', error);
      displayNotFoundMessage();
    });
}

function addToCart(productId, redirectToCart = false) {
  fetch(`${APP_ENV.FETCH_BY_ID_URL}${productId}`)
    .then(response => {
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    })
    .then(product => {
      const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = cartItems.find(item => item.id == productId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartItems.push({
          id: productId,
          title: product.tieu_de || 'Sản phẩm không tên',
          price: product.gia_tien || 0,
          quantity: 1
        });
      }

      localStorage.setItem('cart', JSON.stringify(cartItems));
      alert('Đã thêm vào giỏ hàng!');
      // Fix the redirect to cart path
      if (redirectToCart) {
        window.location.href = '../cart/cart.html';
      }
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      alert('Không thể thêm vào giỏ hàng: Lỗi kết nối');
    });
}


function displayProductDetails(product) {
  // Set product image with fallback
  document.getElementById('product-img').src = product.hinh_anh || APP_ENV.PLACEHOLDER_IMAGE;
  
  // Set product title or not found message
  const titleElement = document.getElementById('product-title');
  if (titleElement) {
    if (product.tieu_de) {
      titleElement.textContent = product.tieu_de;
    } else {
      titleElement.innerHTML = '<p>Tiêu đề không có sẵn</p>';
    }
  }
  
  // Set product authors if element exists
  const authorElement = document.getElementById('product-author');
  if (authorElement) {
    const authorSpan = authorElement.querySelector('span');
    if (authorSpan) {
      if (product.tac_gias && Array.isArray(product.tac_gias) && product.tac_gias.length > 0) {
        authorSpan.textContent = product.tac_gias.map(author => author.ten_tac_gia).join(', ');
      } else {
        authorSpan.textContent = 'Không có thông tin tác giả';
      }
    }
  }
  
  // Set publisher if element exists
  const publisherElement = document.getElementById('product-publisher');
  if (publisherElement) {
    const publisherSpan = publisherElement.querySelector('span');
    if (publisherSpan) {
      if (product.nha_xuat_ban && product.nha_xuat_ban.ten_nha_xuat_ban) {
        publisherSpan.textContent = product.nha_xuat_ban.ten_nha_xuat_ban;
      } else {
        publisherSpan.textContent = 'Không có thông tin nhà xuất bản';
      }
    }
  }
  
  // Set price
  const priceElement = document.getElementById('product-price');
  if (priceElement) {
    const priceSpan = priceElement.querySelector('span');
    if (priceSpan) {
      if (product.gia_tien) {
        priceSpan.textContent = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(product.gia_tien);
      } else {
        priceSpan.textContent = 'Không có thông tin giá';
      }
    }
  }
  
  // Set description
  const descriptionElement = document.getElementById('product-description');
  if (descriptionElement) {
    const descSpan = descriptionElement.querySelector('span');
    if (descSpan) {
      if (product.gioi_thieu) {
        descSpan.textContent = product.gioi_thieu;
      } else {
        descSpan.textContent = 'Không có thông tin mô tả sản phẩm';
      }
    }
  }
}

function displayNotFoundMessage() {
  const container = document.querySelector('.product-details-container') || document.body;
  container.innerHTML = '<div class="error-message"><h2>Không tìm thấy sản phẩm</h2><p>Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p></div>';
}



function fetchRelatedProducts(productId) {
  fetch(APP_ENV.MASTER_URL)
    .then(response => response.json())
    .then(data => {
      console.log("Related products data:", data); // Log the response to see its structure
      
      // Check various possible data structures
      let products = [];
      if (Array.isArray(data)) {
        products = data;
      } else if (data && Array.isArray(data.data)) {
        products = data.data;
      } else if (data && typeof data === 'object') {
        // If it's a single product object
        products = [data];
      }
      
      if (!products || products.length === 0) {
        throw new Error('No products found in response');
      }

      // Find current product
      const currentProduct = products.find(item => item.ma_sach == productId);
      if (!currentProduct) {
        throw new Error('Current product not found');
      }

      // Get current product's category if it exists
      let currentCategory = null;
      if (currentProduct.the_loais && Array.isArray(currentProduct.the_loais) && currentProduct.the_loais.length > 0) {
        currentCategory = currentProduct.the_loais[0].ma_the_loai;
      }

      let relatedProducts = [];
      if (currentCategory) {
        // Get related products from same category
        relatedProducts = products
          .filter(product => 
            product.ma_sach != productId && 
            product.the_loais && 
            Array.isArray(product.the_loais) && 
            product.the_loais.some(cat => cat.ma_the_loai === currentCategory)
          )
          .slice(0, 8); // Limit to 8 related products
      }

      displayRelatedProducts(relatedProducts);
    })
    .catch(error => {
      console.error('Error fetching related products:', error);
      const container = document.querySelector('.product-in-series');
      if (container) {
        container.innerHTML = '<div class="error-message">Không thể tải sách liên quan</div>';
      }
    });
}

function displayRelatedProducts(products) {
  const container = document.querySelector('.product-in-series');
  if (!container) return;
  
  if (!products || !products.length) {
    container.innerHTML = '<p>Không tìm thấy sách liên quan</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-series">
      <a href="detail_product.html?id=${product.ma_sach}">
        <img 
          alt="${product.tieu_de || 'Sản phẩm'}"
          src="${product.hinh_anh || 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg'}"
        />
      </a>
      <div class="product-series-info">
        <h3>${product.tieu_de || 'Không có tiêu đề'}</h3>
        <p class="price">${product.gia_tien ? Number(product.gia_tien).toLocaleString('vi-VN') + 'đ' : 'Không có giá'}</p>
      </div>
    </div>
  `).join('');
}

// Slider control
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.product-in-series');
  const prevBtn = document.querySelector('.prev-button');
  const nextBtn = document.querySelector('.next-button');
  
  if (!container || !prevBtn || !nextBtn) return;
  
  const scrollAmount = 300;
  let startX, isDown = false;

  // Touch and mouse drag scrolling
  container.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    container.style.cursor = 'grabbing';
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = container.scrollLeft - walk;
  });

  // Button controls
  nextBtn.addEventListener('click', () => {
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });

  prevBtn.addEventListener('click', () => {
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });

  // Show/hide buttons with fade effect
  const toggleButtons = () => {
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth;
    
    prevBtn.style.opacity = isAtStart ? '0' : '1';
    prevBtn.style.visibility = isAtStart ? 'hidden' : 'visible';
    
    nextBtn.style.opacity = isAtEnd ? '0' : '1';
    nextBtn.style.visibility = isAtEnd ? 'hidden' : 'visible';
  };

  container.addEventListener('scroll', toggleButtons);
  window.addEventListener('resize', toggleButtons);
  toggleButtons();
});