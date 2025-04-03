// START OF FILE assets/script/script_index.js

import { APP_ENV } from "./env.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- Set Logo ---
  const logoImg = document.getElementById("site-logo");
  if (logoImg) {
    logoImg.src = APP_ENV.LOGO_IMAGE || "./assets/image/logo.png"; // Fallback just in case
  }

  // --- Carousel Logic ---
  const carousel = document.querySelector(".carousel");
  const slides = document.querySelectorAll(".slide");
  const dotsContainer = document.querySelector(".dots");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");

  if (carousel && slides.length > 0 && dotsContainer && prevBtn && nextBtn) {
    let currentSlide = 0;
    const slideCount = slides.length;

    // Create dots
    dotsContainer.innerHTML = ""; // Clear existing dots if any
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement("button");
      dot.classList.add("dot");
      if (i === 0) dot.classList.add("active");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        currentSlide = i;
        updateCarousel();
      });
      dotsContainer.appendChild(dot);
    }

    const dots = dotsContainer.querySelectorAll(".dot"); // Select newly created dots

    function updateCarousel() {
      carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentSlide);
      });
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide === slideCount - 1;
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slideCount;
      updateCarousel();
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + slideCount) % slideCount;
      updateCarousel();
    }

    nextBtn.addEventListener("click", nextSlide);
    prevBtn.addEventListener("click", prevSlide);
    let autoSlideInterval = setInterval(nextSlide, 5000);
    const carouselContainer = document.querySelector(".carousel-container");
    carouselContainer.addEventListener("mouseenter", () =>
      clearInterval(autoSlideInterval)
    );
    carouselContainer.addEventListener(
      "mouseleave",
      () => (autoSlideInterval = setInterval(nextSlide, 5000))
    );
    updateCarousel(); // Initial setup
  } else {
    console.warn("Carousel elements not found.");
  }

  // --- Flash Sale Slider Logic ---
  const sliderContainer = document.querySelector(".product-in-series");
  const sliderPrevBtn = document.querySelector(".slider-button.prev-button");
  const sliderNextBtn = document.querySelector(".slider-button.next-button");

  if (sliderContainer && sliderPrevBtn && sliderNextBtn) {
    const scrollAmount = sliderContainer.clientWidth * 0.8;
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse Drag Scrolling
    sliderContainer.addEventListener("mousedown", (e) => {
      isDown = true;
      sliderContainer.classList.add("active");
      startX = e.pageX - sliderContainer.offsetLeft;
      scrollLeft = sliderContainer.scrollLeft;
      sliderContainer.style.cursor = "grabbing";
    });
    sliderContainer.addEventListener("mouseleave", () => {
      if (!isDown) return;
      isDown = false;
      sliderContainer.classList.remove("active");
      sliderContainer.style.cursor = "grab";
    });
    sliderContainer.addEventListener("mouseup", () => {
      if (!isDown) return;
      isDown = false;
      sliderContainer.classList.remove("active");
      sliderContainer.style.cursor = "grab";
    });
    sliderContainer.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - sliderContainer.offsetLeft;
      const walk = (x - startX) * 2;
      sliderContainer.scrollLeft = scrollLeft - walk;
      toggleSliderButtons();
    });

    // Button Controls
    sliderNextBtn.addEventListener("click", () => {
      sliderContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
    sliderPrevBtn.addEventListener("click", () => {
      sliderContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    // Show/hide buttons
    const toggleSliderButtons = () => {
      const maxScrollLeft =
        sliderContainer.scrollWidth - sliderContainer.clientWidth;
      const currentScroll = Math.ceil(sliderContainer.scrollLeft);

      sliderPrevBtn.style.opacity = currentScroll > 1 ? "1" : "0";
      sliderPrevBtn.style.visibility = currentScroll > 1 ? "visible" : "hidden";
      sliderNextBtn.style.opacity =
        currentScroll < maxScrollLeft - 1 ? "1" : "0";
      sliderNextBtn.style.visibility =
        currentScroll < maxScrollLeft - 1 ? "visible" : "hidden";
    };

    sliderContainer.addEventListener("scroll", toggleSliderButtons);
    new ResizeObserver(toggleSliderButtons).observe(sliderContainer);
    toggleSliderButtons(); // Initial call
    sliderContainer.style.cursor = "grab";
  } else {
    console.warn("Flash sale slider elements not found.");
  }

  // --- Fetch and Display Featured Books (Sách Nổi Bật) ---
  const featuredContainer = document.querySelector(
    ".featured-products-section .products-grid" // Make sure this selector matches your HTML grid container
  );

  // Function to create a product element with the required format
  function createProductElement(book) {
    const bookId = book.ma_sach;
    const title = book.tieu_de || "Không có tiêu đề";
    const imageUrl =
      book.sach_bia_sach?.url_bia_chinh || APP_ENV.PLACEHOLDER_IMAGE;
    const priceFormatted = book.gia_tien
      ? parseFloat(book.gia_tien).toLocaleString("vi-VN") + "đ"
      : "Liên hệ";
    const authorName = book.tac_gia?.ten_tac_gia || ""; // Get author name if available

    // Variables for the new structure
    const detailUrl = `product.html?id=${bookId}`; // Use product.html as in the original code
    const imageAlt = title;
    const PLACEHOLDER_IMAGE = APP_ENV.PLACEHOLDER_IMAGE;

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

    // Create the root element for the product
    const productElement = document.createElement("div");
    productElement.classList.add("product");

    // Apply the new HTML format
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
                   ${title}
               </a>
            </h3>
            ${volumeHTML}
            ${priceHTML}
        </div>
    `;
    return productElement;
  }

  function displayFeaturedBooks(books) {
    if (!featuredContainer) {
      console.error("Featured products container (.products-grid) not found.");
      return;
    }
    featuredContainer.innerHTML = ""; // Clear loading/previous content

    if (!books || books.length === 0) {
      featuredContainer.innerHTML =
        '<p class="no-results">Không tìm thấy sách trong bộ sách này.</p>';
      return;
    }

    // Determine how many books to show (e.g., first 8 or all)
    const booksToShow = books.slice(0, 8); // Show first 8, adjust as needed

    booksToShow.forEach((book) => {
      const productElement = createProductElement(book);
      featuredContainer.appendChild(productElement);
    });
  }

  async function fetchAndDisplayBooks() {
    if (!featuredContainer) return; // Don't fetch if container doesn't exist

    // Add a loading indicator
    featuredContainer.innerHTML =
      '<p class="loading-message">Đang tải sách...</p>';

    // Updated API URL
    const apiUrl = "https://api.elysia-app.live/book/in-series/3";

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Check if the API returns an object with a 'sach' array inside, or just the array directly
      const books = data.sach || (Array.isArray(data) ? data : []); // Prioritize data.sach

      if (Array.isArray(books)) {
        displayFeaturedBooks(books);
      } else {
        console.warn(
          "Fetched data for series 3 is not an array or doesn't contain a 'sach' array:",
          data
        );
        featuredContainer.innerHTML =
          '<p class="error-message">Định dạng dữ liệu sách không hợp lệ.</p>';
      }
    } catch (error) {
      console.error("Error fetching featured books for series 3:", error);
      featuredContainer.innerHTML =
        '<p class="error-message">Đã xảy ra lỗi khi tải sách. Vui lòng thử lại sau.</p>';
    }
  }

  fetchAndDisplayBooks(); // Call fetch function

  // --- Search Functionality ---
  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".search-button");

  function performSearch() {
    const keyword = searchInput.value.trim();
    if (keyword) {
      window.location.href = `./store.html?search=${encodeURIComponent(
        keyword
      )}`;
    } else {
      searchInput.focus();
    }
  }

  if (searchInput && searchButton) {
    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
      }
    });
    searchButton.addEventListener("click", performSearch);
  } else {
    console.warn("Search input or button not found.");
  }
}); // End DOMContentLoaded

// END OF FILE assets/script/script_index.js
