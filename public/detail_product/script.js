document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    fetchProductDetails(productId);
    fetchRelatedProducts(productId);
  }

  document.getElementById('add-to-cart').addEventListener('click', () => {
    addToCart(productId);
  });

  document.getElementById('buy-now').addEventListener('click', () => {
    addToCart(productId, true);
  });
});

function fetchProductDetails(productId) {
  fetch('../index/product.json')
    .then(response => response.json())
    .then(data => {
      const product = data.data.find(item => item.ma_sach == productId);
      if (product) {
        displayProductDetails(product);
      } else {
        console.error('Product not found');
      }
    })
    .catch(error => console.error('Error fetching product details:', error));
}

function displayProductDetails(product) {
  document.getElementById('product-img').src = product.hinh_anh || 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
  document.getElementById('product-title').textContent = product.tieu_de;
  document.getElementById('product-author').querySelector('span').textContent = product.tac_gias.map(author => author.ten_tac_gia).join(', ');
  document.getElementById('product-publisher').querySelector('span').textContent = product.nha_xuat_ban.ten_nha_xuat_ban;
  document.getElementById('product-price').querySelector('span').textContent = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(product.gia_tien);
  document.getElementById('product-description').querySelector('span').textContent = product.gioi_thieu;
}

function addToCart(productId, redirectToCart = false) {
  fetch('../index/product.json')
    .then(response => response.json())
    .then(data => {
      const product = data.data.find(item => item.ma_sach == productId);
      if (product) {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cartItems.find(item => item.id == productId);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cartItems.push({
            id: productId,
            title: product.tieu_de,
            price: product.gia_tien,
            quantity: 1
          });
        }

        localStorage.setItem('cart', JSON.stringify(cartItems));
        alert('Đã thêm vào giỏ hàng!');
        if (redirectToCart) {
          window.location.href = '../cart/cart.html'; // Redirect to cart page
        }
      } else {
        console.error('Product not found');
      }
    })
    .catch(error => console.error('Error adding to cart:', error));
}

function fetchBooksInSeries(bookId) {
  fetch('./product.json')
    .then(response => response.json())
    .then(data => {
      const currentBookSeries = data.bo_sachs.find(series => 
        series.pivot.ma_sach === bookId
      );
      
      if (!currentBookSeries) {
        return []; // Book not in any series
      }

      // Get all books in same series
      const seriesBooks = data.bo_sachs
        .filter(series => series.ma_bo_sach === currentBookSeries.ma_bo_sach)
        .filter(series => series.pivot.ma_sach !== bookId);
      
      displaySeriesBooks(seriesBooks);
    })
    .catch(error => {
      console.error('Error fetching books in series:', error);
      const container = document.querySelector('.product-in-series');
      container.innerHTML = '<div class="error-message">Không thể tải sách cùng bộ</div>';
    });
}

function displaySeriesBooks(books) {
  const container = document.querySelector('.product-in-series');
  
  if (!books.length) {
    container.innerHTML = '<p>Không có sách cùng bộ</p>';
    return;
  }

  container.innerHTML = books.map(book => `
    <div class="product-card">
      <img src="${book.image || '#'}" alt="${book.ten_bo_sach}" />
      <h3>${book.ten_bo_sach}</h3>
      <a href="detail_product.html?id=${book.pivot.ma_sach}" class="view-details">
        Xem chi tiết
      </a>
    </div>
  `).join('');
}

function fetchRelatedProducts(bookId) {
  fetch('http://13.210.243.191:8000/api/getAllBooks')
    .then(response => response.json())
    .then(response => {
      // Check response structure
      if (!response.status === 'success' || !Array.isArray(response.data)) {
        throw new Error('Invalid data structure');
      }

      // Find current book
      const currentBook = response.data.find(book => book.ma_sach === bookId);
      if (!currentBook) {
        throw new Error('Book not found');
      }

      // Get current book's category
      const currentBookCategory = currentBook.the_loais?.[0]?.ma_the_loai;
      if (!currentBookCategory) {
        throw new Error('Book category not found');
      }

      // Get related books from same category
      const relatedBooks = response.data
        .filter(book => 
          book.the_loais?.some(cat => cat.ma_the_loai === currentBookCategory) &&
          book.ma_sach !== bookId
        )
        .slice(0, 8); // gia tri nay de gioi han so luong sach lien quan

      displayRelatedProducts(relatedBooks);
    })
    .catch(error => {
      console.error('Error fetching related products:', error);
      const container = document.querySelector('.product-in-series');
      container.innerHTML = '<div class="error-message">Không thể tải sách liên quan</div>';
    });
}

// Update display function
function displayRelatedProducts(products) {
  const container = document.querySelector('.product-in-series');
  
  if (!products.length) {
    container.innerHTML = '<p>Không tìm thấy sách liên quan</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-series">
      <a href="detail_product.html?id=${product.ma_sach}">
        <img 
          alt="${product.tieu_de}"
          src="${product.image_url || 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg'}"
        />
      </a>
      <div class="product-series-info">
        <h3>${product.tieu_de}</h3>
        <p class="price">${Number(product.gia_tien).toLocaleString('vi-VN')}đ</p>
      </div>
    </div>
  `).join('');
}

// Update event listener to call both functions
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(urlParams.get('id'));
  if (bookId) {
    fetchBooksInSeries(bookId);
    fetchRelatedProducts(bookId);
  }
});

// slider control
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.product-in-series');
  const prevBtn = document.querySelector('.prev-button');
  const nextBtn = document.querySelector('.next-button');
  
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