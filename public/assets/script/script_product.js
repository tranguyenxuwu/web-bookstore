// === detail_product.js ===

// --- Imports ---
import { APP_ENV } from "./env.js";
// Assuming ApiService has getBookById(id). If not, fetch directly.
import { ApiService } from "./api-service.js";

// --- Constants ---
const PLACEHOLDER_IMAGE =
  APP_ENV.PLACEHOLDER_IMAGE || "./assets/image/placeholder.png"; // Define a default fallback path
const API_BASE_URL = APP_ENV.API_BASE_URL; // Ensure this is defined in env.js, e.g., "https://api.elysia-app.live"

// --- DOM Element References ---
// Use const for elements expected to always exist
const productImg = document.getElementById("product-img");
const productTitle = document.getElementById("product-title");
const productAuthorSpan = document.querySelector("#product-author span");
const productPublisherValue = document.getElementById(
  "product-publisher-value"
);
const productVolumeDisplay = document.getElementById("product-volume-display");
const productTypeDisplay = document.getElementById("product-type-display");
const productTotalPagesValue = document.getElementById(
  "product-total-pages-value"
);
const productPublishDateValue = document.getElementById(
  "product-publish-date-value"
);
const productPriceSpan = document.querySelector("#product-price span"); // Select the span inside #product-price
const productDescriptionSpan = document.querySelector(
  "#product-description span"
); // Select the span inside #product-description
const relatedProductsContainer = document.querySelector(".product-in-series");
const relatedProductsSection = document.querySelector(
  ".related-products-section"
);
const relatedSliderPrevBtn = document.querySelector(
  ".related-products-section .prev-button"
);
const relatedSliderNextBtn = document.querySelector(
  ".related-products-section .next-button"
);
const addToCartBtn = document.getElementById("add-to-cart");
const buyNowBtn = document.getElementById("buy-now");
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const detailsContainer = document.querySelector(".product-details-container"); // For showing "Not Found" errors

// --- Initialization ---
document.addEventListener("DOMContentLoaded", initializeDetailPage);

/**
 * Initializes the product detail page functionalities.
 */
async function initializeDetailPage() {
  // Ensure API Base URL is configured

  const productId = getProductIdFromUrl();

  if (!productId) {
    displayNotFoundMessage("Mã sản phẩm không hợp lệ hoặc bị thiếu trong URL.");
    return;
  }

  // --- Fetch and Display Main Product ---
  let product;
  try {
    console.log(`Fetching details for product ID: ${productId}`);
    // Use ApiService or fetch directly:
    // product = await fetch(`${API_BASE_URL}/book/${productId}`).then(handleResponse);
    product = await ApiService.getBookById(productId); // Assumes this handles errors internally or throws

    if (!product || !product.ma_sach) {
      throw new Error("Dữ liệu sản phẩm không hợp lệ nhận được từ API.");
    }

    console.log("Main product data received:", product);
    displayProductDetails(product); // Display main product info

    // Setup Cart Buttons using the fetched product data
    setupCartButtons(product);

    // --- Fetch and Display Related Products (Books in Series) ---
    const seriesId = product.bo_sach?.ma_bo_sach; // Get series ID
    const currentBookId = product.ma_sach; // Use the fetched product ID

    if (seriesId) {
      console.log(
        `Fetching books in series ID: ${seriesId}, excluding current book ID: ${currentBookId}`
      );
      // Fetch related books, no need to await here unless subsequent logic depends on it immediately
      fetchBooksInSeries(seriesId, currentBookId);
    } else {
      console.log("Product does not belong to a series (missing ma_bo_sach).");
      showNoRelatedBooks("Sản phẩm này không thuộc bộ sách nào."); // Display message in related section
    }
  } catch (error) {
    console.error("Error fetching or processing product details:", error);
    displayNotFoundMessage(
      `Không thể tải thông tin sản phẩm. Lỗi: ${error.message}`
    );
    // Hide related section completely if main product fetch fails
    if (relatedProductsSection) relatedProductsSection.style.display = "none";
  }

  // --- Setup Other UI Elements ---
  setupSearch();
  setupSliderControls(); // Call initially to set button states (likely hidden/disabled)
  setLogoSource(); // Set logo if needed
}

