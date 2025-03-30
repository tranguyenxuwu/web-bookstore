import { APP_ENV } from "../public/assets/script/env.js";

// Khởi tạo dữ liệu mẫu
let books = [
  {
    id: 1,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Mẫu sách 1",
    price: 150000,
    publisher: "NXB Kim Đồng",
    description: "Mô tả sách 1",
  },
  {
    id: 2,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Mẫu sách 2",
    price: 120000,
    publisher: "NXB Trẻ",
    description: "Mô tả sách 2",
  },
  {
    id: 3,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Sách giáo khoa lớp 10",
    price: 80000,
    publisher: "NXB Giáo Dục",
    description: "Sách giáo khoa cho học sinh lớp 10",
  },
  {
    id: 4,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Lập trình Python cơ bản",
    price: 220000,
    publisher: "NXB Thông Tin",
    description: "Sách hướng dẫn lập trình Python từ cơ bản đến nâng cao",
  },
  {
    id: 5,
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Đắc Nhân Tâm",
    price: 90000,
    publisher: "NXB Tổng Hợp",
    description: "Cuốn sách nổi tiếng về nghệ thuật đối nhân xử thế",
  },
];

// Biến cho phân trang
let currentPage = 1;
const itemsPerPage = 5;
let totalPages = Math.ceil(books.length / itemsPerPage);
let currentEditId = null;
let filteredBooks = [...books];
// Thêm các biến mới
let publishers = [];
let authors = []; // Add this line for authors
let series = []; // Add this line for series

// Thiết lập xử lý tabs form
function setupFormTabs() {
  document.querySelectorAll(".form-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Bỏ active trên tất cả tabs
      document
        .querySelectorAll(".form-tabs .tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Active tab hiện tại
      tab.classList.add("active");
      const tabName = tab.dataset.tab;
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });
}
// Hàm khởi tạo
function init() {
  // Khởi tạo biểu đồ
  initChart();

  // Hiển thị dashboard
  showDashboard();

  // Thiết lập tabs cho form
  setupFormTabs();

  // Thiết lập file inputs cho upload ảnh
  setupFileUploads();

  // Fetch publishers, authors, and series
  fetchPublishers();
  fetchAuthors();
  fetchSeries();

  // Thêm loading overlay nếu chưa có
  if (!document.querySelector(".loading-overlay")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="loading-overlay">
          <div class="spinner"></div>
        </div>`
    );
  }
}

// Thiết lập file inputs
function setupFileInputs() {
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fieldName = input.dataset.field;
      const fileNameElement = document.getElementById(`${input.id}Name`);
      const previewElement = document.getElementById(`${input.id}Preview`);

      // Hiển thị tên file
      fileNameElement.textContent = file.name;

      // Hiển thị preview
      const reader = new FileReader();
      reader.onload = function (e) {
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

// Thiết lập sự kiện upload ảnh - cải thiện từ test.html
function setupFileUploads() {
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fieldName = input.dataset.field;
      const statusElement = document.getElementById(
        `status_${fieldName.replace("url_", "")}`
      );
      const previewElement = document.getElementById(
        `${fieldName.replace("url_", "")}Preview`
      );

      // Reset status
      if (statusElement) {
        statusElement.innerHTML = "Đang tải ảnh lên...";
        statusElement.className = "upload-status loading";
      }

      // Hiển thị preview ngay lập tức từ file local
      const reader = new FileReader();
      reader.onload = function (e) {
        if (previewElement) {
          previewElement.src = e.target.result;
          previewElement.style.display = "block";
        }
      };
      reader.readAsDataURL(file);

      try {
        // Hiển thị loading overlay
        showLoading(true);

        // Upload ảnh
        const publicUrl = await uploadImage(file);

        // Cập nhật URL vào trường input
        const inputField = document.getElementById(fieldName);
        if (inputField) {
          inputField.value = publicUrl;
        }

        // Cập nhật status
        if (statusElement) {
          statusElement.innerHTML = "Tải lên thành công!";
          statusElement.className = "upload-status success";
        }

        // Cập nhật preview với URL thật
        if (previewElement) {
          previewElement.src = publicUrl;
        }

        showLoading(false);
      } catch (error) {
        console.error("Upload error:", error);
        if (statusElement) {
          statusElement.innerHTML = `Lỗi: ${
            error.message || "Không thể tải lên"
          }`;
          statusElement.className = "upload-status error";
        }
        showLoading(false);
      }
    });
  });
}

// Xử lý upload ảnh - cải thiện từ test.html
async function uploadImage(file) {
  try {
    console.log("Bắt đầu upload ảnh:", file.name);

    // Bước 1: Lấy presigned URL
    const presignedRes = await fetch(`${APP_ENV.IMAGE_PRESIGNED_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
      }),
    });

    if (!presignedRes.ok) {
      const errorText = await presignedRes.text();
      console.error("Lỗi presigned URL:", errorText);
      throw new Error("Lỗi lấy presigned URL");
    }

    const { url, publicUrl } = await presignedRes.json();
    console.log("Đã nhận presigned URL:", url);

    // Bước 2: Upload lên R2
    const uploadRes = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("Lỗi upload:", errorText);
      throw new Error("Upload ảnh thất bại");
    }

    console.log("Upload thành công:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Chi tiết lỗi upload:", error);
    throw error;
  }
}

