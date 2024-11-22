document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    fetchProductDetails(productId);
    fetchRelatedProducts(productId);
  }

  document.getElementById('add-to-cart').addEventListener('click', () => {
    addToCart(productId);
  });
});

function fetchProductDetails(productId) {
  fetch('../index/product.json')
    .then(response => response.json())
    .then(data => {
      const product = data.data.find(item => item.ma_sach == productId);
      if (product) {
        displayProductDetails(product);
      } else {
        console.error('Product not found');
      }
    })
    .catch(error => console.error('Error fetching product details:', error));
}

function displayProductDetails(product) {
  document.getElementById('product-img').src = product.hinh_anh || 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
  document.getElementById('product-title').textContent = product.tieu_de;
  document.getElementById('product-author').querySelector('span').textContent = product.tac_gias.map(author => author.ten_tac_gia).join(', ');
  document.getElementById('product-publisher').querySelector('span').textContent = product.nha_xuat_ban.ten_nha_xuat_ban;
  document.getElementById('product-price').querySelector('span').textContent = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(product.gia_tien);
  document.getElementById('product-description').querySelector('span').textContent = product.gioi_thieu;
}

function addToCart(productId) {
  // Add product to cart logic here
  alert('Đã thêm vào giỏ hàng!');
}

function fetchRelatedProducts(productId) {
  fetch('../index/related_products.json')
    .then(response => response.json())
    .then(data => {
      const relatedProducts = data.data.filter(item => item.related_to == productId);
      displayRelatedProducts(relatedProducts);
    })
    .catch(error => console.error('Error fetching related products:', error));
}

function displayRelatedProducts(products) {
  const relatedProductsContainer = document.getElementById('related-products');
  relatedProductsContainer.innerHTML = '';
  products.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'related-product';
    productElement.innerHTML = `
      <img src="${product.hinh_anh}" alt="${product.tieu_de}">
      <h3>${product.tieu_de}</h3>
      <p>${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(product.gia_tien)}</p>
    `;
    relatedProductsContainer.appendChild(productElement);
  });
}