// --- Data Fetching ---

/**
 * Fetches books belonging to a specific series using the dedicated API endpoint.
 * @param {number|string} seriesId - The ID of the series (ma_bo_sach).
 * @param {number|string} currentBookId - The ID of the book currently being viewed (to exclude it).
 */
async function fetchBooksInSeries(seriesId, currentBookId) {
  if (!relatedProductsContainer) {
    console.error("Related products container not found.");
    // Don't show an error here, maybe just log it. Absence of container is an HTML issue.
    return;
  }

  if (!APP_ENV.FETCH_BY_SERIES_URL) {
    console.error(
      "FETCH_BY_SERIES_URL is not defined in env.js. Cannot fetch series data."
    );
    showNoRelatedBooks("Lỗi cấu hình: Không thể tải sách cùng bộ.");
    return;
  }

  const apiUrl = `${APP_ENV.FETCH_BY_SERIES_URL}${seriesId}`;
  showRelatedLoadingState(true); // Show loading indicator

  try {
    console.log(`Calling API: ${apiUrl}`);
    const response = await fetch(apiUrl);
    const seriesBooks = await handleResponse(response); // Use helper for response handling

    console.log(`API response for series ${seriesId}:`, seriesBooks);

    // Validate and filter data
    if (!Array.isArray(seriesBooks)) {
      console.warn(
        `API /book/in-series/${seriesId} did not return an array.`,
        seriesBooks
      );
      throw new Error("Dữ liệu trả về cho sách cùng bộ không hợp lệ.");
    }

    // Filter out the book currently being viewed (use == for potential type mismatch if IDs aren't strictly numbers)
    const relatedBooks = seriesBooks.filter(
      (book) => book.ma_sach != currentBookId
    );

    console.log(
      `Filtered related books (excluding ${currentBookId}):`,
      relatedBooks
    );
    displayRelatedProducts(relatedBooks); // Display the filtered list
  } catch (error) {
    console.error("Error in fetchBooksInSeries:", error);
    // Display specific error message in the related section
    showNoRelatedBooks(
      `Lỗi tải sách cùng bộ: ${error.message || "Vui lòng thử lại."}`
    );
  } finally {
    showRelatedLoadingState(false); // Hide loading indicator regardless of success/failure
    setupSliderControls(); // IMPORTANT: Update slider controls based on the final content (or lack thereof)
  }
}

// --- Display Logic ---

/**
 * Populates the main product detail fields on the page.
 * @param {object} product - The fetched product data object.
 */
