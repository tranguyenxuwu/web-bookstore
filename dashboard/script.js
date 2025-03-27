// Khởi tạo dữ liệu mẫu
let books = [
  {
    id: 1,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Mẫu sách 1",
    price: 150000,
    publisher: "NXB Kim Đồng",
    description: "Mô tả sách 1"
  },
  {
    id: 2,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Mẫu sách 2",
    price: 120000,
    publisher: "NXB Trẻ",
    description: "Mô tả sách 2"
  },
  {
    id: 3,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Sách giáo khoa lớp 10",
    price: 80000,
    publisher: "NXB Giáo Dục",
    description: "Sách giáo khoa cho học sinh lớp 10"
  },
  {
    id: 4,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Lập trình Python cơ bản",
    price: 220000,
    publisher: "NXB Thông Tin",
    description: "Sách hướng dẫn lập trình Python từ cơ bản đến nâng cao"
  },
  {
    id: 5,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Đắc Nhân Tâm",
    price: 90000,
    publisher: "NXB Tổng Hợp",
    description: "Cuốn sách nổi tiếng về nghệ thuật đối nhân xử thế"
  }
];

// Thêm hằng số API URL
const API_BASE = "https://api.elysia-app.live/upload";

// Biến cho phân trang
let currentPage = 1;
const itemsPerPage = 5;
let totalPages = Math.ceil(books.length / itemsPerPage);
let currentEditId = null;
let filteredBooks = [...books];

// Hàm khởi tạo
function init() {
  // Khởi tạo biểu đồ
  initChart();
  
  // Hiển thị dashboard
  showDashboard();
  
  // Thiết lập tabs cho form
  setupFormTabs();
  
  // Thêm loading overlay
  document.body.insertAdjacentHTML('beforeend', `
    <div class="loading-overlay">
      <div class="spinner"></div>
    </div>
  `);
}

// Thiết lập xử lý tabs form
function setupFormTabs() {
  document.querySelectorAll('.form-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Bỏ active trên tất cả tabs
      document.querySelectorAll('.form-tabs .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Active tab hiện tại
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// Thiết lập file inputs
function setupFileInputs() {
  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const fieldName = input.dataset.field;
      const fileNameElement = document.getElementById(`${input.id}Name`);
      const previewElement = document.getElementById(`${input.id}Preview`);
      
      // Hiển thị tên file
      fileNameElement.textContent = file.name;
      
      // Hiển thị preview
      const reader = new FileReader();
      reader.onload = function(e) {
        previewElement.src = e.target.result;
        previewElement.style.display = "block";
      };
      reader.readAsDataURL(file);
      
      try {
        showLoading(true);
        const publicUrl = await uploadImage(file);
        document.getElementById(fieldName).value = publicUrl;
        showLoading(false);
      } catch (error) {
        showLoading(false);
        alert(`Lỗi upload ảnh: ${error.message}`);
      }
    });
  });
}

// Upload ảnh lên server
async function uploadImage(file) {
  try {
    // Bước 1: Lấy presigned URL
    const presignedRes = await fetch(`${API_BASE}/presigned`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
      }),
    });

    if (!presignedRes.ok) throw new Error("Lỗi presigned URL");

    const { url, publicUrl } = await presignedRes.json();

    // Bước 2: Upload lên R2
    const uploadRes = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) throw new Error("Upload ảnh thất bại");

    return publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Hàm hiển thị danh sách sách
