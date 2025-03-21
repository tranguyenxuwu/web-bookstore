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

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  if (window.location.pathname.includes('/search/')) {
    displaySearchResults();
  }
});