function displayProductDetails(product) {
  // Image
  if (productImg) {
    productImg.src = product.sach_bia_sach?.url_bia_chinh || PLACEHOLDER_IMAGE;
    productImg.alt = product.tieu_de || "Bìa sách";
    productImg.onerror = () => {
      productImg.src = PLACEHOLDER_IMAGE;
    }; // Fallback if image fails
  } else {
    console.warn("Element #product-img not found");
  }

  // Title
  if (productTitle) {
    productTitle.textContent = product.tieu_de || "Tiêu đề không có sẵn";
    // Optionally update page title: document.title = product.tieu_de || "Chi tiết sản phẩm";
  } else {
    console.warn("Element #product-title not found");
  }

  // Author
  if (productAuthorSpan) {
    productAuthorSpan.textContent = product.tac_gia?.ten_tac_gia || "Không rõ";
  } else {
    console.warn("Span within #product-author not found");
  }

  // Publisher
  if (productPublisherValue) {
    productPublisherValue.textContent =
      product.nha_xuat_ban?.ten_nha_xuat_ban || "Không rõ";
  } else {
    console.warn("Element #product-publisher-value not found");
  }

  // --- Volume and Type Logic ---
  const bookTypeName = product.kieu_sach?.ten_kieu_sach;
  const volumeNum = product.so_tap;

  // Display Type
  if (productTypeDisplay) {
    if (bookTypeName) {
      productTypeDisplay.textContent = `${bookTypeName}`;
      productTypeDisplay.style.display = "inline-block"; // Show it
    } else {
      productTypeDisplay.textContent = "";
      productTypeDisplay.style.display = "none"; // Hide if no type
    }
  } else {
    console.warn("Element #product-type-display not found");
  }

  // Display Volume (dependent on Type for label)
  if (productVolumeDisplay) {
    if (volumeNum !== null && volumeNum !== undefined && volumeNum > 0) {
      // Determine label based on type
      const volumeLabel = bookTypeName === "Artbook" ? "Quyển" : "Tập"; // Logic here
      productVolumeDisplay.textContent = `${volumeLabel} ${volumeNum}`;
      productVolumeDisplay.style.display = "inline-block"; // Show it
    } else {
      productVolumeDisplay.textContent = "";
      productVolumeDisplay.style.display = "none"; // Hide if no volume
    }
  } else {
    console.warn("Element #product-volume-display not found");
  }
  // --- End Volume and Type Logic ---

  // Total Pages
  if (productTotalPagesValue) {
    const pages = product.tong_so_trang;
    if (pages && !isNaN(pages) && pages > 0) {
      productTotalPagesValue.textContent = `${pages} trang`;
    } else {
      productTotalPagesValue.textContent = "Không rõ";
    }
  } else {
    console.warn("Element #product-total-pages-value not found");
  }

  // Publication Date
  if (productPublishDateValue) {
    if (product.ngay_xuat_ban) {
      try {
        const dateObject = new Date(product.ngay_xuat_ban);
        if (!isNaN(dateObject.getTime())) {
          // Check if date is valid
          productPublishDateValue.textContent = dateObject.toLocaleDateString(
            "vi-VN",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          );
        } else {
          throw new Error("Invalid date string format from API");
        }
      } catch (e) {
        console.warn(
          "Could not parse publication date:",
          product.ngay_xuat_ban,
          e
        );
        productPublishDateValue.textContent = "Không rõ";
      }
    } else {
      productPublishDateValue.textContent = "Không rõ"; // Date is null or empty in API data
    }
  } else {
    console.warn("Element #product-publish-date-value not found");
  }

  // Price
  if (productPriceSpan) {
    const priceValue = parseFloat(product.gia_tien);
    if (!isNaN(priceValue)) {
      // Check if price is a valid number
      productPriceSpan.textContent = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(priceValue);
    } else {
      productPriceSpan.textContent = "Liên hệ"; // Fallback for invalid or missing price
    }
  } else {
    console.warn("Span within #product-price not found");
  }

  // Description
  if (productDescriptionSpan) {
    // Use textContent for security unless HTML is expected and sanitized
    productDescriptionSpan.textContent =
      product.gioi_thieu || "Chưa có giới thiệu cho sản phẩm này.";
    // If newlines (\n) should be <br>:
    // productDescriptionSpan.innerHTML = (product.gioi_thieu || "Chưa có giới thiệu...")
    //                                    .replace(/\n/g, '<br>');
  } else {
    console.warn("Span within #product-description not found");
  }
}

/**
 * Displays related products (books in the same series) in the slider container.
 * @param {Array<object>} products - An array of related book objects.
 */
function displayRelatedProducts(products) {
  if (!relatedProductsContainer || !relatedProductsSection) {
    console.warn(
      "Cannot display related products: container or section element missing."
    );
    return;
  }

  relatedProductsSection.style.display = ""; // Ensure the section is visible

  if (!products || products.length === 0) {
    relatedProductsContainer.innerHTML =
      "<p>Không tìm thấy sách nào khác cùng bộ sách này.</p>";
  } else {
    // Use DocumentFragment for potentially better performance when adding many items
    const fragment = document.createDocumentFragment();
    products.forEach((product) => {
      const card = createRelatedProductCard(product);
      fragment.appendChild(card);
    });
    relatedProductsContainer.innerHTML = ""; // Clear previous content (like loading message)
    relatedProductsContainer.appendChild(fragment);
  }
  // Note: Slider controls are updated by the calling function's finally block
}

