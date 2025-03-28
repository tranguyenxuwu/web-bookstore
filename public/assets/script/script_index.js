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
      // Calculate percentage based on 100% width per slide
      carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentSlide);
      });
      // Optional: Disable buttons at ends
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

    // Event listeners
    nextBtn.addEventListener("click", nextSlide);
    prevBtn.addEventListener("click", prevSlide);

    // Auto-advance slides every 5 seconds
    let autoSlideInterval = setInterval(nextSlide, 5000);

    // Pause auto-slide on hover (optional)
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
    const scrollAmount = sliderContainer.clientWidth * 0.8; // Scroll ~80% of visible width
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse Drag Scrolling
    sliderContainer.addEventListener("mousedown", (e) => {
      isDown = true;
      sliderContainer.classList.add("active"); // Optional: for styling when dragging
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
      const walk = (x - startX) * 2; // Adjust multiplier for scroll speed
      sliderContainer.scrollLeft = scrollLeft - walk;
      toggleSliderButtons(); // Update button visibility while dragging
    });

    // Button Controls
    sliderNextBtn.addEventListener("click", () => {
      sliderContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });

    sliderPrevBtn.addEventListener("click", () => {
      sliderContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    // Show/hide buttons based on scroll position
    const toggleSliderButtons = () => {
      const maxScrollLeft =
        sliderContainer.scrollWidth - sliderContainer.clientWidth;
      const currentScroll = Math.ceil(sliderContainer.scrollLeft); // Use ceil to handle precision issues

      // Show previous button if not at the beginning
      if (currentScroll > 1) {
        // Use a small threshold
        sliderPrevBtn.style.opacity = "1";
        sliderPrevBtn.style.visibility = "visible";
      } else {
        sliderPrevBtn.style.opacity = "0";
        sliderPrevBtn.style.visibility = "hidden";
      }

      // Show next button if not at the end
      if (currentScroll < maxScrollLeft - 1) {
        // Use a small threshold
        sliderNextBtn.style.opacity = "1";
        sliderNextBtn.style.visibility = "visible";
      } else {
        sliderNextBtn.style.opacity = "0";
        sliderNextBtn.style.visibility = "hidden";
      }
    };

    // Initial check and add listener for scroll events
    sliderContainer.addEventListener("scroll", toggleSliderButtons);
    // Use ResizeObserver for better responsiveness if slider width changes
    new ResizeObserver(toggleSliderButtons).observe(sliderContainer);
    // Initial call
    toggleSliderButtons();

    // Set initial cursor style
    sliderContainer.style.cursor = "grab";
  } else {
    console.warn("Flash sale slider elements not found.");
  }

  // --- Fetch and Display Featured Books ---
  const featuredContainer = document.querySelector(
    ".featured-products-section .products-grid"
  );

  function displayFeaturedBooks(books) {
    if (!featuredContainer) {
      console.error("Featured products container not found.");
      return;
    }
    featuredContainer.innerHTML = ""; // Clear loading message

    if (!books || books.length === 0) {
      featuredContainer.innerHTML =
        '<p class="no-results">Không tìm thấy sách nổi bật nào.</p>';
      return;
    }

    // Determine how many books to show (e.g., first 8)
    const booksToShow = books.slice(0, 8);

    booksToShow.forEach((book) => {
      // Use the placeholder if image is missing or invalid
      const imageUrl =
        book.image && book.image.trim() !== ""
          ? book.image
          : APP_ENV.PLACEHOLDER_IMAGE;

      const productDiv = document.createElement("div");
      productDiv.classList.add("product"); // Class from style_store.css

      // Use the structure expected by style_store.css
      productDiv.innerHTML = `
            <a href="detail/detail.html?id=${book.id}" class="product-link">
                <img src="${imageUrl}" alt="${
        book.title || "Book cover"
      }" loading="lazy" onerror="this.onerror=null; this.src='${
        APP_ENV.PLACEHOLDER_IMAGE
      }';">
                <div class="product-info">
                    <h3>${book.title || "Không có tiêu đề"}</h3>
                    <p class="price">${
                      book.price
                        ? book.price.toLocaleString("vi-VN") + "đ"
                        : "Liên hệ"
                    }</p>
                    <p class="volume">${book.author || "Không rõ tác giả"}</p>
                     ${
                       book.rating
                         ? `<div class="product-rating" style="font-size:13px; margin: 4px 0;">${"★".repeat(
                             Math.round(book.rating)
                           )}${"☆".repeat(5 - Math.round(book.rating))}</div>`
                         : ""
                     }
                </div>
            </a>
        `;
      featuredContainer.appendChild(productDiv);
    });
  }

  async function fetchAndDisplayBooks() {
    if (!featuredContainer) return; // Don't fetch if container doesn't exist

    try {
      const response = await fetch(APP_ENV.MASTER_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Adjust based on the actual structure of your JSON (e.g., data.books, data.data, or just data)
      const books =
        data.data || data.books || (Array.isArray(data) ? data : []);

      if (Array.isArray(books)) {
        displayFeaturedBooks(books);
      } else {
        console.warn("Fetched data is not an array of books:", books);
        featuredContainer.innerHTML =
          '<p class="error-message">Định dạng dữ liệu sách không hợp lệ.</p>';
      }
    } catch (error) {
      console.error("Error fetching featured books:", error);
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
      // Redirect to a dedicated search results page (store.html or a new search.html)
      // Pass the keyword as a query parameter
      window.location.href = `./store.html?search=${encodeURIComponent(
        keyword
      )}`;
    } else {
      // Optional: Provide feedback if the search box is empty
      searchInput.focus();
      // alert("Vui lòng nhập từ khóa tìm kiếm.");
    }
  }

  if (searchInput && searchButton) {
    // Search on Enter key press
    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default form submission if it's inside a form
        performSearch();
      }
    });

    // Search on button click
    searchButton.addEventListener("click", performSearch);
  } else {
    console.warn("Search input or button not found.");
  }
}); // End DOMContentLoaded

// END OF FILE assets/script/script_index.js