function renderBooks() {
  const bookList = document.getElementById("bookList");
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIdx, startIdx + itemsPerPage);
  
  bookList.innerHTML = paginatedBooks.map(book => `
    <tr>
      <td><img src="${book.sach_bia_sach?.url_bia_chinh || book.image || 'https://cdn.elysia-app.live/placeholder.jpg'}" width="50" style="border-radius: 4px;" alt="${book.tieu_de || book.title}"></td>
      <td>${book.tieu_de || book.title}</td>
      <td>${(book.gia_tien || book.price || 0).toLocaleString()} ₫</td>
      <td>${book.nha_xuat_ban?.ten_nha_xuat_ban || book.publisher || "Chưa xác định"}</td>
      <td class="book-actions">
        <button class="edit-btn" onclick="editBook(${book.ma_sach || book.id})"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" onclick="deleteBook(${book.ma_sach || book.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
  ).join("");
  
  updatePagination();
}

// Cập nhật phân trang
function updatePagination() {
  totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  
  // Cập nhật nút prev/next
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
  
  // Hiển thị số trang
  const pageNumbers = document.getElementById("pageNumbers");
  pageNumbers.innerHTML = "";
  
  // Xác định phạm vi trang hiển thị
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("div");
    pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentPage = i;
      renderBooks();
    };
    pageNumbers.appendChild(pageBtn);
  }
}

// Chuyển trang
function changePage(direction) {
  const newPage = currentPage + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderBooks();
  }
}

// Hàm lọc sách theo từ khóa
function filterBooks() {
  const searchTerm = document.getElementById("tableSearch").value.toLowerCase();
  
  filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm) || 
    book.publisher.toLowerCase().includes(searchTerm)
  );
  
  currentPage = 1;
  renderBooks();
}

// Hàm sắp xếp sách
function sortBooks(sortType) {
  switch(sortType) {
    case "title-asc":
      filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-desc":
      filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "price-asc":
      filteredBooks.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filteredBooks.sort((a, b) => b.price - a.price);
      break;
  }
  
  renderBooks();
}

// Thêm hàm này trước hàm submitBook
function logFormData() {
  const form = document.getElementById("bookForm");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());
  console.log("Dữ liệu sách:", bookData);
  alert("Dữ liệu sách đã được ghi vào console. Mở DevTools để xem.");
}

// Hàm thêm/cập nhật sách với API
async function submitBook() {
  // Lấy dữ liệu từ form
  const form = document.getElementById("bookForm");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());
  
  // Kiểm tra dữ liệu cơ bản
  if (!bookData.tieu_de || !bookData.gia_tien || !bookData.gioi_thieu) {
    alert("Vui lòng điền đầy đủ thông tin bắt buộc (Tiêu đề, Giá tiền, Giới thiệu)");
    return;
  }
  
  // Đảm bảo các giá trị đều là chuỗi hoặc số nguyên theo đúng yêu cầu API
  // Không chuyển đổi kiểu dữ liệu, để API tự xử lý
  
  try {
    showLoading(true);
    
    // URL đúng của API
    const apiUrl = `${API_BASE}/book`;
    console.log("Gửi dữ liệu đến:", apiUrl);
    console.log("Dữ liệu:", bookData);
    
    // Gọi API để tạo sách
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    
    const result = await response.json();
    console.log("Kết quả từ API:", result);
    
    if (response.ok) {
      // Thêm sách vào danh sách local
      const newBook = {
        id: result.ma_sach || Date.now(),
        title: bookData.tieu_de,
        price: bookData.gia_tien,
        publisher: bookData.ma_nha_xuat_ban,
        description: bookData.gioi_thieu,
        image: bookData.url_bia_chinh || "https://cdn.elysia-app.live/placeholder.jpg"
      };
      
      if (currentEditId !== null) {
        // Cập nhật sách hiện có
        const index = books.findIndex(book => book.id === currentEditId);
        if (index !== -1) {
          books[index] = { ...books[index], ...newBook };
        }
        alert("Cập nhật sách thành công!");
      } else {
        // Thêm sách mới
        books.push(newBook);
        alert("Thêm sách mới thành công!");
      }
      
      // Cập nhật lại danh sách và đóng form
      filteredBooks = [...books];
      renderBooks();
      resetForm();
      closeSidePanel();
    } else {
      alert(`Lỗi: ${result.message || "Không thể tạo sách"}`);
    }
    
    showLoading(false);
  } catch (error) {
    showLoading(false);
    console.error("Error creating book:", error);
    alert(`Lỗi kết nối: ${error.message}`);
  }
}

// Hàm chỉnh sửa sách
function editBook(id) {
  const book = books.find(book => (book.ma_sach || book.id) === id);
  if (!book) return;
  
  // Đặt ID hiện tại đang sửa
  currentEditId = id;
  
  // Cập nhật tiêu đề form
  document.getElementById("formTitle").textContent = "Sửa Thông Tin Sách";
  
  // Điền thông tin vào form
  document.getElementById("title").value = book.tieu_de || book.title || '';
  document.getElementById("price").value = book.gia_tien || book.price || '';
  document.getElementById("description").value = book.gioi_thieu || book.description || '';
  document.getElementById("publisherId").value = book.ma_nha_xuat_ban || book.publisher || '';
  
  // Điền các thông tin khác nếu có
  if (book.tong_so_trang || book.totalPages) document.getElementById("totalPages").value = book.tong_so_trang || book.totalPages;
  if (book.danh_gia || book.rating) document.getElementById("rating").value = book.danh_gia || book.rating;
  if (book.ngay_xuat_ban || book.publishDate) document.getElementById("publishDate").value = book.ngay_xuat_ban || book.publishDate;
  if (book.so_tap || book.volume) document.getElementById("volume").value = book.so_tap || book.volume;
  
  // Cập nhật các URL hình ảnh
  if (book.sach_bia_sach?.url_bia_chinh || book.image) {
    const imageUrl = book.sach_bia_sach?.url_bia_chinh || book.image;
    document.getElementById("url_bia_chinh").value = imageUrl;
    document.getElementById("mainCoverPreview").src = imageUrl;
    document.getElementById("mainCoverPreview").style.display = "block";
  }
  
  if (book.sach_bia_sach?.url_bia_cover) {
    document.getElementById("url_bia_cover").value = book.sach_bia_sach.url_bia_cover;
    document.getElementById("coverImagePreview").src = book.sach_bia_sach.url_bia_cover;
    document.getElementById("coverImagePreview").style.display = "block";
  }
  
  if (book.sach_bia_sach?.url_bia_phu) {
    document.getElementById("url_bia_phu").value = book.sach_bia_sach.url_bia_phu;
    document.getElementById("backCoverPreview").src = book.sach_bia_sach.url_bia_phu;
    document.getElementById("backCoverPreview").style.display = "block";
  }
  
  if (book.sach_bia_sach?.url_bookmark) {
    document.getElementById("url_bookmark").value = book.sach_bia_sach.url_bookmark;
    document.getElementById("bookmarkPreview").src = book.sach_bia_sach.url_bookmark;
    document.getElementById("bookmarkPreview").style.display = "block";
  }
  
  // Mở form
  openSidePanel();
}

// Hàm xóa sách
function deleteBook(id) {
  if (confirm("Bạn có chắc chắn muốn xóa sách này?")) {
    books = books.filter(book => book.id !== id);
    filteredBooks = [...books];
    
    // Cập nhật lại trang hiện tại nếu cần
    if (currentPage > Math.ceil(books.length / itemsPerPage) && currentPage > 1) {
      currentPage--;
    }
    
    renderBooks();
    alert("Đã xóa sách thành công!");
  }
}

// Reset form
function resetForm() {
  document.getElementById("bookForm").reset();
  document.getElementById("formTitle").textContent = "Thêm Sách Mới";
  
  // Reset preview ảnh
  document.querySelectorAll('.image-preview img').forEach(img => {
    img.src = "";
    img.style.display = "none";
  });
  
  // Reset tên file
  document.querySelectorAll('.file-name').forEach(element => {
    element.textContent = "Chưa chọn tệp";
  });
  
  // Reset hidden fields
  document.querySelectorAll('input[type="hidden"]').forEach(input => {
    input.value = "";
  });
  
  currentEditId = null;
  
  // Chuyển về tab đầu tiên
  document.querySelectorAll('.form-tabs .tab')[0].click();
}

// Mở side panel
function openSidePanel() {
  document.getElementById("sidePanel").classList.add("open");
  resetForm();
}

// Đóng side panel
function closeSidePanel() {
  document.getElementById("sidePanel").classList.remove("open");
  resetForm();
}

// Hiển thị trang sách
function showBooks() {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("booksSection").style.display = "block";
  
  // Show loading
  showLoading(true);
  
  // Fetch books from API
  fetch('https://api.elysia-app.live/book/all')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Update books array with data from API
      books = Array.isArray(data) ? data : [];
      filteredBooks = [...books];
      currentPage = 1;
      renderBooks();
      showLoading(false);
    })
    .catch(error => {
      console.error('Error fetching books:', error);
      showLoading(false);
      alert('Không thể tải danh sách sách từ server');
    });
}

// Hiển thị dashboard
function showDashboard() {
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("booksSection").style.display = "none";
}

// Khởi tạo biểu đồ
function initChart() {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [{
        label: 'Doanh thu (triệu VNĐ)',
        data: [65, 59, 80, 81, 56, 55, 72, 68, 85, 90, 92, 100],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'white',
        pointBorderColor: 'rgba(52, 152, 219, 1)',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  // Xử lý nút chuyển đổi loại biểu đồ
  document.querySelectorAll('.chart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      if (this.dataset.type === 'revenue') {
        chart.data.datasets[0].label = 'Doanh thu (triệu VNĐ)';
        chart.data.datasets[0].data = [65, 59, 80, 81, 56, 55, 72, 68, 85, 90, 92, 100];
      } else {
        chart.data.datasets[0].label = 'Số đơn hàng';
        chart.data.datasets[0].data = [32, 29, 40, 36, 28, 30, 35, 40, 42, 45, 48, 50];
      }
      
      chart.update();
    });
  });
}

// Show/hide loading
function showLoading(show) {
  document.querySelector('.loading-overlay').style.display = show ? 'flex' : 'none';
}

// Hàm preview ảnh từ URL
function previewImage(inputId, previewId) {
  const url = document.getElementById(inputId).value;
  const preview = document.getElementById(previewId);
  
  if (!url) {
    alert('Vui lòng nhập URL hình ảnh');
    return;
  }
  
  preview.src = url;
  preview.style.display = 'block';
  
  // Kiểm tra ảnh có tồn tại không
  preview.onerror = function() {
    alert('Không thể tải hình ảnh từ URL này');
    preview.style.display = 'none';
  };
}

// Gọi hàm khởi tạo khi trang được tải
window.onload = init;