/** Creates the HTML element for a single related product card. */
function createRelatedProductCard(product) {
  const div = document.createElement("div");
  div.className = "product-series"; // Use the class defined in CSS

  const priceValue = parseFloat(product.gia_tien);
  const formattedPrice = !isNaN(priceValue)
    ? priceValue.toLocaleString("vi-VN") + "đ"
    : "N/A";
  const imageUrl = product.sach_bia_sach?.url_bia_chinh || PLACEHOLDER_IMAGE;
  const imageAlt = product.tieu_de || "Sách cùng bộ";
  const detailUrl = `product.html?id=${product.ma_sach}`; // Relative path assumption

  // Add book type and volume information
  let typeAndVolumeHTML = "";
  const bookTypeName = product.kieu_sach?.ten_kieu_sach;
  const volumeNum = product.so_tap;

  // Build type display if available
  if (bookTypeName) {
    typeAndVolumeHTML += `<span class="book-type">${bookTypeName}</span>`;
  }

  // Build volume display if available
  if (volumeNum !== null && volumeNum !== undefined && volumeNum > 0) {
    // Determine label based on type (same logic as in displayProductDetails)
    const volumeLabel = bookTypeName === "Artbook" ? "Quyển" : "Tập";
    typeAndVolumeHTML += typeAndVolumeHTML ? "" : ""; // Add separator if type exists
    typeAndVolumeHTML += `<span class="book-volume">${volumeLabel} ${volumeNum}</span>`;
  }

  // Create final type/volume display element if either exists
  const typeVolumeElement = typeAndVolumeHTML
    ? `<p class="type-volume-info">${typeAndVolumeHTML}</p>`
    : "";

  div.innerHTML = `
        <a href="${detailUrl}" title="${imageAlt}">
            <img loading="lazy" alt="${imageAlt}" src="${imageUrl}"
                 onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';">
        </a>
        <div class="product-series-info">
            <a href="${detailUrl}" class="product-series-title-link">
                <h3>${product.tieu_de || "Không có tiêu đề"}</h3>
            </a>
            ${typeVolumeElement}
            <p class="price">${formattedPrice}</p>
        </div>`;
  return div;
}

/**
 * Displays a message when a product is not found or a major error occurs on the page.
 * @param {string} message - The message to display.
 */
function displayNotFoundMessage(
  message = "Sản phẩm bạn tìm kiếm không tồn tại."
) {
  console.error("Displaying Not Found / Error State:", message);
  // Display error in the main product details area
  if (detailsContainer) {
    detailsContainer.innerHTML = `
            <div class="error-message not-found" style="text-align: center; padding: 40px;">
                <h2>Không tìm thấy sản phẩm</h2>
                <p>${message}</p>
                <a href="/" style="display: inline-block; margin-top: 15px; padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Quay lại trang chủ</a>
            </div>`;
  } else {
    // Fallback if main container isn't found
    document.body.innerHTML = `<h2>Lỗi</h2><p>${message}</p><a href="/">Trang chủ</a>`;
  }
  // Also hide the related products section if the main product failed
  if (relatedProductsSection) relatedProductsSection.style.display = "none";
}

/** Helper to display message specifically in related products area */
function showNoRelatedBooks(message) {
  if (relatedProductsContainer && relatedProductsSection) {
    relatedProductsContainer.innerHTML = `<p style="width: 100%; text-align: center; padding: 20px; font-style: italic; color: #666;">${message}</p>`;
    relatedProductsSection.style.display = ""; // Keep section visible to show the message
  }
  // Update controls based on lack of content - called in finally block of fetcher
  // setupSliderControls();
}

/** Helper to show/hide loading state in related products area */
function showRelatedLoadingState(isLoading) {
  if (relatedProductsContainer && relatedProductsSection) {
    if (isLoading) {
      relatedProductsContainer.innerHTML =
        '<p class="loading" style="width: 100%; text-align: center; padding: 20px;">Đang tải sách cùng bộ...</p>';
      relatedProductsSection.style.display = ""; // Ensure section is visible
    }
    // On !isLoading, content will be replaced by displayRelatedProducts or showNoRelatedBooks
  }
}

