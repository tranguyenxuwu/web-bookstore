import { APP_ENV } from './env.js';

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 0;
let currentType = '';
let filteredBooks = [];

// Lấy thông tin từ URL
const urlParams = new URLSearchParams(window.location.search);
currentType = urlParams.get('type') || '';
currentPage = parseInt(urlParams.get('page')) || 1;
const searchQuery = urlParams.get('search') || '';

// Cập nhật URL
function updateURL() {
  const url = new URL(window.location.href);
  url.searchParams.set('type', currentType);
  url.searchParams.set('page', currentPage);
  history.replaceState({}, '', url);
}

// Fetch dữ liệu
async function fetchData() {
  try {
    document.querySelector('.product-container').innerHTML = '<p class="loading">Đang tải...</p>';
    
    const response = await fetch(APP_ENV.MASTER_URL);
    if (!response.ok) throw new Error('Network error');
    
    const responseData = await response.json();
    
    // Handle different response formats
    let bookData;
    if (Array.isArray(responseData)) {
      // If the response is directly an array
      bookData = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // If the response has a data property that's an array
      bookData = responseData.data;
    } else if (responseData.books && Array.isArray(responseData.books)) {
      // Alternative property name
      bookData = responseData.books;
    } else {
      // If we can't find an array, create one from the single object if applicable
      bookData = responseData && typeof responseData === 'object' ? [responseData] : [];
      console.warn('Unexpected API response format:', responseData);
    }
    
    filteredBooks = [...bookData];

    // Áp dụng bộ lọc
    if (searchQuery) {
      filteredBooks = filteredBooks.filter(book => {
        const searchTerm = searchQuery.toLowerCase();
        return [
          book.tieu_de?.toLowerCase(),
          book.gioi_thieu?.toLowerCase()
          // Add other searchable fields if they become available
        ].some(field => field?.includes(searchTerm));
      });
    }

    // Cập nhật phân trang
    totalItems = filteredBooks.length;
    totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    currentPage = Math.min(currentPage, totalPages);
    
    document.getElementById('total-results').textContent = totalItems;
    
    if (totalItems === 0) {
      document.querySelector('.product-container').innerHTML = 
        '<p class="no-results">Không tìm thấy sản phẩm.</p>';
      return;
    }

    displayPage(filteredBooks);
    updatePagination();
    updateURL();

  } catch (error) {
    console.error('Error:', error);
    document.querySelector('.product-container').innerHTML = 
      '<p class="error">Đã xảy ra lỗi khi tải dữ liệu.</p>';
  }
}

// Hiển thị sản phẩm
function displayPage(items) {
  const productContainer = document.querySelector('.product-container');
  productContainer.innerHTML = '';

  items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .forEach(book => {
      const productElement = document.createElement('div');
      productElement.className = 'product';
      
      productElement.innerHTML = `
        <a href="../detail_product/detail_product.html?id=${book.ma_sach}">
          <img src="${book.hinh_anh || '../image/placeholder.jpg'}" 
               alt="${book.tieu_de}"
               onerror="this.src='../image/placeholder.jpg'">
        </a>
        <div class="product-info">
          <h3>${book.tieu_de}</h3>
          ${book.gia_tien ? `<p class="price">${new Intl.NumberFormat('vi-VN', 
            { style: 'currency', currency: 'VND' }).format(book.gia_tien)}</p>` : ''}
          ${book.so_tap ? `<p class="volume">Tập: ${book.so_tap}</p>` : ''}
        </div>
      `;
      
      productContainer.appendChild(productElement);
    });
}

// Phân trang
function updatePagination() {
  const pagination = document.querySelector('.pagination');
  pagination.innerHTML = '';

  // Previous button
  const prevBtn = createButton('←', currentPage > 1, () => currentPage--);
  pagination.appendChild(prevBtn);

  // Page numbers
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  
  for (let i = start; i <= end; i++) {
    const btn = createButton(i, true, () => currentPage = i);
    if (i === currentPage) btn.classList.add('active');
    pagination.appendChild(btn);
  }

  // Next button
  const nextBtn = createButton('→', currentPage < totalPages, () => currentPage++);
  pagination.appendChild(nextBtn);

  // Update UI
  updateURL();
  displayPage(filteredBooks);
}

function createButton(text, enabled, action) {
  const btn = document.createElement('button');
  btn.className = 'page-button' + (enabled ? '' : ' disabled');
  btn.textContent = text;
  if (enabled) {
    btn.addEventListener('click', () => {
      action();
      updatePagination();
    });
  }
  return btn;
}

// Tìm kiếm
document.querySelector('.search-button').addEventListener('click', performSearch);
document.querySelector('.search-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') performSearch();
});

async function performSearch() {
  const query = document.querySelector('.search-input').value.trim();
  if (!query) return;
  
  try {
    // Use the APP_ENV from your env.js file with the title parameter
    const response = await fetch(`${window.APP_ENV.SEARCH_URL}?title=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const results = await response.json();
    
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    window.location.href = `../search.html?title=${encodeURIComponent(query)}`;
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Khởi động
document.addEventListener('DOMContentLoaded', fetchData);