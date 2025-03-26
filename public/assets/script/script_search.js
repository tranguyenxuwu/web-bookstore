import { APP_ENV } from "./env.js";

// Global variables for search results and pagination
let filteredBooks = [];
let totalItems = 0;
let totalPages = 0;
let currentPage = 1;
const itemsPerPage = 10; // Default value - adjust as needed

function displaySearchResults() {
  const results = JSON.parse(sessionStorage.getItem("searchResults"));

  if (!results) {
    document.querySelector(".product-container").innerHTML =
      '<p class="no-results">Không tìm thấy sản phẩm.</p>';
    return;
  }

  filteredBooks = results;
  totalItems = filteredBooks.length;
  totalPages = Math.ceil(totalItems / itemsPerPage);
  currentPage = 1;

  document.getElementById("total-results").textContent = totalItems;
  displayPage(filteredBooks);
  updatePagination();
}

// Display the current page of search results
function displayPage(books) {
  const productContainer = document.querySelector(".product-container");
  productContainer.innerHTML = "";

  // Calculate indexes for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, books.length);

  // Check if there are books to display
  if (books.length === 0) {
    productContainer.innerHTML =
      '<p class="no-results">Không tìm thấy sản phẩm.</p>';
    return;
  }

  // Create a container for the books
  const productsGrid = document.createElement("div");
  productsGrid.className = "products-grid";

  // Loop through books for the current page and create HTML for each
  for (let i = startIndex; i < endIndex; i++) {
    const book = books[i];
    const productElement = createBookElement(book);
    productsGrid.appendChild(productElement);
  }

  productContainer.appendChild(productsGrid);
}

// Create HTML element for a single book
function createBookElement(book) {
  const productElement = document.createElement("div");
  productElement.className = "product";

  // Format price with comma separators
  const formattedPrice = parseInt(book.gia_tien).toLocaleString("vi-VN");

  productElement.innerHTML = `
    <a href="/public/product.html?id=${book.ma_sach}" class="product-link">
      <div class="product-image">
        <img src="/public/assets/images/books/${book.ma_sach}.jpg" 
             alt="${book.tieu_de}" 
             onerror="this.src='${APP_ENV.PLACEHOLDER_IMAGE}'">
      </div>
      <div class="product-info">
        <h3>${book.tieu_de}</h3>
        <p class="author">Tập ${book.so_tap}</p>
        <div class="price">
          <span class="sale-price">${formattedPrice}₫</span>
        </div>
      </div>
    </a>
  `;

  return productElement;
}

// Update the pagination controls
function updatePagination() {
  const paginationContainer = document.querySelector(".pagination");
  paginationContainer.innerHTML = "";

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return;
  }

  // Create previous button
  const prevButton = document.createElement("button");
  prevButton.className = "pagination-btn prev";
  prevButton.textContent = "Trước";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayPage(filteredBooks);
      updatePagination();
    }
  });

  // Create next button
  const nextButton = document.createElement("button");
  nextButton.className = "pagination-btn next";
  nextButton.textContent = "Sau";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayPage(filteredBooks);
      updatePagination();
    }
  });

  // Create page number buttons
  const pageNumbers = document.createElement("div");
  pageNumbers.className = "page-numbers";

  // Determine which page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  // Adjust if we're near the end
  if (endPage - startPage < 4 && startPage > 1) {
    startPage = Math.max(1, endPage - 4);
  }

  // Add page number buttons
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-btn page-num ${
      i === currentPage ? "active" : ""
    }`;
    pageBtn.textContent = i;

    pageBtn.addEventListener("click", () => {
      currentPage = i;
      displayPage(filteredBooks);
      updatePagination();
    });

    pageNumbers.appendChild(pageBtn);
  }

  // Assemble pagination
  paginationContainer.appendChild(prevButton);
  paginationContainer.appendChild(pageNumbers);
  paginationContainer.appendChild(nextButton);
}

// Add this function to fix the error
function setupSearch() {
  const searchForm = document.getElementById("search-form");

  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      const searchTerm = searchInput ? searchInput.value.trim() : "";

      if (searchTerm) {
        // Perform search and store results in sessionStorage
        // This is a placeholder - implement actual search logic as needed
        performSearch(searchTerm);
      }
    });
  }
}

// Add this function to handle the search button click from the HTML
function searchBooks() {
  const searchInput = document.querySelector(".search-input");
  const searchTerm = searchInput ? searchInput.value.trim() : "";

  if (searchTerm) {
    performSearch(searchTerm);
  }
}

// Helper function to perform the actual search
function performSearch(searchTerm) {
  // This is where you would fetch search results from your API or data source
  // For now, just a placeholder implementation
  fetch(`${APP_ENV.SEARCH_URL}?title=${encodeURIComponent(searchTerm)}`)
    .then((response) => response.json())
    .then((results) => {
      sessionStorage.setItem("searchResults", JSON.stringify(results));
      window.location.href = "/public/search.html";
    })
    .catch((error) => {
      console.error("Search error:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  if (window.location.pathname.includes("/public/search.html")) {
    displaySearchResults();
  }
});