// --- UI Interactions ---

/** Sets up the Add to Cart and Buy Now buttons */
function setupCartButtons(product) {
  if (addToCartBtn) {
    addToCartBtn.onclick = () => addToCart(product, false);
  } else {
    console.warn("Add to cart button (#add-to-cart) not found");
  }

  if (buyNowBtn) {
    buyNowBtn.onclick = () => addToCart(product, true); // Pass product data directly
  } else {
    console.warn("Buy now button (#buy-now) not found");
  }
}

/**
 * Adds a product to the cart in localStorage.
 * @param {object} product - The product object (must contain necessary fields like ma_sach, tieu_de, gia_tien, sach_bia_sach).
 * @param {boolean} [redirectToCart=false] - Redirect to cart page after adding.
 */
function addToCart(product, redirectToCart = false) {
  if (!product || !product.ma_sach) {
    console.error("Invalid product data provided to addToCart:", product);
    alert("Lỗi: Không thể thêm sản phẩm không hợp lệ vào giỏ hàng.");
    return;
  }

  console.log(
    `Adding to cart: ID=${product.ma_sach}, Title=${product.tieu_de}`
  );

  try {
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItemIndex = cartItems.findIndex(
      (item) => item.id == product.ma_sach
    ); // Use == for flexible comparison

    if (existingItemIndex > -1) {
      // Item exists, increment quantity
      cartItems[existingItemIndex].quantity =
        (cartItems[existingItemIndex].quantity || 1) + 1;
      console.log(`Incremented quantity for item ${product.ma_sach}`);
    } else {
      // Item doesn't exist, add new entry
      cartItems.push({
        id: product.ma_sach, // Use ma_sach as the unique ID
        title: product.tieu_de || "Sản phẩm",
        price: parseFloat(product.gia_tien) || 0, // Ensure price is a number
        quantity: 1,
        imageUrl: product.sach_bia_sach?.url_bia_chinh || PLACEHOLDER_IMAGE, // Get image URL
      });
      console.log(`Added new item ${product.ma_sach} to cart`);
    }

    localStorage.setItem("cart", JSON.stringify(cartItems));
    alert("Đã thêm sản phẩm vào giỏ hàng!"); // Provide user feedback

    if (redirectToCart) {
      console.log("Redirecting to cart page...");
      // Adjust the path to your cart page if necessary (e.g., "../cart/cart.html")
      window.location.href = "./cart/cart.html";
    }
  } catch (error) {
    console.error("Error interacting with localStorage cart:", error);
    alert("Đã xảy ra lỗi khi cập nhật giỏ hàng. Vui lòng thử lại.");
  }
}

/**
 * Sets up the search input and button listeners.
 */
function setupSearch() {
  if (searchButton && searchInput) {
    searchButton.addEventListener("click", performSearchRedirect); // Changed function name for clarity
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent default form submission if inside a form
        performSearchRedirect();
      }
    });
    console.log("Search listeners attached.");
  } else {
    console.warn("Search input or button not found on detail page.");
  }
}

/**
 * Redirects to the search results page with the query.
 */
function performSearchRedirect() {
  if (!searchInput) return;
  const query = searchInput.value.trim();
  console.log(`Redirecting to search page with query: "${query}"`);
  // Adjust path to your search results page if needed (e.g., "../search.html")
  window.location.href = `./search.html?title=${encodeURIComponent(query)}`;
}

/**
 * Sets up slider controls (buttons) for the related products section.
 * Should be called initially and after related products are loaded/updated.
 */
