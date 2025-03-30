// --- START OF FILE script.js ---

import { APP_ENV } from "../public/assets/script/env.js";

// --- Global State ---
let books = []; // Holds the master list fetched from API
let publishers = [];
let authors = [];
let series = [];
let filteredBooks = []; // Holds the currently displayed/filtered list
let currentPage = 1;
const itemsPerPage = 10; // Or your preferred number
let totalPages = 0;
let currentEditId = null; // Holds the ma_sach of the book being edited, or null for new book

// --- DOM Element References ---
const loadingOverlay = document.querySelector(".loading-overlay");
const bookListTableBody = document.getElementById("bookList");
const sidePanel = document.getElementById("sidePanel");
const bookForm = document.getElementById("bookForm");
const formTitle = document.getElementById("formTitle");
const publisherSelect = document.getElementById("publisherId");
const authorSelect = document.getElementById("authorId");
const seriesSelect = document.getElementById("seriesId");
const paginationNumbers = document.getElementById("pageNumbers");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const searchInput = document.getElementById("tableSearch");
// Add other specific form input references if needed frequently

// --- Helper Functions ---

function showLoading(show) {
  // Ensure overlay exists or create it lazily
  let overlay = document.querySelector(".loading-overlay");
  if (!overlay) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="loading-overlay" style="display: none;">
              <div class="spinner"></div>
            </div>`
    );
    overlay = document.querySelector(".loading-overlay");
  }
  if (overlay) overlay.style.display = show ? "flex" : "none";
}

// Parses string to Int, returns null if invalid/empty
function parseOptionalInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

// Parses string to Float, returns null if invalid/empty
function parseOptionalFloat(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

// Formats a number or numeric string as Vietnamese currency
function formatCurrency(value) {
  const number = parseFloat(value); // Handle string input like "120000.00"
  if (isNaN(number)) return "N/A";
  return number.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

// Sets image input URL and preview element safely
function setImageField(inputId, previewId, url) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const status = document.getElementById(
    `status_${inputId.replace("url_", "")}`
  );

  if (input) input.value = url || ""; // Set URL or empty string

  if (preview) {
    if (url) {
      preview.src = url;
      preview.style.display = "block";
      preview.onerror = () => {
        preview.style.display = "none";
        preview.src = "";
      }; // Hide on error
    } else {
      preview.src = "";
      preview.style.display = "none";
    }
  }
  // Clear upload status when setting existing image
  if (status) {
    status.textContent = "";
    status.className = "upload-status";
  }
}

// --- Initialization ---

function init() {
  initChart();
  showDashboard(); // Show dashboard first
  setupFormTabs();
  setupFileUploads();

  // Fetch related data for dropdowns
  fetchPublishers();
  fetchAuthors();
  fetchSeries();
}

// --- Chart (Keep existing implementation) ---
function initChart() {
  const ctx = document.getElementById("revenueChart")?.getContext("2d");
  if (!ctx) {
    console.warn("Revenue chart canvas not found");
    return;
  }
  // ... (Rest of chart initialization code from previous versions) ...
  const chart = new Chart(ctx, {
    /* ... chart config ... */
  });
  // ... (chart button listeners) ...
}

// --- Form Tabs and File Upload Setup (Keep existing) ---
function setupFormTabs() {
  document.querySelectorAll(".form-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".form-tabs .tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      const tabName = tab.dataset.tab;
      const contentTab = document.getElementById(`${tabName}-tab`);
      if (contentTab) contentTab.classList.add("active");
    });
  });
  // Activate first tab initially
  document.querySelector(".form-tabs .tab")?.click();
}

function setupFileUploads() {
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fieldName = input.dataset.field; // e.g., "url_bia_chinh"
      const statusElementId = `status_${fieldName.replace("url_", "")}`;
      const previewElementId = `${fieldName.replace("url_", "")}Preview`;
      const statusElement = document.getElementById(statusElementId);
      const previewElement = document.getElementById(previewElementId);
      const inputField = document.getElementById(fieldName); // Text input for URL

      if (statusElement) {
        statusElement.innerHTML = "Đang tải ảnh lên...";
        statusElement.className = "upload-status loading";
      }
      if (inputField) inputField.value = ""; // Clear URL on new file select

      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewElement) {
          previewElement.src = event.target.result;
          previewElement.style.display = "block";
        }
      };
      reader.readAsDataURL(file);

      try {
        showLoading(true);
        const publicUrl = await uploadImage(file);
        if (inputField) inputField.value = publicUrl;
        if (statusElement) {
          statusElement.innerHTML = "Tải lên thành công!";
          statusElement.className = "upload-status success";
        }
      } catch (error) {
        console.error("Upload error:", error);
        if (statusElement) {
          statusElement.innerHTML = `Lỗi: ${
            error.message || "Không thể tải lên"
          }`;
          statusElement.className = "upload-status error";
        }
      } finally {
        showLoading(false);
      }
    });
  });
}

// Upload image function (Keep existing)
async function uploadImage(file) {
  const presignedUrlEndpoint = APP_ENV.IMAGE_PRESIGNED_URL; // Get URL once
  console.log(`Attempting to get presigned URL from: ${presignedUrlEndpoint}`);
  console.log(`Requesting for file: ${file.name}, type: ${file.type}`);

  try {
    // Step 1: Get presigned URL
    const presignedRes = await fetch(presignedUrlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any required Authorization headers here if needed, e.g.:
        // 'Authorization': `Bearer ${your_auth_token}`
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
      }),
    });

    // Log status immediately for debugging
    console.log(
      `Presigned URL fetch status: ${presignedRes.status} ${presignedRes.statusText}`
    );

    if (!presignedRes.ok) {
      let errorBody = "Could not read error response body.";
      try {
        // Attempt to read the response body for more detailed errors
        errorBody = await presignedRes.text();
      } catch (readError) {
        console.error("Error reading the error response body:", readError);
      }
      // Log detailed error before throwing
      console.error(
        `Failed to get presigned URL. Status: ${presignedRes.status}. Response:`,
        errorBody
      );
      // Throw a more informative error
      throw new Error(`Lỗi lấy presigned URL (Status: ${presignedRes.status})`);
    }

    // If fetch was okay, proceed to parse JSON
    const { url, publicUrl } = await presignedRes.json();
    console.log("Successfully got presigned URL:", url);
    console.log("Public URL:", publicUrl);

    // Step 2: Upload lên R2 using the obtained presigned URL
    console.log(`Uploading to presigned URL: ${url}`);
    const uploadRes = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type, // Crucial for R2/S3 presigned PUT
      },
    });

    console.log(
      `Upload to R2 status: ${uploadRes.status} ${uploadRes.statusText}`
    );

    if (!uploadRes.ok) {
      let uploadErrorBody = "Could not read upload error response body.";
      try {
        uploadErrorBody = await uploadRes.text();
      } catch (readError) {
        console.error(
          "Error reading the upload error response body:",
          readError
        );
      }
      console.error(
        `Upload to R2 failed. Status: ${uploadRes.status}. Response:`,
        uploadErrorBody
      );
      throw new Error(`Upload ảnh thất bại (Status: ${uploadRes.status})`);
    }

    console.log("Upload thành công, public URL:", publicUrl);
    return publicUrl; // Return the public URL on success
  } catch (error) {
    // Catches errors from either fetch call or JSON parsing
    console.error("Chi tiết lỗi trong quá trình upload:", error);
    // Re-throw the error so the calling function knows something went wrong
    throw error;
  }
}

// --- Fetching and Updating Related Data Dropdowns ---

async function fetchPublishers(selectId = null) {
  try {
    const res = await fetch(APP_ENV.PUBLISHER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    publishers = await res.json(); // Expects array like [{ma_nha_xuat_ban: 1, ten_nha_xuat_ban: '...'}, ...]
    updatePublisherDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải NXB:", error);
    if (publisherSelect)
      publisherSelect.innerHTML = '<option value="">Lỗi tải NXB</option>';
  }
}

async function fetchAuthors(selectId = null) {
  try {
    const res = await fetch(APP_ENV.AUTHOR_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    authors = await res.json(); // Expects array like [{ma_tac_gia: 1, ten_tac_gia: '...'}, ...]
    updateAuthorDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải tác giả:", error);
    if (authorSelect)
      authorSelect.innerHTML = '<option value="">Lỗi tải tác giả</option>';
  }
}

async function fetchSeries(selectId = null) {
  try {
    // Ensure this URL fetches *all* series for the dropdown
    const res = await fetch(APP_ENV.FETCH_BY_SERIES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    series = await res.json(); // Expects array like [{ma_bo_sach: 1, ten_bo_sach: '...'}, ...]
    updateSeriesDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải bộ sách:", error);
    if (seriesSelect)
      seriesSelect.innerHTML = '<option value="">Lỗi tải bộ sách</option>';
  }
}

function updatePublisherDropdown(selectId = null) {
  if (!publisherSelect) return;
  // ID from API (ma_nha_xuat_ban) is number, value in select should match for selection
  const currentVal = selectId !== null ? Number(selectId) : null;
  publisherSelect.innerHTML = '<option value="">-- Chọn NXB --</option>';
  publishers.forEach((pub) => {
    const option = document.createElement("option");
    option.value = pub.ma_nha_xuat_ban; // Keep value as number from API
    option.textContent = pub.ten_nha_xuat_ban;
    if (currentVal !== null && pub.ma_nha_xuat_ban === currentVal) {
      option.selected = true;
    }
    publisherSelect.appendChild(option);
  });
}

function updateAuthorDropdown(selectId = null) {
  if (!authorSelect) return;
  const currentVal = selectId !== null ? Number(selectId) : null;
  authorSelect.innerHTML = '<option value="">-- Chọn tác giả --</option>';
  authors.forEach((author) => {
    const option = document.createElement("option");
    option.value = author.ma_tac_gia; // Keep value as number
    option.textContent = author.ten_tac_gia;
    if (currentVal !== null && author.ma_tac_gia === currentVal) {
      option.selected = true;
    }
    authorSelect.appendChild(option);
  });
}

function updateSeriesDropdown(selectId = null) {
  if (!seriesSelect) return;
  const currentVal = selectId !== null ? Number(selectId) : null;
  seriesSelect.innerHTML = '<option value="">-- Chọn bộ sách --</option>';
  series.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.ma_bo_sach; // Keep value as number
    option.textContent = s.ten_bo_sach;
    if (currentVal !== null && s.ma_bo_sach === currentVal) {
      option.selected = true;
    }
    seriesSelect.appendChild(option);
  });
}

// --- Inline Add Functionality (Keep existing logic) ---

function toggleInlineAdd(type) {
  const formId = `inlineAdd${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const formElement = document.getElementById(formId);
  if (!formElement) return;

  const inputId = `newInline${
    type.charAt(0).toUpperCase() + type.slice(1)
  }Name`;
  const inputElement = document.getElementById(inputId);
  const statusElement = formElement.querySelector(".inline-add-status");

  if (
    formElement.style.display === "none" ||
    formElement.style.display === ""
  ) {
    formElement.style.display = "flex";
    if (inputElement) {
      inputElement.value = "";
      inputElement.focus();
    }
    if (statusElement) {
      statusElement.textContent = "";
      statusElement.className = "inline-add-status";
    }
  } else {
    formElement.style.display = "none";
  }
}

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
  showLoading(true);

  try {
    let payload = {};
    let fetchUrl = "";
    let idField = ""; // Field name of the ID in the response (e.g., 'ma_nha_xuat_ban')
    let fetchFunction; // Function to reload the list (e.g., fetchPublishers)

    if (type === "publisher") {
      fetchUrl = APP_ENV.UPLOAD_PUBLISHER_URL;
      payload = { ten_nha_xuat_ban: name };
      idField = "ma_nha_xuat_ban";
      fetchFunction = fetchPublishers;
    } else if (type === "author") {
      fetchUrl = APP_ENV.UPLOAD_AUTHOR_URL;
      payload = { ten_tac_gia: name };
      idField = "ma_tac_gia";
      fetchFunction = fetchAuthors;
    } else if (type === "series") {
      fetchUrl = APP_ENV.UPLOAD_SERIES_URL;
      payload = { ten_bo_sach: name };
      idField = "ma_bo_sach";
      fetchFunction = fetchSeries;
    } else {
      throw new Error("Invalid type for inline add");
    }

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Lỗi API (${response.status}): ${errorData}`);
    }

    const newItem = await response.json(); // Expects object like { ma_nha_xuat_ban: 123, ... }
    const newId = newItem?.[idField]; // Extract the numeric ID

    if (newId === undefined) {
      console.warn(
        "API did not return the expected ID field:",
        idField,
        newItem
      );
    }

    // Reload the dropdown data and select the new item (passing the numeric ID)
    await fetchFunction(newId);

    if (statusElement) {
      statusElement.textContent = "Đã lưu!";
      statusElement.className = "inline-add-status success";
    }
    setTimeout(() => {
      toggleInlineAdd(type);
    }, 1200); // Hide form
  } catch (error) {
    console.error(`Error adding ${type}:`, error);
    if (statusElement) {
      statusElement.textContent = `Lỗi: ${error.message}`;
      statusElement.className = "inline-add-status error";
    }
  } finally {
    showLoading(false);
  }
}

// --- Book List Display and Management ---

// Fetches all books and triggers rendering
async function fetchAndRenderBooks() {
  showLoading(true);
  try {
    const response = await fetch(APP_ENV.MASTER_URL); // Fetch all books
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    books = Array.isArray(data) ? data : []; // Replace local data; Assume data matches schema type-wise
    applyFiltersAndSort(); // Apply current filters/sort to the new data
    renderBooks(); // Render the potentially updated list
  } catch (error) {
    console.error("Error fetching books:", error);
    alert("Không thể tải danh sách sách: " + error.message);
    books = []; // Clear books on error
    applyFiltersAndSort();
    renderBooks(); // Render empty state
  } finally {
    showLoading(false);
  }
}

// Applies current search and sort criteria
function applyFiltersAndSort() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const sortType = document.getElementById("sortBooks")?.value || "title-asc"; // Get current sort

  // Filter
  filteredBooks = books.filter((book) => {
    const title = (book.tieu_de || "").toLowerCase();
    // Assuming publisher name is nested like book.nha_xuat_ban.ten_nha_xuat_ban
    const publisherName = (
      book.nha_xuat_ban?.ten_nha_xuat_ban || ""
    ).toLowerCase();
    return title.includes(searchTerm) || publisherName.includes(searchTerm);
  });

  // Sort
  filteredBooks.sort((a, b) => {
    const titleA = a.tieu_de || "";
    const titleB = b.tieu_de || "";
    // Use parseFloat for price comparison, even though it comes as string
    const priceA = parseFloat(a.gia_tien) || 0;
    const priceB = parseFloat(b.gia_tien) || 0;

    switch (sortType) {
      case "title-asc":
        return titleA.localeCompare(titleB, "vi");
      case "title-desc":
        return titleB.localeCompare(titleA, "vi");
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
      default:
        return 0;
    }
  });

  // Recalculate total pages after filtering/sorting
  totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  // Adjust current page if it's now out of bounds
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }
}

// Renders the books for the current page
function renderBooks() {
  if (!bookListTableBody) return;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  if (paginatedBooks.length === 0) {
    bookListTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Không có sách nào khớp.</td></tr>`;
  } else {
    bookListTableBody.innerHTML = paginatedBooks
      .map((book) => {
        // Ensure data types are handled correctly for display
        const imageUrl =
          book.sach_bia_sach?.url_bia_chinh ||
          book.image ||
          "https://cdn.elysia-app.live/placeholder.jpg";
        const title = book.tieu_de || "N/A";
        const priceDisplay = formatCurrency(book.gia_tien); // Format string price for display
        const publisherName = book.nha_xuat_ban?.ten_nha_xuat_ban || "N/A";
        const bookId = book.ma_sach; // Use the primary key from API

        if (bookId === undefined || bookId === null) {
          console.warn("Book data missing 'ma_sach':", book);
          return ""; // Skip rendering if essential ID is missing
        }

        return `
                <tr>
                  <td><img src="${imageUrl}" width="50" style="border-radius: 4px; aspect-ratio: 2/3; object-fit: cover;" alt="${title}" loading="lazy"></td>
                  <td>${title}</td>
                  <td>${priceDisplay}</td>
                  <td>${publisherName}</td>
                  <td class="book-actions">
                    <button class="action-btn edit" title="Sửa" onclick="editBook(${bookId})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Xóa" onclick="confirmDeleteBook(${bookId})"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>`;
      })
      .join("");
  }
  updatePaginationControls(); // Update buttons and page info
}

