import { APP_ENV } from "./env.js";

// --- Configuration ---
const ITEMS_PER_PAGE = 8;
const API_TIMEOUT = 8000; // Increased timeout slightly
const PLACEHOLDER_IMAGE =
  APP_ENV.PLACEHOLDER_IMAGE || "path/to/default/placeholder.png"; // Use env placeholder

// --- State Variables ---
let currentPage = 1;
let totalItems = 0;
let totalPages = 0;
let currentTypeFilter = ""; // Renamed for clarity
let currentSort = "name-asc"; // Default sort
let allBooks = []; // Stores the original fetched data
let filteredBooks = []; // Stores the currently filtered and sorted data
let currentSearchQuery = ""; // Store search query from URL

// --- DOM Element References (Optional, but can improve performance slightly) ---
// Select elements that are frequently accessed if they are guaranteed to exist on load
const productContainer = document.querySelector(".product-container");
const paginationContainer = document.querySelector(".pagination");
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const categoryLinks = document.querySelectorAll(".categories a");
const sortDropdown = document.getElementById("sort-options");
const totalResultsDisplay = document.getElementById("total-results");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", initializeStore);

function initializeStore() {
  // 1. Read initial state from URL
  readUrlParams();

  // 2. Setup Event Listeners
  setupEventListeners();

  // 3. Fetch initial data and display
  fetchAndDisplayBooks();
}

// --- URL Handling ---
function readUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  currentTypeFilter = urlParams.get("type") || ""; // Use 'all' or empty string for no filter? Let's use ""
  currentPage = parseInt(urlParams.get("page"), 10) || 1; // Base 10 parsing
  currentSearchQuery = urlParams.get("search") || ""; // Read search query
  // Note: currentSort is not typically read from URL unless needed
}

function updateURL() {
  const url = new URL(window.location.href);
  // Use current state variables to set parameters
  if (currentTypeFilter) {
    url.searchParams.set("type", currentTypeFilter);
  } else {
    url.searchParams.delete("type");
  }
  if (currentSearchQuery) {
    // Add search query to URL if present
    url.searchParams.set("search", currentSearchQuery);
  } else {
    url.searchParams.delete("search");
  }

  url.searchParams.set("page", currentPage);
  // Update browser history without reloading the page
  history.replaceState(
    { page: currentPage, type: currentTypeFilter, search: currentSearchQuery },
    "",
    url
  );
}

// --- Data Fetching and Processing ---
async function fetchAndDisplayBooks() {
  showLoadingState(true);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`API request timed out after ${API_TIMEOUT}ms`);
    }, API_TIMEOUT);

    const response = await fetch(APP_ENV.MASTER_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Network error: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    allBooks = parseBookData(responseData); // Store raw data

    processBooks(); // Apply filters, sort, and update display
  } catch (error) {
    console.error("Error fetching book data:", error);
    showErrorState("Đã xảy ra lỗi khi tải dữ liệu sách.");
  } finally {
    showLoadingState(false);
  }
}

function parseBookData(responseData) {
  // Handle different possible API response structures
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (responseData?.data && Array.isArray(responseData.data)) {
    return responseData.data;
  } else if (responseData?.books && Array.isArray(responseData.books)) {
    return responseData.books;
  } else if (
    responseData &&
    typeof responseData === "object" &&
    !Array.isArray(responseData)
  ) {
    // If it's a single object, wrap it in an array? Or is this an error?
    console.warn(
      "Received a single object, expected an array. Wrapping it:",
      responseData
    );
    return [responseData];
  }
  console.warn("Unexpected API response format or empty data:", responseData);
  return []; // Return empty array if format is unknown
}

function processBooks() {
  // 1. Apply Filters (Search and Type)
  applyFilters();

  // 2. Apply Sorting
  applySorting(); // Sorts the 'filteredBooks' array in place

  // 3. Update Pagination State
  updatePaginationState();

  // 4. Display the current page of results
  displayCurrentPage();

  // 5. Render the pagination controls
  renderPaginationControls();

  // 6. Update the URL to reflect the current state
  updateURL();

  // 7. Update total results count display
  if (totalResultsDisplay) {
    totalResultsDisplay.textContent = totalItems;
  }
}

