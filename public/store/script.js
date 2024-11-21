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
  fetch('../index/product.json')
    .then(response => response.json())
    .then(data => {
      filteredBooks = data.books;
      if (searchQuery) {
        filteredBooks = filteredBooks.filter(book =>
          book.bookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (book.publisher && book.publisher.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      } else if (currentType && currentType.toLowerCase() !== 'tất cả') {
        filteredBooks = filteredBooks.filter(book => book.type.toLowerCase() === currentType.toLowerCase());
      }
      totalItems = filteredBooks.length;
      totalPages = Math.ceil(totalItems / itemsPerPage);
      document.getElementById('total-results').textContent = totalItems;

      // Hiển thị nếu không tìm thấy sản phẩm
      if (totalItems === 0) {
        document.querySelector('.product-container').innerHTML = '<p class="no-results">Không tìm thấy sản phẩm phù hợp.</p>';
        return;
      }

      displayPage(filteredBooks);
      updatePagination();
    })
    .catch(error => console.error('Error fetching book data:', error));
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

    const imageElement = document.createElement('img');
    imageElement.alt = book.bookName;

    if (book.image) {
      imageElement.src = book.image;
    } else {
      imageElement.src = 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
      imageElement.alt = 'Placeholder image';
    }

    imageElement.onerror = () => {
      imageElement.src = 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
    };

    const productInfoElement = document.createElement('div');
    productInfoElement.classList.add('product-info');

    const titleElement = document.createElement('h3');
    titleElement.textContent = book.bookName;

    const typeElement = document.createElement('p');
    typeElement.textContent = `Thể loại: ${book.type}`;

    const authorElement = document.createElement('p');
    authorElement.textContent = `Tác giả: ${book.author}`;

    const priceElement = document.createElement('div');
    priceElement.classList.add('price');

    const saleElement = document.createElement('span');
    saleElement.classList.add('sale-price');
    saleElement.textContent = `${book.price} VND`;

    if (book.originPrice) {
      const originPriceElement = document.createElement('span');
      originPriceElement.classList.add('original-price');
      originPriceElement.textContent = `${book.originPrice} VND`;
      priceElement.appendChild(originPriceElement);
    }

    priceElement.appendChild(saleElement);

    productInfoElement.appendChild(titleElement);
    productInfoElement.appendChild(typeElement);
    productInfoElement.appendChild(authorElement);
    productInfoElement.appendChild(priceElement);

    productElement.appendChild(imageElement);
    productElement.appendChild(productInfoElement);

    productContainer.appendChild(productElement);
  });
}

// Cập nhật phân trang
function updatePagination() {
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
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
