// Đầu file, thêm:
import { APP_ENV } from './env.js';

// Hoặc nếu không dùng ES6 modules, tạo biến APP_ENV trực tiếp:
const APP_ENV = {
  MASTER_URL: './assets/data/books.json',
  LOGO_IMAGE: './assets/image/logo.png',
  PLACEHOLDER_IMAGE: 'https://cdn.elysia-app.live/placeholder.jpg'
};

const carousel = document.querySelector('.carousel');
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentSlide = 0;
const slideCount = slides.length;

function updateCarousel() {
    carousel.style.transform = `translateX(-${currentSlide * 25}%)`;
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
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
nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        updateCarousel();
    });
});

// Auto-advance slides every 5 seconds
setInterval(nextSlide, 5000);

// Function to fetch and display books
async function fetchAndDisplayBooks() {
  try {
    const response = await fetch(APP_ENV.MASTER_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    // Kiểm tra cấu trúc dữ liệu
    const books = data.data || data.books || (Array.isArray(data) ? data : []);
    
    if (books.length === 0) {
      console.warn('No books found in data');
      // Hiển thị thông báo không có sách
      document.querySelector('.featured-products-container').innerHTML = 
        '<p>Không tìm thấy sách nào.</p>';
      return;
    }
    
    // Hiển thị sách
    displayFeaturedBooks(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    // Hiển thị thông báo lỗi
    document.querySelector('.featured-products-container').innerHTML = 
      '<p>Đã xảy ra lỗi khi tải sách. Vui lòng thử lại sau.</p>';
  }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayBooks);

 // slider control
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.product-in-series');
  const prevBtn = document.querySelector('.prev-button');
  const nextBtn = document.querySelector('.next-button');
  
  const scrollAmount = 300;
  let startX, isDown = false;

  // Touch and mouse drag scrolling
  container.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    container.style.cursor = 'grabbing';
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = container.scrollLeft - walk;
  });

  // Button controls
  nextBtn.addEventListener('click', () => {
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });

  prevBtn.addEventListener('click', () => {
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });

  // Show/hide buttons with fade effect
  const toggleButtons = () => {
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth;
    
    prevBtn.style.opacity = isAtStart ? '0' : '1';
    prevBtn.style.visibility = isAtStart ? 'hidden' : 'visible';
    
    nextBtn.style.opacity = isAtEnd ? '0' : '1';
    nextBtn.style.visibility = isAtEnd ? 'hidden' : 'visible';
  };

  container.addEventListener('scroll', toggleButtons);
  window.addEventListener('resize', toggleButtons);
  toggleButtons();
});


// tim kiem

function setupSearch() {
  const searchInput = document.querySelector('.search-input');

  searchInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
      const keyword = encodeURIComponent(searchInput.value.trim());
      
      try {
        const response = await fetch(`http://localhost/api/search?query=${keyword}`);
        const data = await response.json();
        
        // Store search results in sessionStorage
        sessionStorage.setItem('searchResults', JSON.stringify(data));
        
        // Navigate to search page
        window.location.href = `../search/index.html?query=${keyword}`;
      } catch (error) {
        console.error('Error performing search:', error);
      }
    }
  });
}