// Hàm xử lý NXB
async function fetchPublishers() {
  try {
    const res = await fetch(APP_ENV.PUBLISHER_URL);
    publishers = await res.json();
    updatePublisherDropdown();
  } catch (error) {
    console.error("Lỗi tải NXB:", error);
    alert("Không thể tải danh sách NXB");
  }
}

// Function to fetch authors
async function fetchAuthors() {
  try {
    const res = await fetch(APP_ENV.AUTHOR_URL);
    authors = await res.json();
    updateAuthorDropdown();
  } catch (error) {
    console.error("Lỗi tải tác giả:", error);
    alert("Không thể tải danh sách tác giả");
  }
}

// Function to fetch series
async function fetchSeries() {
  try {
    const res = await fetch(APP_ENV.FETCH_BY_SERIES_URL);
    series = await res.json();
    updateSeriesDropdown();
  } catch (error) {
    console.error("Lỗi tải bộ sách:", error);
    alert("Không thể tải danh sách bộ sách");
  }
}

function updatePublisherDropdown() {
  const select = document.getElementById("publisherId");
  select.innerHTML = '<option value="">Chọn NXB</option>';
  publishers.forEach((pub) => {
    select.innerHTML += `<option value="${pub.ma_nha_xuat_ban}">${pub.ten_nha_xuat_ban}</option>`;
  });
}

function updateAuthorDropdown() {
  const select = document.getElementById("authorId");
  if (select) {
    select.innerHTML = '<option value="">Chọn tác giả</option>';
    authors.forEach((author) => {
      select.innerHTML += `<option value="${author.ma_tac_gia}">${author.ten_tac_gia}</option>`;
    });
  }
}

function updateSeriesDropdown() {
  const select = document.getElementById("seriesId");
  if (select) {
    select.innerHTML = '<option value="">Chọn bộ sách</option>';
    series.forEach((s) => {
      select.innerHTML += `<option value="${s.ma_bo_sach}">${s.ten_bo_sach}</option>`;
    });
  }
}

// Hàm xử lý modal NXB
function showPublisherForm() {
  document.getElementById("newPublisherName").value = "";
  document.getElementById("publisherModal").style.display = "block";
}

// Function to show author form modal
function showAuthorForm() {
  document.getElementById("newAuthorName").value = "";
  document.getElementById("authorModal").style.display = "block";
}

// Function to show series form modal
function showSeriesForm() {
  document.getElementById("newSeriesName").value = "";
  document.getElementById("seriesModal").style.display = "block";
}

function closePublisherModal() {
  document.getElementById("publisherModal").style.display = "none";
}

// Function to close author modal
function closeAuthorModal() {
  document.getElementById("authorModal").style.display = "none";
}

// Function to close series modal
function closeSeriesModal() {
  document.getElementById("seriesModal").style.display = "none";
}

