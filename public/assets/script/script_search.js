import { APP_ENV } from "./env.js";

// Global variables for search results and pagination
let filteredBooks = [];
let totalItems = 0;
let totalPages = 0;
let currentPage = 1;
const itemsPerPage = 8;
let currentSort = "name-asc"; // Default sort order

function displaySearchResults() {
  // Lấy query từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get("title") || urlParams.get("query") || "";
  
  // Hiển thị searchTerm trong input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.value = searchTerm;
  }
  
  // Nếu không có kết quả tìm kiếm được lưu, thực hiện tìm kiếm mới
  if (!sessionStorage.getItem("searchResults") && searchTerm) {
    performSearch(searchTerm, false);
    return;
  }
  
  const results = JSON.parse(sessionStorage.getItem("searchResults") || "[]");

  if (!results || results.length === 0) {
    document.querySelector(".product-container").innerHTML =
      '<p class="no-results">Không tìm thấy sản phẩm.</p>';
    
    if (document.getElementById("total-results")) {
      document.getElementById("total-results").textContent = "0";
    }
    return;
  }

  filteredBooks = results;
  totalItems = filteredBooks.length;
  totalPages = Math.ceil(totalItems / itemsPerPage);
  currentPage = 1;

  if (document.getElementById("total-results")) {
    document.getElementById("total-results").textContent = totalItems;
  }
  
  // Áp dụng sắp xếp trước khi hiển thị
  sortBooks(currentSort);
  
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

  // Tạo các sản phẩm trực tiếp trong container thay vì tạo grid container
  for (let i = startIndex; i < endIndex; i++) {
    const book = books[i];
    const productElement = createBookElement(book);
    productContainer.appendChild(productElement);
  }
}

// Create HTML element for a single book
function createBookElement(book) {
  const productElement = document.createElement("div");
  productElement.className = "product";

  productElement.innerHTML = `
    <a href="./product.html?id=${book.ma_sach || book.id}">
      <img src="${
        book.sach_bia_sach?.url_bia_chinh || 
        book.cover_image || 
        './assets/image/placeholder.jpg'
      }" 
           alt="${book.tieu_de || book.title || "Sản phẩm"}"
           onerror="this.src='./assets/image/placeholder.jpg'">
    </a>
    <div class="product-info">
      <h3>${book.tieu_de || book.title || "Không có tiêu đề"}</h3>
      ${
        book.gia_tien || book.price
          ? `<p class="price">${new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(book.gia_tien || book.price)}</p>`
          : ""
      }
      ${book.so_tap ? `<p class="volume">Tập: ${book.so_tap}</p>` : ""}
    </div>
  `;

  return productElement;
}

// Sắp xếp sách theo tiêu chí
function sortBooks(sortCriteria) {
  currentSort = sortCriteria;
  
  switch (sortCriteria) {
    case "name-asc":
      filteredBooks.sort((a, b) => 
        (a.tieu_de || a.title || "").localeCompare(b.tieu_de || b.title || "")
      );
      break;
    case "name-desc":
      filteredBooks.sort((a, b) => 
        (b.tieu_de || b.title || "").localeCompare(a.tieu_de || a.title || "")
      );
      break;
    case "price-asc":
      filteredBooks.sort((a, b) => 
        (parseInt(a.gia_tien || a.price) || 0) - (parseInt(b.gia_tien || b.price) || 0)
      );
      break;
    case "price-desc":
      filteredBooks.sort((a, b) => 
        (parseInt(b.gia_tien || b.price) || 0) - (parseInt(a.gia_tien || a.price) || 0)
      );
      break;
  }
}

// Update the pagination controls
function updatePagination() {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;
  
  paginationContainer.innerHTML = "";

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return;
  }

  // Create previous button
  const prevButton = document.createElement("button");
  prevButton.className = "page-button " + (currentPage === 1 ? "disabled" : "");
  prevButton.textContent = "←";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayPage(filteredBooks);
      updatePagination();
    }
  });
  paginationContainer.appendChild(prevButton);

  // Create page number buttons
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
    pageBtn.className = `page-button ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i;

    pageBtn.addEventListener("click", () => {
      currentPage = i;
      displayPage(filteredBooks);
      updatePagination();
    });

    paginationContainer.appendChild(pageBtn);
  }

  // Create next button
  const nextButton = document.createElement("button");
  nextButton.className = "page-button " + (currentPage === totalPages ? "disabled" : "");
  nextButton.textContent = "→";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayPage(filteredBooks);
      updatePagination();
    }
  });
  paginationContainer.appendChild(nextButton);
}

// Setup search functionality
function setupSearch() {
  const searchForm = document.getElementById("search-form");
  const sortOptions = document.getElementById("sort-options");

  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      const searchTerm = searchInput ? searchInput.value.trim() : "";
      
      // Allow empty searches - this will show all products
      performSearch(searchTerm);
    });
  }
  
  // Setup sorting
  if (sortOptions) {
    sortOptions.addEventListener("change", (e) => {
      sortBooks(e.target.value);
      displayPage(filteredBooks);
    });
  }
  
  // Setup category filters
  document.querySelectorAll(".categories a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Clear current results
      sessionStorage.removeItem("searchResults");
      // Redirect to store page with category filter
      window.location.href = `store.html?type=${e.target.getAttribute("data-type")}&page=1`;
    });
  });
}

// Helper function to perform the actual search
function performSearch(searchTerm, redirect = true) {
  // Nếu không có searchTerm, tìm kiếm tất cả sản phẩm
  const url = searchTerm 
    ? `${APP_ENV.SEARCH_URL}?title=${encodeURIComponent(searchTerm)}`
    : APP_ENV.MASTER_URL;
    
  fetch(url)
    .then((response) => response.json())
    .then((results) => {
      // Lưu kết quả vào sessionStorage
      sessionStorage.setItem("searchResults", JSON.stringify(results));
      
      // Nếu cần chuyển hướng
      if (redirect) {
        window.location.href = `search.html?title=${encodeURIComponent(searchTerm || "")}`;
      } else {
        // Nếu không, hiển thị kết quả trực tiếp
        displaySearchResults();
      }
    })
    .catch((error) => {
      console.error("Search error:", error);
      // Hiển thị thông báo lỗi
      document.querySelector(".product-container").innerHTML =
        '<p class="no-results">Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.</p>';
    });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  if (window.location.pathname.includes("search.html")) {
    displaySearchResults();
  }
});
