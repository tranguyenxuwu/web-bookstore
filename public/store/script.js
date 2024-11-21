let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 0;
let currentType = '';
let filteredBooks = [];

// Lấy thông tin từ URL (type, page, search)
const urlParams = new URLSearchParams(window.location.search);
currentType = urlParams.get('type') || '';
currentPage = parseInt(urlParams.get('page')) || 1;
let searchQuery = urlParams.get('search') || '';

// Cập nhật URL khi thay đổi
function updateURL() {
  const url = new URL(window.location.href);
  url.searchParams.set('type', currentType);
  url.searchParams.set('page', currentPage);
  history.pushState({}, '', url);
}

// Lấy dữ liệu từ JSON
function fetchData() {
  document.querySelector('.product-container').innerHTML = '<p class="loading">Đang tải...</p>';

  // lưu ý : chỉ sử dụng 1 trong 2 cách lấy dữ liệu dưới đây

  // fetch("../index/product.json") // cách 1: lấy dữ liệu từ file JSON
  fetch('http://localhost/api/getAllBooks') // cách 2: lấy dữ liệu từ API
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(response => {
      // Extract data from response structure
      const data = response.data || [];
      filteredBooks = [...data];

      // Apply search filters
      if (searchQuery) {
        filteredBooks = filteredBooks.filter(book => {
          const titleMatch = book.tieu_de?.toLowerCase().includes(searchQuery.toLowerCase());
          const authorMatch = book.tac_gias?.some(author => 
            author.ten_tac_gia?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const publisherMatch = book.nha_xuat_ban?.ten_nha_xuat_ban?.toLowerCase().includes(searchQuery.toLowerCase());
          const genreMatch = book.the_loais?.some(genre =>
            genre.ten_the_loai?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          return titleMatch || authorMatch || publisherMatch || genreMatch;
        });
      }

      // Apply category filter
      if (currentType && currentType.toLowerCase() !== 'tất cả') {
        filteredBooks = filteredBooks.filter(book => 
          book.the_loais?.some(genre => 
            genre.ten_the_loai?.toLowerCase() === currentType.toLowerCase()
          )
        );
      }

      // Update pagination
      totalItems = filteredBooks.length;
      totalPages = Math.ceil(totalItems / itemsPerPage);
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
    })
    .catch(error => {
      console.error('Error:', error);
      document.querySelector('.product-container').innerHTML = 
        '<p class="error">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>';
    });
  } 

// Hiển thị trang
function displayPage(items) {
  const productContainer = document.querySelector('.product-container');
  productContainer.innerHTML = '';

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToDisplay = items.slice(startIndex, endIndex);

  itemsToDisplay.forEach(book => {
    const productElement = document.createElement('div');
    productElement.classList.add('product');

    // Create book image
    const imageElement = document.createElement('img');
    imageElement.alt = book.tieu_de;
    // Default placeholder image if no image provided
    imageElement.src = 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
    imageElement.onerror = () => {
      imageElement.src = 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
    };

    // Create book info container
    const infoContainer = document.createElement('div');
    infoContainer.classList.add('product-info');

    // Add title
    const titleElement = document.createElement('h3');
    titleElement.textContent = book.tieu_de;
    infoContainer.appendChild(titleElement);

    // Add price
    if (book.gia_tien) {
      const priceElement = document.createElement('p');
      priceElement.classList.add('price');
      priceElement.textContent = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(book.gia_tien);
      infoContainer.appendChild(priceElement);
    }

    // Add book details link
    const linkElement = document.createElement('a');
    linkElement.href = `/book-detail.html?id=${book.ma_sach}`;
    linkElement.appendChild(imageElement);
    
    productElement.appendChild(linkElement);
    productElement.appendChild(infoContainer);
    productContainer.appendChild(productElement);
  });
}

// Cập nhật phân trang
function updatePagination() {
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = '';

  // Add previous button
  const prevButton = document.createElement('button');
  prevButton.textContent = '←';
  prevButton.classList.add('page-button', 'nav-button');
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateURL();
      displayPage(filteredBooks);
      updatePagination();
    }
  });
  paginationContainer.appendChild(prevButton);

  // Calculate page range to show
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start if end is maxed out
  startPage = Math.max(1, endPage - maxVisiblePages + 1);

  // Add first page if needed
  if (startPage > 1) {
    const firstButton = document.createElement('button');
    firstButton.textContent = '1';
    firstButton.classList.add('page-button');
    firstButton.addEventListener('click', () => {
      currentPage = 1;
      updateURL();
      displayPage(filteredBooks);
      updatePagination();
    });
    paginationContainer.appendChild(firstButton);

    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.classList.add('ellipsis');
      paginationContainer.appendChild(ellipsis);
    }
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.add('page-button');
    if (i === currentPage) {
      pageButton.classList.add('active');
    }
    pageButton.addEventListener('click', () => {
      currentPage = i;
      updateURL();
      displayPage(filteredBooks);
      updatePagination();
    });
    paginationContainer.appendChild(pageButton);
  }

  // Add last page if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.classList.add('ellipsis');
      paginationContainer.appendChild(ellipsis);
    }

    const lastButton = document.createElement('button');
    lastButton.textContent = totalPages;
    lastButton.classList.add('page-button');
    lastButton.addEventListener('click', () => {
      currentPage = totalPages;
      updateURL();
      displayPage(filteredBooks);
      updatePagination();
    });
    paginationContainer.appendChild(lastButton);
  }

  // Add next button
  const nextButton = document.createElement('button');
  nextButton.textContent = '→';
  nextButton.classList.add('page-button', 'nav-button');
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateURL();
      displayPage(filteredBooks);
      updatePagination();
    }
  });
  paginationContainer.appendChild(nextButton);
}

// Tìm kiếm
document.querySelector('.search-button').addEventListener('click', () => {
  const query = document.querySelector('.search-input').value.toLowerCase();
  fetch('../index/product.json')
    .then(response => response.json())
    .then(data => {
      filteredBooks = data.books.filter(book =>
        book.bookName.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.publisher && book.publisher.toLowerCase().includes(query))
      );
      totalItems = filteredBooks.length;
      totalPages = Math.ceil(totalItems / itemsPerPage);
      document.getElementById('total-results').textContent = totalItems;
      currentPage = 1;
      updateURL();
      displayPage(filteredBooks);
      updatePagination();
    })
    .catch(error => console.error('Error fetching book data:', error));
});

// Lọc theo thể loại
document.querySelectorAll('.categories a').forEach(categoryLink => {
  categoryLink.addEventListener('click', (event) => {
    event.preventDefault();
    currentType = event.target.getAttribute('data-type');
    fetchData();
  });
});

// Sắp xếp sản phẩm
document.getElementById('sort-options').addEventListener('change', (event) => {
  const sortOption = event.target.value;
  sortProducts(sortOption);
  displayPage(filteredBooks);
  updatePagination();
});

function sortProducts(option) {
  switch (option) {
    case 'name-asc':
      filteredBooks.sort((a, b) => a.bookName.localeCompare(b.bookName));
      break;
    case 'name-desc':
      filteredBooks.sort((a, b) => b.bookName.localeCompare(a.bookName));
      break;
    case 'price-asc':
      filteredBooks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-desc':
      filteredBooks.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
  }
}

// Khởi động
fetchData();