async function addNewPublisher() {
  const name = document.getElementById("newPublisherName").value.trim();
  if (!name) return alert("Vui lòng nhập tên NXB");

  try {
    showLoading(true);
    const res = await fetch(APP_ENV.UPLOAD_PUBLISHER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ten_nha_xuat_ban: name }),
    });

    if (!res.ok) throw new Error(await res.text());

    await fetchPublishers();
    closePublisherModal();
    alert("Thêm NXB thành công!");
  } catch (error) {
    alert("Lỗi thêm NXB: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Function to add a new author
async function addNewAuthor() {
  const name = document.getElementById("newAuthorName").value.trim();
  if (!name) return alert("Vui lòng nhập tên tác giả");

  try {
    showLoading(true);
    const res = await fetch(APP_ENV.UPLOAD_AUTHOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ten_tac_gia: name }),
    });

    if (!res.ok) throw new Error(await res.text());

    await fetchAuthors();
    closeAuthorModal();
    alert("Thêm tác giả thành công!");
  } catch (error) {
    alert("Lỗi thêm tác giả: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Function to add a new series
async function addNewSeries() {
  const name = document.getElementById("newSeriesName").value.trim();
  if (!name) return alert("Vui lòng nhập tên bộ sách");

  try {
    showLoading(true);
    const res = await fetch(APP_ENV.UPLOAD_SERIES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ten_bo_sach: name }),
    });

    if (!res.ok) throw new Error(await res.text());

    await fetchSeries();
    closeSeriesModal();
    alert("Thêm bộ sách thành công!");
  } catch (error) {
    alert("Lỗi thêm bộ sách: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Hàm hiển thị danh sách sách
function renderBooks() {
  const bookList = document.getElementById("bookList");
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIdx, startIdx + itemsPerPage);

  bookList.innerHTML = paginatedBooks
    .map(
      (book) => `
    <tr>
      <td><img src="${
        book.sach_bia_sach?.url_bia_chinh ||
        book.image ||
        "https://cdn.elysia-app.live/placeholder.jpg"
      }" width="50" style="border-radius: 4px;" alt="${
        book.tieu_de || book.title
      }"></td>
      <td>${book.tieu_de || book.title}</td>
      <td>${(book.gia_tien || book.price || 0).toLocaleString()} ₫</td>
      <td>${
        book.nha_xuat_ban?.ten_nha_xuat_ban || book.publisher || "Chưa xác định"
      }</td>
      <td class="book-actions">
        <button class="edit-btn" onclick="editBook(${
          book.ma_sach || book.id
        })"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" onclick="deleteBook(${
          book.ma_sach || book.id
        })"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
    )
    .join("");

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

  filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm) ||
      book.publisher.toLowerCase().includes(searchTerm)
  );

  currentPage = 1;
  renderBooks();
}

// Hàm sắp xếp sách
function sortBooks(sortType) {
  switch (sortType) {
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
  try {
    // Lấy dữ liệu từ form
    const form = document.getElementById("bookForm");
    const formData = new FormData(form);

    // Tạo đối tượng dữ liệu theo đúng format yêu cầu
    const bookData = {
      tieu_de: formData.get("tieu_de") || "",
      gia_tien: formData.get("gia_tien") || "",
      gioi_thieu: formData.get("gioi_thieu") || "",
      tong_so_trang: parseInt(formData.get("tong_so_trang") || "0") || 1,
      danh_gia: formData.get("danh_gia") || "",
      ngay_xuat_ban: formData.get("ngay_xuat_ban") || "",
      ma_nha_xuat_ban: parseInt(formData.get("ma_nha_xuat_ban") || "0") || 1,
      ma_bo_sach: parseInt(formData.get("ma_bo_sach") || "0") || 1,
      ma_tac_gia: parseInt(formData.get("ma_tac_gia") || "0") || 1,
      ma_kieu_sach: parseInt(formData.get("ma_kieu_sach") || "0") || 1,
      so_tap: parseFloat(formData.get("so_tap") || "0") || 1,
      url_bia_chinh: formData.get("url_bia_chinh") || "",
      url_bia_cover: formData.get("url_bia_cover") || "",
      url_bia_phu: formData.get("url_bia_phu") || "",
      url_bookmark: formData.get("url_bookmark") || "",
    };

    // Kiểm tra dữ liệu cơ bản
    if (!bookData.tieu_de || !bookData.gia_tien || !bookData.gioi_thieu) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc (Tiêu đề, Giá tiền, Giới thiệu)"
      );
      return;
    }

    // Log ra để debug
    console.log("Dữ liệu sách gửi đi:", bookData);

    showLoading(true);

    // Gọi API để tạo sách - giữ nguyên endpoint từ APP_ENV nhưng đảm bảo đúng format của dữ liệu
    const response = await fetch(APP_ENV.UPLOAD_BOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });

    const result = await response.json();
    showLoading(false);

    if (response.ok) {
      // Thêm sách vào danh sách local
      const newBook = {
        id: result.ma_sach || Date.now(),
        title: bookData.tieu_de,
        price: bookData.gia_tien,
        publisher: bookData.ma_nha_xuat_ban
          ? bookData.ma_nha_xuat_ban.toString()
          : "",
        description: bookData.gioi_thieu,
        image:
          bookData.url_bia_chinh ||
          "https://cdn.elysia-app.live/placeholder.jpg",
      };

      if (currentEditId !== null) {
        // Cập nhật sách hiện có
        const index = books.findIndex((book) => book.id === currentEditId);
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
  } catch (error) {
    showLoading(false);
    console.error("Error creating book:", error);
    alert(`Lỗi kết nối: ${error.message}`);
  }
}

// Hàm chỉnh sửa sách
function editBook(id) {
  const book = books.find((book) => (book.ma_sach || book.id) === id);
  if (!book) return;

  // Đặt ID hiện tại đang sửa
  currentEditId = id;

  // Cập nhật tiêu đề form
  document.getElementById("formTitle").textContent = "Sửa Thông Tin Sách";

  // Điền thông tin vào form
  document.getElementById("title").value = book.tieu_de || book.title || "";
  document.getElementById("price").value = book.gia_tien || book.price || "";
  document.getElementById("description").value =
    book.gioi_thieu || book.description || "";
  document.getElementById("publisherId").value =
    book.ma_nha_xuat_ban || book.publisher || "";

  // Điền các thông tin khác nếu có
  if (book.tong_so_trang || book.totalPages)
    document.getElementById("totalPages").value =
      book.tong_so_trang || book.totalPages;
  if (book.danh_gia || book.rating)
    document.getElementById("rating").value = book.danh_gia || book.rating;
  if (book.ngay_xuat_ban || book.publishDate)
    document.getElementById("publishDate").value =
      book.ngay_xuat_ban || book.publishDate;
  if (book.so_tap || book.volume)
    document.getElementById("volume").value = book.so_tap || book.volume;

  // Cập nhật các URL hình ảnh
  if (book.sach_bia_sach?.url_bia_chinh || book.image) {
    const imageUrl = book.sach_bia_sach?.url_bia_chinh || book.image;
    document.getElementById("url_bia_chinh").value = imageUrl;
    document.getElementById("mainCoverPreview").src = imageUrl;
    document.getElementById("mainCoverPreview").style.display = "block";
  }

  if (book.sach_bia_sach?.url_bia_cover) {
    document.getElementById("url_bia_cover").value =
      book.sach_bia_sach.url_bia_cover;
    document.getElementById("coverImagePreview").src =
      book.sach_bia_sach.url_bia_cover;
    document.getElementById("coverImagePreview").style.display = "block";
  }

  if (book.sach_bia_sach?.url_bia_phu) {
    document.getElementById("url_bia_phu").value =
      book.sach_bia_sach.url_bia_phu;
    document.getElementById("backCoverPreview").src =
      book.sach_bia_sach.url_bia_phu;
    document.getElementById("backCoverPreview").style.display = "block";
  }

  if (book.sach_bia_sach?.url_bookmark) {
    document.getElementById("url_bookmark").value =
      book.sach_bia_sach.url_bookmark;
    document.getElementById("bookmarkPreview").src =
      book.sach_bia_sach.url_bookmark;
    document.getElementById("bookmarkPreview").style.display = "block";
  }

  // Mở form
  openSidePanel();
}

// Hàm xóa sách
async function deleteBook(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa sách này?")) return;

  try {
    showLoading(true);
    const res = await fetch(`${APP_ENV.DELETE_BOOK_URL}${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error(await res.text());

    books = books.filter((book) => book.id !== id);
    filteredBooks = [...books];
    renderBooks();
    alert("Đã xóa sách thành công!");
  } catch (error) {
    alert("Lỗi xóa sách: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Reset form
function resetForm() {
  document.getElementById("bookForm").reset();
  document.getElementById("formTitle").textContent = "Thêm Sách Mới";

  // Reset preview ảnh
  document.querySelectorAll(".image-preview img").forEach((img) => {
    img.src = "";
    img.style.display = "none";
  });

  // Reset tên file
  document.querySelectorAll(".file-name").forEach((element) => {
    element.textContent = "Chưa chọn tệp";
  });

  // Reset hidden fields
  document.querySelectorAll('input[type="hidden"]').forEach((input) => {
    input.value = "";
  });

  currentEditId = null;

  // Chuyển về tab đầu tiên
  document.querySelectorAll(".form-tabs .tab")[0].click();
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
  fetch(APP_ENV.MASTER_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Update books array with data from API
      books = Array.isArray(data) ? data : [];
      filteredBooks = [...books];
      currentPage = 1;
      renderBooks();
      showLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching books:", error);
      showLoading(false);
      alert("Không thể tải danh sách sách từ server");
    });
}

// Hiển thị dashboard
function showDashboard() {
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("booksSection").style.display = "none";
}

// Khởi tạo biểu đồ
function initChart() {
  const ctx = document.getElementById("revenueChart").getContext("2d");

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ],
      datasets: [
        {
          label: "Doanh thu (triệu VNĐ)",
          data: [65, 59, 80, 81, 56, 55, 72, 68, 85, 90, 92, 100],
          backgroundColor: "rgba(52, 152, 219, 0.2)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: "white",
          pointBorderColor: "rgba(52, 152, 219, 1)",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  // Xử lý nút chuyển đổi loại biểu đồ
  document.querySelectorAll(".chart-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".chart-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      if (this.dataset.type === "revenue") {
        chart.data.datasets[0].label = "Doanh thu (triệu VNĐ)";
        chart.data.datasets[0].data = [
          65, 59, 80, 81, 56, 55, 72, 68, 85, 90, 92, 100,
        ];
      } else {
        chart.data.datasets[0].label = "Số đơn hàng";
        chart.data.datasets[0].data = [
          32, 29, 40, 36, 28, 30, 35, 40, 42, 45, 48, 50,
        ];
      }

      chart.update();
    });
  });
}

// Show/hide loading
function showLoading(show) {
  document.querySelector(".loading-overlay").style.display = show
    ? "flex"
    : "none";
}

// Hàm xem trước ảnh từ URL
function previewImage(inputId, previewId) {
  const url = document.getElementById(inputId).value;
  const preview = document.getElementById(previewId);

  if (!url) {
    alert("Vui lòng nhập URL hình ảnh");
    return;
  }

  if (preview) {
    preview.src = url;
    preview.style.display = "block";

    // Kiểm tra ảnh có tồn tại không
    preview.onerror = function () {
      alert("Không thể tải hình ảnh từ URL này");
      preview.style.display = "none";
    };
  } else {
    console.error(`Element with id ${previewId} not found`);
    alert("Không thể hiển thị preview, vui lòng kiểm tra lại ID");
  }
}

// --- Inline Add Form Functions ---

/**
 * Toggles the visibility of the inline add form for a specific type.
 * @param {'publisher' | 'author' | 'series'} type - The type of item to add (publisher, author, series).
 */
function toggleInlineAdd(type) {
  // Construct the ID of the inline form div based on the type
  const formId = `inlineAdd${type.charAt(0).toUpperCase() + type.slice(1)}`; // e.g., inlineAddPublisher
  const formElement = document.getElementById(formId);

  if (formElement) {
    // Check current display state and toggle
    if (
      formElement.style.display === "none" ||
      formElement.style.display === ""
    ) {
      formElement.style.display = "flex"; // Use 'flex' as defined in the CSS

      // Optional: Focus the input field when showing
      const inputId = `newInline${
        type.charAt(0).toUpperCase() + type.slice(1)
      }Name`; // e.g., newInlinePublisherName
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.focus();
        inputElement.value = ""; // Clear previous input on show
      }
      // Optional: Clear status message
      const statusElement = formElement.querySelector(".inline-add-status");
      if (statusElement) {
        statusElement.textContent = "";
        statusElement.className = "inline-add-status"; // Reset class
      }
    } else {
      formElement.style.display = "none";
      // Optional: Clear input and status when hiding
      const inputId = `newInline${
        type.charAt(0).toUpperCase() + type.slice(1)
      }Name`;
      const inputElement = document.getElementById(inputId);
      if (inputElement) inputElement.value = "";
      const statusElement = formElement.querySelector(".inline-add-status");
      if (statusElement) statusElement.textContent = "";
    }
  } else {
    console.error(`Inline add form element with ID "${formId}" not found.`);
  }
}

// --- Make functions globally accessible if using modules ---
// If your main script is a module (`type="module"`), onclick handlers in HTML
// cannot directly access functions defined inside the module scope.
// You need to explicitly attach them to the window object.
window.toggleInlineAdd = toggleInlineAdd;

// You'll also need to expose other functions called by onclick handlers:
// window.saveInlineItem = saveInlineItem; // Define this function if you haven't already
// window.showDashboard = showDashboard;
// window.showBooks = showBooks;
// window.openSidePanel = openSidePanel;
// window.closeSidePanel = closeSidePanel;
// window.submitBook = submitBook;
// window.filterBooks = filterBooks;
// window.sortBooks = sortBooks;
// window.changePage = changePage;
// window.editBook = editBook;
// window.confirmDeleteBook = confirmDeleteBook;
// window.previewImage = previewImage;
// ... and any others used directly in HTML onclick attributes.

// NOTE: Define the saveInlineItem function as well, as it's called by the save button's onclick.
// Example structure (implement the actual saving logic):
async function saveInlineItem(type) {
  const inputId = `newInline${
    type.charAt(0).toUpperCase() + type.slice(1)
  }Name`;
  const formId = `inlineAdd${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const inputElement = document.getElementById(inputId);
  const formElement = document.getElementById(formId);
  const statusElement = formElement?.querySelector(".inline-add-status");
  const name = inputElement?.value.trim();

  if (!name) {
    if (statusElement) {
      statusElement.textContent = "Tên không được để trống!";
      statusElement.className = "inline-add-status error";
    }
    inputElement?.focus();
    return;
  }

  if (statusElement) {
    statusElement.textContent = "Đang lưu...";
    statusElement.className = "inline-add-status";
  }

  try {
    let newItem;
    // Replace with your actual API calls from api.js
    if (type === "publisher") {
      // newItem = await addPublisher({ ten_nha_xuat_ban: name }); // Example call
      console.log(`Simulating adding publisher: ${name}`); // Placeholder
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      newItem = { id: Date.now(), ten_nha_xuat_ban: name }; // Simulate response
      await loadPublishers(newItem.id); // Reload and select the new item
    } else if (type === "author") {
      // newItem = await addAuthor({ ten_tac_gia: name }); // Example call
      console.log(`Simulating adding author: ${name}`); // Placeholder
      await new Promise((resolve) => setTimeout(resolve, 500));
      newItem = { id: Date.now(), ten_tac_gia: name }; // Simulate response
      await loadAuthors(newItem.id); // Reload and select
    } else if (type === "series") {
      // newItem = await addSeries({ ten_bo_sach: name }); // Example call
      console.log(`Simulating adding series: ${name}`); // Placeholder
      await new Promise((resolve) => setTimeout(resolve, 500));
      newItem = { id: Date.now(), ten_bo_sach: name }; // Simulate response
      await loadSeries(newItem.id); // Reload and select
    }

    if (statusElement) {
      statusElement.textContent = "Đã lưu!";
      statusElement.className = "inline-add-status success";
    }
    // Hide the form after a short delay
    setTimeout(() => {
      toggleInlineAdd(type); // Hide the form
    }, 1000);
  } catch (error) {
    console.error(`Error adding ${type}:`, error);
    if (statusElement) {
      statusElement.textContent = "Lỗi khi lưu!";
      statusElement.className = "inline-add-status error";
    }
  }
}

// Make saveInlineItem globally accessible
window.saveInlineItem = saveInlineItem;

// Make sure loadPublishers, loadAuthors, loadSeries are defined and accessible
// Example placeholder definitions if they are not in the current scope
async function loadPublishers(id) {
  console.log(`Load publishers, select: ${id}`);
}
async function loadAuthors(id) {
  console.log(`Load authors, select: ${id}`);
}
async function loadSeries(id) {
  console.log(`Load series, select: ${id}`);
}
window.loadPublishers = loadPublishers; // Expose if needed elsewhere too
window.loadAuthors = loadAuthors;
window.loadSeries = loadSeries;

// Gọi hàm khởi tạo khi trang được tải
window.onload = init;

// Make functions globally available
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
// Add any other functions used in HTML here
window.showBooks = showBooks;
window.showDashboard = showDashboard;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.filterBooks = filterBooks;
window.sortBooks = sortBooks;
window.submitBook = submitBook;
window.changePage = changePage;
window.showPublisherForm = showPublisherForm;
window.closePublisherModal = closePublisherModal;
window.addNewPublisher = addNewPublisher;
window.previewImage = previewImage; // Make previewImage function available globally
// Add the new global functions
window.showAuthorForm = showAuthorForm;
window.closeAuthorModal = closeAuthorModal;
window.addNewAuthor = addNewAuthor;
window.showSeriesForm = showSeriesForm;
window.closeSeriesModal = closeSeriesModal;
window.addNewSeries = addNewSeries;
