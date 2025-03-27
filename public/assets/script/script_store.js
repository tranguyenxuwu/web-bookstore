import { APP_ENV } from "./env.js";

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 0;
let currentType = "";
let filteredBooks = [];
let currentSort = "name-asc"; // Default sort order

// Lấy thông tin từ URL
const urlParams = new URLSearchParams(window.location.search);
currentType = urlParams.get("type") || "";
currentPage = parseInt(urlParams.get("page")) || 1;
const searchQuery = urlParams.get("search") || "";

// Cập nhật URL
function updateURL() {
  const url = new URL(window.location.href);
  if (currentType) {
    url.searchParams.set("type", currentType);
  } else {
    url.searchParams.delete("type");
  }
  url.searchParams.set("page", currentPage);
  history.replaceState({}, "", url);
}

// Fetch dữ liệu
async function fetchData() {
  try {
    document.querySelector(".product-container").innerHTML =
      '<p class="loading">Đang tải...</p>';

    // Thêm timeout để tránh treo trang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(APP_ENV.MASTER_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Network error");

    const responseData = await response.json();

    // Handle different response formats
    let bookData;
    if (Array.isArray(responseData)) {
      bookData = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      bookData = responseData.data;
    } else if (responseData.books && Array.isArray(responseData.books)) {
      bookData = responseData.books;
    } else {
      bookData =
        responseData && typeof responseData === "object" ? [responseData] : [];
      console.warn("Unexpected API response format:", responseData);
    }

    filteredBooks = [...bookData];

    // Áp dụng bộ lọc tìm kiếm
    if (searchQuery) {
      filteredBooks = filteredBooks.filter((book) => {
        const searchTerm = searchQuery.toLowerCase();
        return [
          book.tieu_de?.toLowerCase(),
          book.gioi_thieu?.toLowerCase(),
          // Add other searchable fields if they become available
        ].some((field) => field?.includes(searchTerm));
      });
    }

    // Áp dụng bộ lọc thể loại
    if (currentType && currentType !== "Tất cả") {
      filteredBooks = filteredBooks.filter((book) => {
        if (!book.the_loais || !Array.isArray(book.the_loais)) return false;
        
        return book.the_loais.some(
          (category) => category.ten_the_loai?.toLowerCase() === currentType.toLowerCase()
        );
      });
    }

    // Áp dụng sắp xếp
    sortBooks(currentSort);

    // Cập nhật phân trang
    totalItems = filteredBooks.length;
    totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    currentPage = Math.min(currentPage, totalPages);

    document.getElementById("total-results").textContent = totalItems;

    if (totalItems === 0) {
      document.querySelector(".product-container").innerHTML =
        '<p class="no-results">Không tìm thấy sản phẩm.</p>';
      return;
    }

    displayPage(filteredBooks);
    updatePagination();
    updateURL();
  } catch (error) {
    console.error("Error:", error);
    document.querySelector(".product-container").innerHTML =
      '<p class="error">Đã xảy ra lỗi khi tải dữ liệu.</p>';
  }
}

// Sắp xếp sách theo tiêu chí
function sortBooks(sortCriteria) {
  currentSort = sortCriteria;
  
  switch (sortCriteria) {
    case "name-asc":
      filteredBooks.sort((a, b) => 
        (a.tieu_de || "").localeCompare(b.tieu_de || "")
      );
      break;
    case "name-desc":
      filteredBooks.sort((a, b) => 
        (b.tieu_de || "").localeCompare(a.tieu_de || "")
      );
      break;
    case "price-asc":
      filteredBooks.sort((a, b) => 
        (parseInt(a.gia_tien) || 0) - (parseInt(b.gia_tien) || 0)
      );
      break;
    case "price-desc":
      filteredBooks.sort((a, b) => 
        (parseInt(b.gia_tien) || 0) - (parseInt(a.gia_tien) || 0)
      );
      break;
  }
}

// Hiển thị sản phẩm
function displayPage(items) {
  const productContainer = document.querySelector(".product-container");
  productContainer.innerHTML = "";

  items
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .forEach((book) => {
      const productElement = document.createElement("div");
      productElement.className = "product";

      productElement.innerHTML = `
        <a href="./product.html?id=${book.ma_sach}">
          <img src="${
            book.sach_bia_sach?.url_bia_chinh || APP_ENV.PLACEHOLDER_IMAGE
          }" 
               alt="${book.tieu_de || "Sản phẩm"}"
               onerror="this.src='${APP_ENV.PLACEHOLDER_IMAGE}'">
        </a>
        <div class="product-info">
          <h3>${book.tieu_de || "Không có tiêu đề"}</h3>
          ${
            book.gia_tien
              ? `<p class="price">${new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(book.gia_tien)}</p>`
              : ""
          }
          ${book.so_tap ? `<p class="volume">Tập: ${book.so_tap}</p>` : ""}
        </div>
      `;

      productContainer.appendChild(productElement);
    });
}

// Phân trang
function updatePagination() {
  const pagination = document.querySelector(".pagination");
  pagination.innerHTML = "";

  // Previous button
  const prevBtn = createButton("←", currentPage > 1, () => currentPage--);
  pagination.appendChild(prevBtn);

  // Page numbers
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    const btn = createButton(i, true, () => (currentPage = i));
    if (i === currentPage) btn.classList.add("active");
    pagination.appendChild(btn);
  }

  // Next button
  const nextBtn = createButton(
    "→",
    currentPage < totalPages,
    () => currentPage++
  );
  pagination.appendChild(nextBtn);

  // Update UI
  updateURL();
  displayPage(filteredBooks);
}

function createButton(text, enabled, action) {
  const btn = document.createElement("button");
  btn.className = "page-button" + (enabled ? "" : " disabled");
  btn.textContent = text;
  if (enabled) {
    btn.addEventListener("click", () => {
      action();
      updatePagination();
    });
  }
  return btn;
}

// Tìm kiếm
document
  .querySelector(".search-button")
  .addEventListener("click", performSearch);
document.querySelector(".search-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") performSearch();
});

async function performSearch() {
  const query = document.querySelector(".search-input").value.trim();
  
  try {
    // Cho phép tìm kiếm trống (sẽ hiển thị tất cả sản phẩm)
    const url = query 
      ? `${APP_ENV.SEARCH_URL}?title=${encodeURIComponent(query)}`
      : APP_ENV.MASTER_URL;
      
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    
    const results = await response.json();

    sessionStorage.setItem("searchResults", JSON.stringify(results));
    window.location.href = `search.html?title=${encodeURIComponent(query)}`;
  } catch (error) {
    console.error("Search failed:", error);
  }
}

// Add event listeners for categories
document.addEventListener("DOMContentLoaded", () => {
  // Setup category filters
  document.querySelectorAll(".categories a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentType = e.target.getAttribute("data-type");
      currentPage = 1; // Reset to first page
      fetchData();
      
      // Add active class to current category
      document.querySelectorAll(".categories a").forEach(el => {
        el.classList.remove("active");
      });
      e.target.classList.add("active");
    });
  });
  
  // Setup sort dropdown
  document.getElementById("sort-options").addEventListener("change", (e) => {
    sortBooks(e.target.value);
    displayPage(filteredBooks);
  });
  
  // Initial load
  fetchData();
});