function setupSliderControls() {
  const container = relatedProductsContainer; // The scrollable element
  const prevBtn = relatedSliderPrevBtn;
  const nextBtn = relatedSliderNextBtn;

  // Exit if essential elements aren't found
  if (!container || !prevBtn || !nextBtn) {
    // console.warn("Slider elements missing, cannot initialize controls.");
    if (prevBtn) prevBtn.style.display = "none"; // Ensure buttons are hidden
    if (nextBtn) nextBtn.style.display = "none";
    return;
  }

  const scrollAmount = container.clientWidth * 0.75; // How much to scroll

  // --- Function to Update Button Visibility/State ---
  const updateButtonStates = () => {
    requestAnimationFrame(() => {
      // Schedule update for next frame
      if (!container || !prevBtn || !nextBtn) return; // Double check elements

      const tolerance = 5; // pixels
      const currentScroll = Math.round(container.scrollLeft);
      const maxScroll = Math.round(
        container.scrollWidth - container.clientWidth
      );
      const canScroll = maxScroll > tolerance;

      // Hide buttons if content doesn't overflow
      if (!canScroll) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      }

      // Show buttons if scrolling is possible
      prevBtn.style.display = "";
      nextBtn.style.display = "";

      // Update Previous Button
      const atStart = currentScroll <= tolerance;
      prevBtn.disabled = atStart;
      prevBtn.style.opacity = atStart ? "0.5" : "1";

      // Update Next Button
      const atEnd = currentScroll >= maxScroll - tolerance;
      nextBtn.disabled = atEnd;
      nextBtn.style.opacity = atEnd ? "0.5" : "1";
    });
  };

  // --- Attach Event Handlers ---
  // Button Clicks
  prevBtn.onclick = () => {
    container.scrollTo({
      left: container.scrollLeft - scrollAmount,
      behavior: "smooth",
    });
  };
  nextBtn.onclick = () => {
    container.scrollTo({
      left: container.scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  // Scroll Event on the container itself
  container.removeEventListener("scroll", updateButtonStates); // Prevent duplicate listeners
  container.addEventListener("scroll", updateButtonStates, { passive: true });

  // Resize Event (using ResizeObserver for efficiency)
  if ("ResizeObserver" in window) {
    // Disconnect previous observer if it exists (e.g., if setup runs multiple times)
    if (container._resizeObserver) {
      container._resizeObserver.disconnect();
    }

    const observer = new ResizeObserver(updateButtonStates);
    observer.observe(container);
    container._resizeObserver = observer; // Store reference for potential future cleanup
  } else {
    // Fallback for older browsers
    window.removeEventListener("resize", updateButtonStates); // Prevent duplicate listeners
    window.addEventListener("resize", updateButtonStates);
  }

  // --- Initial State ---
  // Use setTimeout to ensure dimensions are calculated after rendering
  setTimeout(updateButtonStates, 150); // Delay allows layout calculations
  console.log("Slider controls setup complete.");
}

// --- Helper Functions ---

/**
 * Extracts the product ID from the URL query parameters ('id').
 * @returns {string|null} The product ID or null if not found/invalid.
 */
function getProductIdFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    // Basic validation: check if it's not null and maybe if it's a positive number string
    if (id && /^[1-9]\d*$/.test(id)) {
      return id;
    }
    console.warn("Invalid or missing 'id' parameter in URL:", id);
    return null;
  } catch (e) {
    console.error("Error parsing URL parameters:", e);
    return null;
  }
}

/**
 * Handles the response from a fetch call, checking for errors and parsing JSON.
 * @param {Response} response - The Response object from fetch.
 * @returns {Promise<any>} A promise that resolves with the parsed JSON data.
 * @throws {Error} Throws an error if the response is not ok.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      // Try to get more specific error message from API response body
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMsg = errorData.message; // Use API's message
      }
    } catch (e) {
      // Ignore if error response isn't JSON or parsing fails
    }
    console.error(`Fetch failed: ${errorMsg}`);
    throw new Error(errorMsg); // Throw error to be caught by calling function
  }
  return await response.json(); // Parse and return JSON body
}

/** Sets the source for elements with the class 'logo' */
function setLogoSource() {
  const logoElements = document.querySelectorAll(".logo");
  if (APP_ENV.LOGO_IMAGE) {
    logoElements.forEach((logo) => {
      if (logo instanceof HTMLImageElement) {
        logo.src = APP_ENV.LOGO_IMAGE;
      }
    });
    console.log("Logo source set from APP_ENV.");
  } else {
    console.warn("APP_ENV.LOGO_IMAGE is not defined. Logos will use HTML src.");
  }
}

// === End of detail_product.js ===
