import { APP_ENV } from './env.js';

function displaySearchResults() {
  const results = JSON.parse(sessionStorage.getItem('searchResults'));
  
  if (!results) {
    document.querySelector('.product-container').innerHTML = 
      '<p class="no-results">Không tìm thấy sản phẩm.</p>';
    return;
  }

  filteredBooks = results;
  totalItems = filteredBooks.length;
  totalPages = Math.ceil(totalItems / itemsPerPage);
  currentPage = 1;
  
  document.getElementById('total-results').textContent = totalItems;
  displayPage(filteredBooks);
  updatePagination();
}

// Add this function to fix the error
function setupSearch() {
  const searchForm = document.getElementById('search-form');
  
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput ? searchInput.value.trim() : '';
      
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
  const searchInput = document.querySelector('.search-input');
  const searchTerm = searchInput ? searchInput.value.trim() : '';
  
  if (searchTerm) {
    performSearch(searchTerm);
  }
}

// Helper function to perform the actual search
function performSearch(searchTerm) {
  // This is where you would fetch search results from your API or data source
  // For now, just a placeholder implementation
  fetch(?q=${encodeURIComponent(searchTerm)}`)
    .then(response => response.json())
    .then(results => {
      sessionStorage.setItem('searchResults', JSON.stringify(results));
      window.location.href = '/search/';
    })
    .catch(error => {
      console.error('Search error:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  if (window.location.pathname.includes('/search/')) {
    displaySearchResults();
  }
});