// Updates pagination controls (Prev/Next buttons, page info)
function updatePaginationControls() {
  if (!paginationNumbers || !prevPageBtn || !nextPageBtn) return;

  totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  if (totalPages <= 0) {
    paginationNumbers.textContent = "";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  paginationNumbers.textContent = `Trang ${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

// --- Event Handlers for Table Controls ---

function handleSearchInput() {
  currentPage = 1; // Reset to first page on search
  applyFiltersAndSort();
  renderBooks();
}

function handleSortChange(selectElement) {
  currentPage = 1; // Reset to first page on sort change
  applyFiltersAndSort(); // applyFiltersAndSort reads the select value internally
  renderBooks();
}

function handlePageChange(direction) {
  const newPage = currentPage + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderBooks(); // Only re-render, no need to re-filter/sort
  }
}

// --- Book Form Handling (Add/Edit/Delete) ---

// Submits book data (Create or Update)
async function submitBook() {
  try {
    const form = document.getElementById("bookForm");
    const formData = new FormData(form);
    const bookData = {}; // Object to be sent

    // --- Prepare data according to the exact schema ---
    bookData.tieu_de = formData.get("tieu_de") || ""; // required string
    bookData.gia_tien = formData.get("gia_tien") || ""; // required string
    bookData.gioi_thieu = formData.get("gioi_thieu") || ""; // required string

    const danh_gia = formData.get("danh_gia");
    if (danh_gia) bookData.danh_gia = danh_gia; // optional string
    const ngay_xuat_ban = formData.get("ngay_xuat_ban");
    if (ngay_xuat_ban) bookData.ngay_xuat_ban = ngay_xuat_ban; // optional string date

    const tong_so_trang = parseOptionalInt(formData.get("tong_so_trang"));
    if (tong_so_trang !== null) bookData.tong_so_trang = tong_so_trang; // optional number
    const ma_nha_xuat_ban = parseOptionalInt(formData.get("ma_nha_xuat_ban"));
    if (ma_nha_xuat_ban !== null) bookData.ma_nha_xuat_ban = ma_nha_xuat_ban; // number (effectively required)
    const ma_bo_sach = parseOptionalInt(formData.get("ma_bo_sach"));
    if (ma_bo_sach !== null) bookData.ma_bo_sach = ma_bo_sach; // optional number
    const ma_tac_gia = parseOptionalInt(formData.get("ma_tac_gia"));
    if (ma_tac_gia !== null) bookData.ma_tac_gia = ma_tac_gia; // optional number
    const ma_kieu_sach = parseOptionalInt(formData.get("ma_kieu_sach"));
    if (ma_kieu_sach !== null) bookData.ma_kieu_sach = ma_kieu_sach; // optional number
    const so_tap = parseOptionalFloat(formData.get("so_tap"));
    if (so_tap !== null) bookData.so_tap = so_tap; // optional number

    const url_bia_chinh = formData.get("url_bia_chinh");
    if (url_bia_chinh) bookData.url_bia_chinh = url_bia_chinh; // optional string url
    const url_bia_cover = formData.get("url_bia_cover");
    if (url_bia_cover) bookData.url_bia_cover = url_bia_cover; // optional string url
    const url_bia_phu = formData.get("url_bia_phu");
    if (url_bia_phu) bookData.url_bia_phu = url_bia_phu; // optional string url
    const url_bookmark = formData.get("url_bookmark");
    if (url_bookmark) bookData.url_bookmark = url_bookmark; // optional string url

    // --- Validation ---
    if (
      !bookData.tieu_de ||
      !bookData.gia_tien ||
      !bookData.gioi_thieu ||
      bookData.ma_nha_xuat_ban === undefined
    ) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc:\n- Tiêu đề\n- Giá tiền\n- Giới thiệu\n- Nhà xuất bản"
      );
      return;
    }
    // Add pattern validation if needed, e.g., for gia_tien, danh_gia

    console.log("Dữ liệu sách gửi đi (SCHEMA MATCHED):", bookData);
    showLoading(true);

    let response;
    let apiUrl = currentEditId
      ? `${APP_ENV.UPDATE_BOOK_URL}${currentEditId}`
      : APP_ENV.UPLOAD_BOOK_URL;
    let method = currentEditId ? "PUT" : "POST"; // Or PATCH for update

    response = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    const resultText = await response.text();
    showLoading(false);

    if (response.ok) {
      alert(
        currentEditId
          ? "Cập nhật sách thành công!"
          : "Thêm sách mới thành công!"
      );
      await fetchAndRenderBooks(); // Refresh the list
      closeSidePanel();
    } else {
      let errorMessage = `Lỗi ${response.status}: `;
      try {
        const errorJson = JSON.parse(resultText);
        errorMessage +=
          errorJson.detail ||
          errorJson.message ||
          errorJson.error ||
          JSON.stringify(errorJson);
      } catch (e) {
        errorMessage += resultText;
      }
      console.error("API Error:", errorMessage);
      alert(errorMessage);
    }
  } catch (error) {
    showLoading(false);
    console.error("Error submitting book:", error);
    alert(`Lỗi hệ thống: ${error.message}`);
  }
}

// Populates the form for editing a book
function editBook(id) {
  // id is ma_sach (number)
  const book = books.find((b) => b.ma_sach === id);
  if (!book) {
    alert("Không tìm thấy sách để sửa.");
    return;
  }

  currentEditId = id;
  formTitle.textContent = "Sửa Thông Tin Sách";

  // Populate form fields, ensuring types match form input expectations (mostly strings)
  document.getElementById("title").value = book.tieu_de || "";
  document.getElementById("price").value = book.gia_tien || ""; // Keep as string for form
  document.getElementById("description").value = book.gioi_thieu || "";
  document.getElementById("rating").value = book.danh_gia || ""; // Keep as string

  // Select dropdowns - value should match the option's value (which we set as number)
  document.getElementById("publisherId").value = book.ma_nha_xuat_ban ?? ""; // Use number ID for selection
  document.getElementById("authorId").value = book.ma_tac_gia ?? "";
  document.getElementById("seriesId").value = book.ma_bo_sach ?? "";
  // document.getElementById("bookTypeId").value = book.ma_kieu_sach ?? ''; // If field exists

  // Numeric fields for form
  document.getElementById("totalPages").value = book.tong_so_trang ?? "";
  document.getElementById("volume").value = book.so_tap ?? "";

  // Date field
  let publishDate = book.ngay_xuat_ban; // Comes as string YYYY-MM-DD
  document.getElementById("publishDate").value = publishDate || "";

  // Image fields
  const biaSach = book.sach_bia_sach || {}; // Handle potential null
  setImageField(
    "url_bia_chinh",
    "mainCoverPreview",
    biaSach.url_bia_chinh || book.image
  ); // Use fallback book.image if needed
  setImageField("url_bia_cover", "coverImagePreview", biaSach.url_bia_cover);
  setImageField("url_bia_phu", "backCoverPreview", biaSach.url_bia_phu);
  setImageField("url_bookmark", "bookmarkPreview", biaSach.url_bookmark);

  openSidePanel(false); // Open panel without resetting form
}

// Prompts user before deleting a book
function confirmDeleteBook(id) {
  // id is ma_sach (number)
  const book = filteredBooks.find((b) => b.ma_sach === id);
  const bookTitle = book ? book.tieu_de : `ID ${id}`;
  if (
    confirm(
      `Bạn có chắc chắn muốn xóa sách "${bookTitle}"? Thao tác này không thể hoàn tác.`
    )
  ) {
    deleteBookApiCall(id);
  }
}

// Calls the delete API
async function deleteBookApiCall(id) {
  // id is ma_sach (number)
  try {
    showLoading(true);
    const res = await fetch(`${APP_ENV.DELETE_BOOK_URL}${id}`, {
      method: "DELETE",
    });
    const resultText = await res.text();

    if (!res.ok) {
      let errorMessage = `Lỗi xóa sách (${res.status}): `;
      try {
        const errorJson = JSON.parse(resultText);
        errorMessage +=
          errorJson.detail ||
          errorJson.message ||
          errorJson.error ||
          JSON.stringify(errorJson);
      } catch (e) {
        errorMessage += resultText;
      }
      throw new Error(errorMessage);
    }

    alert("Đã xóa sách thành công!");
    await fetchAndRenderBooks(); // Refresh the list
  } catch (error) {
    console.error("Lỗi xóa sách:", error);
    alert(`Lỗi xóa sách: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

// --- Form Panel Visibility and Reset ---

function resetForm() {
  if (bookForm) bookForm.reset();
  formTitle.textContent = "Thêm Sách Mới";
  currentEditId = null;

  // Reset image previews and statuses
  document.querySelectorAll(".image-preview img").forEach((img) => {
    img.src = "";
    img.style.display = "none";
  });
  document.querySelectorAll(".upload-status").forEach((status) => {
    status.textContent = "";
    status.className = "upload-status";
  });

  // Close any open inline forms and reset their state
  ["publisher", "author", "series"].forEach((type) => {
    const formId = `inlineAdd${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const formElement = document.getElementById(formId);
    if (formElement && formElement.style.display !== "none") {
      toggleInlineAdd(type); // Call toggle to hide and potentially clear
    }
    // Ensure hidden just in case
    if (formElement) formElement.style.display = "none";
  });

  // Set default tab
  document.querySelector(".form-tabs .tab")?.click();
}

function openSidePanel(doReset = true) {
  if (doReset) resetForm();
  sidePanel?.classList.add("open");
  // Optional: Re-fetch dropdowns if data might change frequently
  // fetchPublishers(document.getElementById("publisherId").value);
}

function closeSidePanel() {
  sidePanel?.classList.remove("open");
  resetForm(); // Always reset when closing
}

// --- Section Visibility Control ---

function showBooks() {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("booksSection").style.display = "block";
  fetchAndRenderBooks(); // Load books when section is shown
}

function showDashboard() {
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("booksSection").style.display = "none";
}

// --- Preview Image from URL Input ---
function previewImage(inputId, previewId) {
  const urlInput = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!urlInput || !preview) return;
  const url = urlInput.value.trim();

  if (!url) {
    preview.src = "";
    preview.style.display = "none";
    return;
  }
  if (!url.toLowerCase().startsWith("http")) {
    alert("URL không hợp lệ.");
    return;
  }

  preview.onerror = () => {
    alert("Không thể tải ảnh từ URL.");
    preview.src = "";
    preview.style.display = "none";
  };
  preview.onload = () => {
    preview.style.display = "block";
  };
  preview.src = url;
  preview.style.display = "block"; // Show pending load/error
}

// --- Global Function Exposure ---
// Assign functions called by HTML onclick to window object
window.showDashboard = showDashboard;
window.showBooks = showBooks;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.submitBook = submitBook;
window.editBook = editBook;
window.confirmDeleteBook = confirmDeleteBook;
window.handleSearchInput = handleSearchInput; // Assuming oninput="handleSearchInput()"
window.handleSortChange = handleSortChange; // Assuming onchange="handleSortChange(this)"
window.handlePageChange = handlePageChange; // Assuming onclick="handlePageChange(1/-1)"
window.previewImage = previewImage;
window.toggleInlineAdd = toggleInlineAdd;
window.saveInlineItem = saveInlineItem;

// --- Initial Load ---
document.addEventListener("DOMContentLoaded", init);

// --- END OF FILE script.js ---