function applyFilters() {
  let booksToFilter = [...allBooks]; // Start with a fresh copy of all books

  // Apply Search Filter first
  if (currentSearchQuery) {
    const searchTerm = currentSearchQuery.toLowerCase().trim();
    if (searchTerm) {
      booksToFilter = booksToFilter.filter((book) => {
        return [
          book.tieu_de?.toLowerCase(),
          book.gioi_thieu?.toLowerCase(),
          book.tac_gia?.ten_tac_gia?.toLowerCase(), // Example: Add author
          book.nha_xuat_ban?.ten_nha_xuat_ban?.toLowerCase(), // Example: Add publisher
        ].some((field) => field?.includes(searchTerm));
      });
    }
  }

  // Apply Type Filter (using kieu_sach, assuming master list has it)
  // **Important**: Adjust this if your master list uses `the_loais` instead!
  if (currentTypeFilter && currentTypeFilter !== "Tất cả") {
    // Assuming "Tất cả" means no filter
    const typeFilterLower = currentTypeFilter.toLowerCase();
    booksToFilter = booksToFilter.filter((book) => {
      // Check if kieu_sach exists and has the correct name property
      return book.kieu_sach?.ten_kieu_sach?.toLowerCase() === typeFilterLower;

      // --- OR If using the_loais (like original code) ---
      /*
             if (!book.the_loais || !Array.isArray(book.the_loais)) return false;
             return book.the_loais.some(
                (category) => category.ten_the_loai?.toLowerCase() === typeFilterLower
             );
             */
      // --- End the_loais alternative ---
    });
  }

  filteredBooks = booksToFilter; // Update the state variable
}

function applySorting() {
  // Sorts the 'filteredBooks' array in place based on 'currentSort'
  switch (currentSort) {
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
      // Use parseFloat for potentially decimal prices, default to 0 if invalid
      filteredBooks.sort(
        (a, b) => (parseFloat(a.gia_tien) || 0) - (parseFloat(b.gia_tien) || 0)
      );
      break;
    case "price-desc":
      filteredBooks.sort(
        (a, b) => (parseFloat(b.gia_tien) || 0) - (parseFloat(a.gia_tien) || 0)
      );
      break;
    // Add more cases if needed (e.g., date)
    default:
      console.warn("Unknown sort criteria:", currentSort);
  }
}

function updatePaginationState() {
  totalItems = filteredBooks.length;
  totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1; // Ensure at least 1 page
  // Clamp currentPage to be within valid range
  currentPage = Math.max(1, Math.min(currentPage, totalPages));
}

// --- UI Display Functions ---

function displayCurrentPage() {
  if (!productContainer) {
    console.error("Product container not found!");
    return;
  }
  productContainer.innerHTML = ""; // Clear previous content

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = filteredBooks.slice(startIndex, endIndex);

  if (pageItems.length === 0) {
    productContainer.innerHTML =
      '<p class="no-results">Không tìm thấy sản phẩm phù hợp.</p>';
    return; // Nothing more to display
  }

  const fragment = document.createDocumentFragment(); // More efficient for appending multiple elements
  pageItems.forEach((book) => {
    fragment.appendChild(createProductCard(book));
  });
  productContainer.appendChild(fragment);
}

function createProductCard(book) {
  const productElement = document.createElement("div");
  productElement.className = "product";

  // --- Volume Logic ---
  let volumeHTML = "";
  if (book.so_tap && book.so_tap > 0) {
    const bookTypeName = book.kieu_sach?.ten_kieu_sach;
    const volumeLabel = bookTypeName === "Artbook" ? "Quyển" : "Tập";
    volumeHTML = `<p class="volume">${volumeLabel} ${book.so_tap}</p>`;
  }

  // --- Price Logic ---
  let priceHTML = "";
  const priceValue = parseFloat(book.gia_tien);
  if (!isNaN(priceValue)) {
    priceHTML = `<p class="price">${new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(priceValue)}</p>`;
  }
  // else: Optionally show placeholder like `<p class="price">Liên hệ</p>`

  // --- Image URL ---
  const imageUrl = book.sach_bia_sach?.url_bia_chinh || PLACEHOLDER_IMAGE;
  const imageAlt = book.tieu_de || "Bìa sách";

  // --- Detail Page Link ---
  const detailUrl = `./product.html?id=${book.ma_sach}`; // Ensure correct page name

  productElement.innerHTML = `
        <a href="${detailUrl}" class="product-image-link">
            <img src="${imageUrl}"
                 alt="${imageAlt}"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}'">
        </a>
        <div class="product-info">
            <h3>
               <a href="${detailUrl}" class="product-title-link">
                   ${book.tieu_de || "Không có tiêu đề"}
               </a>
            </h3>
            ${volumeHTML}
            ${priceHTML}
        </div>
    `;
  return productElement;
}

function renderPaginationControls() {
  if (!paginationContainer) return; // Don't proceed if container doesn't exist
  paginationContainer.innerHTML = ""; // Clear existing buttons

  if (totalPages <= 1) return; // No need for pagination if only one page or less

  const fragment = document.createDocumentFragment();

  // Previous Button
  fragment.appendChild(
    createPaginationButton("←", currentPage > 1, () => {
      if (currentPage > 1) {
        currentPage--;
        handlePageChange();
      }
    })
  );

  // Page Number Buttons (Simplified logic for demonstration)
  // You might want more complex logic for ellipsis (...) if many pages
  const maxPagesToShow = 5; // Max number buttons to show (e.g., Prev 1 2 *3* 4 5 Next)
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust startPage if endPage reaches the limit first
  startPage = Math.max(1, endPage - maxPagesToShow + 1);

  // Optional: Ellipsis at the start
  if (startPage > 1) {
    fragment.appendChild(
      createPaginationButton("1", true, () => {
        currentPage = 1;
        handlePageChange();
      })
    );
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "...";
      fragment.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const button = createPaginationButton(i, true, () => {
      currentPage = i;
      handlePageChange();
    });
    if (i === currentPage) {
      button.classList.add("active");
    }
    fragment.appendChild(button);
  }

  // Optional: Ellipsis at the end
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "...";
      fragment.appendChild(ellipsis);
    }
    fragment.appendChild(
      createPaginationButton(totalPages, true, () => {
        currentPage = totalPages;
        handlePageChange();
      })
    );
  }

  // Next Button
  fragment.appendChild(
    createPaginationButton("→", currentPage < totalPages, () => {
      if (currentPage < totalPages) {
        currentPage++;
        handlePageChange();
      }
    })
  );

  paginationContainer.appendChild(fragment);
}

function createPaginationButton(text, enabled, action) {
  const btn = document.createElement("button");
  btn.className = "page-button";
  btn.textContent = text;
  if (enabled) {
    btn.addEventListener("click", action);
  } else {
    btn.classList.add("disabled");
    btn.setAttribute("disabled", true); // Disable semantically
  }
  return btn;
}

// --- Event Handlers ---

function setupEventListeners() {
  // Category Filter Links
  categoryLinks.forEach((link) => {
    link.addEventListener("click", handleCategoryChange);
  });

  // Sort Dropdown
  if (sortDropdown) {
    sortDropdown.addEventListener("change", handleSortChange);
    // Set initial dropdown value based on state (optional)
    // sortDropdown.value = currentSort;
  } else {
    console.warn("Sort dropdown element not found.");
  }

  // Search Input/Button (Redirects to search page)
  if (searchButton && searchInput) {
    searchButton.addEventListener("click", performRedirectSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent potential form submission
        performRedirectSearch();
      }
    });
  } else {
    console.warn("Search input or button not found.");
  }
}

function handleCategoryChange(event) {
  event.preventDefault();
  const newType = event.target.getAttribute("data-type") || "";

  if (newType !== currentTypeFilter) {
    currentTypeFilter = newType;
    currentPage = 1; // Reset to page 1 when filter changes
    processBooks(); // Re-filter, sort, and display books already in memory

    // Update active class on category links
    categoryLinks.forEach((el) => el.classList.remove("active"));
    event.target.classList.add("active");
  }
}

function handleSortChange(event) {
  const newSort = event.target.value;
  if (newSort !== currentSort) {
    currentSort = newSort;
    // Don't reset page number when sorting
    processBooks(); // Re-sort and display books already in memory
  }
}

function handlePageChange() {
  // Called when a pagination button is clicked
  // 1. State (currentPage) is already updated by the button's action
  // 2. Redisplay the content for the new page
  displayCurrentPage();
  // 3. Update the pagination controls to reflect the new active page
  renderPaginationControls();
  // 4. Update the URL
  updateURL();
  // 5. Optional: Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function performRedirectSearch() {
  // This function redirects to a separate search page
  if (!searchInput) return;
  const query = searchInput.value.trim();

  // Redirect even if query is empty (to potentially show all results on search page)
  window.location.href = `search.html?title=${encodeURIComponent(query)}`;

  // Note: The original code fetched results here and stored in sessionStorage.
  // This is only needed if search.html relies on sessionStorage.
  // If search.html fetches its own results based on the URL query,
  // you don't need the fetch/sessionStorage logic here.
  /*
    try {
        const url = query ? `${APP_ENV.SEARCH_URL}?title=${encodeURIComponent(query)}` : APP_ENV.MASTER_URL; // Or handle empty search differently
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        const results = await response.json();
        sessionStorage.setItem("searchResults", JSON.stringify(results)); // Only if search.html needs it
        window.location.href = `search.html?title=${encodeURIComponent(query)}`;
    } catch (error) {
        console.error("Redirect search failed:", error);
        alert("Tìm kiếm thất bại. Vui lòng thử lại."); // User feedback
    }
    */
}

// --- UI State Indicators ---

function showLoadingState(isLoading) {
  if (!productContainer) return;
  if (isLoading) {
    productContainer.innerHTML = '<p class="loading">Đang tải sách...</p>';
    // Optionally disable controls
    if (sortDropdown) sortDropdown.disabled = true;
    categoryLinks.forEach((link) => (link.style.pointerEvents = "none"));
  } else {
    // Content will be replaced by displayCurrentPage or showErrorState
    if (sortDropdown) sortDropdown.disabled = false;
    categoryLinks.forEach((link) => (link.style.pointerEvents = "auto"));
  }
}

function showErrorState(message) {
  if (!productContainer) return;
  productContainer.innerHTML = `<p class="error">${message}</p>`;
  // Clear pagination on error?
  if (paginationContainer) paginationContainer.innerHTML = "";
  if (totalResultsDisplay) totalResultsDisplay.textContent = "0";
}

// --- End of File ---
