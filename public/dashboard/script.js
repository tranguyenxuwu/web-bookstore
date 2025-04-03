// --- START OF FILE script.js ---

import { APP_ENV } from "../assets/script/env.js";

// --- Global State ---
let books = []; // Holds the master list fetched from API
let publishers = [];
let authors = [];
let series = [];
let bookTypes = []; // *** NEW: Store book types ***
let filteredBooks = []; // Holds the currently displayed/filtered list
let currentPage = 1;
const itemsPerPage = 10;
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
const bookTypeSelect = document.getElementById("bookTypeId"); // *** NEW: Book type select element ***
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
  fetchBookTypes(); // *** NEW: Fetch book types ***
}

// --- Chart (Keep existing implementation) ---
function initChart() {
  const ctx = document.getElementById("revenueChart")?.getContext("2d");
  if (!ctx) {
    console.warn("Revenue chart canvas not found");
    return;
  }
  // Sample data (replace with actual data fetching logic if needed)
  const chartData = {
    labels: [
      "Thg 1",
      "Thg 2",
      "Thg 3",
      "Thg 4",
      "Thg 5",
      "Thg 6",
      "Thg 7",
      "Thg 8",
      "Thg 9",
      "Thg 10",
      "Thg 11",
      "Thg 12",
    ],
    datasets: [
      {
        label: "Doanh thu (₫)",
        data: [120, 190, 300, 500, 210, 300, 450, 600, 550, 700, 800, 950].map(
          (x) => x * 100000
        ), // Example data
        borderColor: "#3498db",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };
  const chartConfig = {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString("vi-VN") + " ₫";
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString("vi-VN") + " ₫";
              }
              return label;
            },
          },
        },
      },
    },
  };
  const revenueChart = new Chart(ctx, chartConfig);

  // Sample data for orders
  const orderData = [20, 35, 40, 60, 30, 45, 55, 70, 65, 80, 90, 110];

  document.querySelectorAll(".chart-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".chart-btn")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const type = button.dataset.type;
      const currentDataset = revenueChart.data.datasets[0];

      if (type === "revenue") {
        currentDataset.label = "Doanh thu (₫)";
        currentDataset.data = chartData.datasets[0].data; // Use original revenue data
        revenueChart.options.scales.y.ticks.callback = function (value) {
          return value.toLocaleString("vi-VN") + " ₫";
        };
        revenueChart.options.plugins.tooltip.callbacks.label = function (
          context
        ) {
          let label = context.dataset.label || "";
          if (label) label += ": ";
          if (context.parsed.y !== null) {
            label += context.parsed.y.toLocaleString("vi-VN") + " ₫";
          }
          return label;
        };
      } else if (type === "orders") {
        currentDataset.label = "Số lượng đơn hàng";
        currentDataset.data = orderData; // Use order data
        revenueChart.options.scales.y.ticks.callback = function (value) {
          // Ensure integer ticks for orders if needed
          if (Number.isInteger(value)) return value;
          return ""; // Avoid showing float ticks for count data
        };
        revenueChart.options.plugins.tooltip.callbacks.label = function (
          context
        ) {
          let label = context.dataset.label || "";
          if (label) label += ": ";
          if (context.parsed.y !== null) {
            label += context.parsed.y;
          }
          return label;
        };
      }
      revenueChart.update();
    });
  });
}

// --- Form Tabs and File Upload Setup (Keep existing) ---
function setupFormTabs() {
  document.querySelectorAll(".form-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Deactivate all tabs and content
      document
        .querySelectorAll(".form-tabs .tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Activate clicked tab and corresponding content
      tab.classList.add("active");
      const tabName = tab.dataset.tab;
      const contentTab = document.getElementById(`${tabName}-tab`);
      if (contentTab) contentTab.classList.add("active");
    });
  });

  // Ensure initial state: Activate the first tab and its content
  const firstTab = document.querySelector(".form-tabs .tab");
  if (firstTab) {
    // Deactivate others first to be safe
    document
      .querySelectorAll(".form-tabs .tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    // Activate first
    firstTab.classList.add("active");
    const firstTabName = firstTab.dataset.tab;
    const firstContentTab = document.getElementById(`${firstTabName}-tab`);
    if (firstContentTab) firstContentTab.classList.add("active");
  }
}

function setupFileUploads() {
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      const fieldName = input.dataset.field; // e.g., "url_bia_chinh"
      const statusElementId = `status_${fieldName.replace("url_", "")}`;
      const previewElementId = `${fieldName.replace("url_", "")}Preview`;
      const statusElement = document.getElementById(statusElementId);
      const previewElement = document.getElementById(previewElementId);
      const urlInputField = document.getElementById(fieldName); // Text input for URL

      // If a file is selected, clear the corresponding URL input and its preview
      if (file && urlInputField) {
        urlInputField.value = "";
        // Preview from URL input is handled by previewImage, no need to clear here
      }
      // If no file selected (e.g., user cancels), do nothing
      if (!file) return;

      if (statusElement) {
        statusElement.innerHTML = "Đang tải ảnh lên...";
        statusElement.className = "upload-status loading";
      }

      // Preview the selected file locally
      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewElement) {
          previewElement.src = event.target.result;
          previewElement.style.display = "block";
        }
      };
      reader.readAsDataURL(file);

      // Start the upload process
      try {
        showLoading(true);
        const publicUrl = await uploadImage(file);
        // Set the URL input field with the result from upload
        if (urlInputField) urlInputField.value = publicUrl;
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
        // Clear preview on upload error? Optional.
        // if (previewElement) {
        //   previewElement.src = "";
        //   previewElement.style.display = "none";
        // }
      } finally {
        showLoading(false);
      }
    });
  });
}

// Upload image function (Keep existing)
async function uploadImage(file) {
  const presignedUrlEndpoint = APP_ENV.IMAGE_PRESIGNED_URL; // Get URL once
  if (!presignedUrlEndpoint) {
    throw new Error("Lỗi cấu hình: IMAGE_PRESIGNED_URL chưa được định nghĩa.");
  }

  console.log(`Attempting to get presigned URL from: ${presignedUrlEndpoint}`);
  console.log(`Requesting for file: ${file.name}, type: ${file.type}`);

  try {
    // Step 1: Get presigned URL
    const presignedRes = await fetch(presignedUrlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if your endpoint requires it
        // 'Authorization': `Bearer ${your_auth_token}`
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
      }),
    });

    console.log(
      `Presigned URL fetch status: ${presignedRes.status} ${presignedRes.statusText}`
    );

    if (!presignedRes.ok) {
      let errorBody = "Could not read error response body.";
      try {
        errorBody = await presignedRes.text();
      } catch (readError) {
        console.error("Error reading the error response body:", readError);
      }
      console.error(
        `Failed to get presigned URL. Status: ${presignedRes.status}. Response:`,
        errorBody
      );
      throw new Error(
        `Lỗi lấy presigned URL (Status: ${presignedRes.status}) - ${errorBody}`
      );
    }

    const { url, publicUrl } = await presignedRes.json();
    if (!url || !publicUrl) {
      throw new Error(
        "Phản hồi API presigned URL không hợp lệ (thiếu url hoặc publicUrl)."
      );
    }
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
      throw new Error(
        `Upload ảnh thất bại (Status: ${uploadRes.status}) - ${uploadErrorBody}`
      );
    }

    console.log("Upload thành công, public URL:", publicUrl);
    return publicUrl; // Return the public URL on success
  } catch (error) {
    console.error("Chi tiết lỗi trong quá trình upload:", error);
    // Re-throw a potentially more user-friendly error or the original
    throw new Error(`Lỗi upload ảnh: ${error.message}`);
  }
}

// --- Fetching and Updating Related Data Dropdowns ---

async function fetchPublishers(selectId = null) {
  try {
    if (!APP_ENV.PUBLISHER_URL)
      throw new Error("Lỗi cấu hình: PUBLISHER_URL chưa định nghĩa.");
    const res = await fetch(APP_ENV.PUBLISHER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    publishers = await res.json();
    updatePublisherDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải NXB:", error);
    if (publisherSelect)
      publisherSelect.innerHTML = `<option value="">Lỗi tải NXB: ${error.message}</option>`;
  }
}

async function fetchAuthors(selectId = null) {
  try {
    if (!APP_ENV.AUTHOR_URL)
      throw new Error("Lỗi cấu hình: AUTHOR_URL chưa định nghĩa.");
    const res = await fetch(APP_ENV.AUTHOR_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    authors = await res.json();
    updateAuthorDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải tác giả:", error);
    if (authorSelect)
      authorSelect.innerHTML = `<option value="">Lỗi tải tác giả: ${error.message}</option>`;
  }
}

async function fetchSeries(selectId = null) {
  try {
    if (!APP_ENV.FETCH_BY_SERIES_URL)
      throw new Error("Lỗi cấu hình: FETCH_BY_SERIES_URL chưa định nghĩa.");
    const res = await fetch(APP_ENV.FETCH_BY_SERIES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    series = await res.json();
    updateSeriesDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải bộ sách:", error);
    if (seriesSelect)
      seriesSelect.innerHTML = `<option value="">Lỗi tải bộ sách: ${error.message}</option>`;
  }
}

// *** NEW: Fetch Book Types ***
async function fetchBookTypes(selectId = null) {
  try {
    // Make sure APP_ENV.BOOK_TYPE_URL is defined in your env.js
    if (!APP_ENV.BOOK_TYPE_URL) {
      console.warn("APP_ENV.BOOK_TYPE_URL is not defined.");
      if (bookTypeSelect)
        bookTypeSelect.innerHTML = '<option value="">Lỗi cấu hình URL</option>';
      return;
    }
    const res = await fetch(APP_ENV.BOOK_TYPE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    bookTypes = await res.json(); // Expects [{ma_kieu_sach: 1, ten_kieu_sach: '...'}, ...]
    updateBookTypeDropdown(selectId);
  } catch (error) {
    console.error("Lỗi tải kiểu sách:", error);
    if (bookTypeSelect)
      bookTypeSelect.innerHTML = `<option value="">Lỗi tải kiểu sách: ${error.message}</option>`;
  }
}

function updatePublisherDropdown(selectId = null) {
  if (!publisherSelect) return;
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

// *** NEW: Update Book Type Dropdown ***
function updateBookTypeDropdown(selectId = null) {
  if (!bookTypeSelect) return;
  const currentVal = selectId !== null ? Number(selectId) : null;
  bookTypeSelect.innerHTML = '<option value="">-- Chọn kiểu sách --</option>';
  // Ensure bookTypes is an array before iterating
  if (Array.isArray(bookTypes)) {
    bookTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.ma_kieu_sach; // Use the ID field from API
      option.textContent = type.ten_kieu_sach; // Use the name field from API
      if (currentVal !== null && type.ma_kieu_sach === currentVal) {
        option.selected = true;
      }
      bookTypeSelect.appendChild(option);
    });
  } else {
    console.warn("Dữ liệu kiểu sách không phải là mảng:", bookTypes);
    bookTypeSelect.innerHTML =
      '<option value="">Lỗi dữ liệu kiểu sách</option>';
  }
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
    let configError = false;

    if (type === "publisher") {
      if (!APP_ENV.UPLOAD_PUBLISHER_URL) configError = true;
      fetchUrl = APP_ENV.UPLOAD_PUBLISHER_URL;
      payload = { ten_nha_xuat_ban: name };
      idField = "ma_nha_xuat_ban";
      fetchFunction = fetchPublishers;
    } else if (type === "author") {
      if (!APP_ENV.UPLOAD_AUTHOR_URL) configError = true;
      fetchUrl = APP_ENV.UPLOAD_AUTHOR_URL;
      payload = { ten_tac_gia: name };
      idField = "ma_tac_gia";
      fetchFunction = fetchAuthors;
    } else if (type === "series") {
      if (!APP_ENV.UPLOAD_SERIES_URL) configError = true;
      fetchUrl = APP_ENV.UPLOAD_SERIES_URL;
      payload = { ten_bo_sach: name };
      idField = "ma_bo_sach";
      fetchFunction = fetchSeries;
    } else {
      throw new Error("Loại không hợp lệ để thêm inline");
    }

    if (configError) {
      throw new Error(
        `Lỗi cấu hình: URL upload cho '${type}' chưa được định nghĩa.`
      );
    }

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text(); // Read text first

    if (!response.ok) {
      let errorDetail = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetail =
          errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
        /* Ignore if not JSON */
      }
      throw new Error(`Lỗi API (${response.status}): ${errorDetail}`);
    }

    let newItem;
    try {
      newItem = JSON.parse(responseText); // Parse JSON now we know it's OK
    } catch (e) {
      throw new Error(`Lỗi phân tích phản hồi JSON thành công: ${e.message}`);
    }

    const newId = newItem?.[idField];

    if (newId === undefined) {
      console.warn("API không trả về trường ID mong đợi:", idField, newItem);
      // Optionally throw an error or proceed cautiously
      // throw new Error("Phản hồi API không chứa ID mong đợi.");
    }

    // Reload the dropdown data and select the new item (passing the numeric ID)
    await fetchFunction(newId);

    if (statusElement) {
      statusElement.textContent = "Đã lưu!";
      statusElement.className = "inline-add-status success";
    }
    setTimeout(() => {
      toggleInlineAdd(type); // Hide form after a short delay
    }, 1200);
  } catch (error) {
    console.error(`Lỗi thêm ${type}:`, error);
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
    if (!APP_ENV.MASTER_URL)
      throw new Error("Lỗi cấu hình: MASTER_URL chưa định nghĩa.");
    const response = await fetch(APP_ENV.MASTER_URL);
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    books = Array.isArray(data) ? data : [];
    applyFiltersAndSort();
    renderBooks();
  } catch (error) {
    console.error("Lỗi tải danh sách sách:", error);
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
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const sortType = document.getElementById("sortBooks")?.value || "title-asc";

  // Filter
  filteredBooks = books.filter((book) => {
    // Check if book and its properties exist before accessing
    const title = (book?.tieu_de || "").toLowerCase();
    const publisherName = (
      book?.nha_xuat_ban?.ten_nha_xuat_ban || ""
    ).toLowerCase();
    // Add more fields to search if needed
    // const authorName = (book?.tac_gia?.ten_tac_gia || "").toLowerCase();

    // Match if search term is empty or found in title or publisher name
    return (
      !searchTerm ||
      title.includes(searchTerm) ||
      publisherName.includes(searchTerm)
    );
  });

  // Sort
  filteredBooks.sort((a, b) => {
    // Provide default values for robust comparison
    const titleA = a?.tieu_de || "";
    const titleB = b?.tieu_de || "";
    const priceA = parseFloat(a?.gia_tien) || 0;
    const priceB = parseFloat(b?.gia_tien) || 0;

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
        return 0; // No sorting or unknown type
    }
  });

  // Recalculate total pages after filtering/sorting
  totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  // Adjust current page if it's now out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  } else if (totalPages === 0) {
    currentPage = 1; // Reset to 1 if no results
  }
}

// Renders the books for the current page
function renderBooks() {
  if (!bookListTableBody) return;

  // Ensure currentPage is valid before slicing
  if (currentPage < 1) currentPage = 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  if (paginatedBooks.length === 0 && books.length > 0) {
    // Show message only if master list has items but filter yields none
    bookListTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Không tìm thấy sách nào khớp với tìm kiếm/bộ lọc.</td></tr>`;
  } else if (books.length === 0) {
    // Initial load or fetch error
    bookListTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có sách nào trong hệ thống.</td></tr>`;
  } else {
    bookListTableBody.innerHTML = paginatedBooks
      .map((book) => {
        // Defensive coding: check for book existence and properties
        if (!book) return ""; // Skip rendering if book is somehow null/undefined

        const imageUrl =
          book.sach_bia_sach?.url_bia_chinh ||
          book.image || // Fallback 1
          "https://cdn.elysia-app.live/placeholder.jpg"; // Fallback 2
        const title = book.tieu_de || "N/A";
        const priceDisplay = formatCurrency(book.gia_tien); // formatCurrency handles NaN
        const publisherName = book.nha_xuat_ban?.ten_nha_xuat_ban || "N/A";
        const bookId = book.ma_sach;

        if (bookId === undefined || bookId === null) {
          console.warn("Dữ liệu sách thiếu 'ma_sach':", book);
          return ""; // Skip rendering if essential ID is missing
        }

        return `
                <tr>
                  <td><img src="${imageUrl}" width="50" style="border-radius: 4px; aspect-ratio: 2/3; object-fit: cover;" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='https://cdn.elysia-app.live/placeholder.jpg';"></td>
                  <td title="${title}">${title}</td>
                  <td>${priceDisplay}</td>
                  <td title="${publisherName}">${publisherName}</td>
                  <td class="book-actions">
                    <button class="action-btn edit" title="Sửa sách" onclick="editBook(${bookId})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Xóa sách" onclick="confirmDeleteBook(${bookId})"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>`;
      })
      .join("");
  }
  updatePaginationControls(); // Update buttons and page info regardless of content
}

// Updates pagination controls (Prev/Next buttons, page info)
function updatePaginationControls() {
  if (!paginationNumbers || !prevPageBtn || !nextPageBtn) return;

  totalPages = Math.ceil(filteredBooks.length / itemsPerPage); // Recalculate based on filtered list

  if (totalPages <= 0) {
    paginationNumbers.textContent = "Không có kết quả";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    prevPageBtn.style.visibility = "hidden"; // Hide buttons if no pages
    nextPageBtn.style.visibility = "hidden";
  } else {
    paginationNumbers.textContent = `Trang ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    prevPageBtn.style.visibility = "visible"; // Show buttons if pages exist
    nextPageBtn.style.visibility = "visible";
  }
}

// --- Event Handlers for Table Controls ---

// Renamed original functions to avoid conflicts with global scope assignments
function handleSearchInputInternal() {
  currentPage = 1; // Reset to first page on search
  applyFiltersAndSort();
  renderBooks();
}

function handleSortChangeInternal() {
  // No need for selectElement param if reading directly
  currentPage = 1; // Reset to first page on sort change
  applyFiltersAndSort(); // applyFiltersAndSort reads the select value internally
  renderBooks();
}

function handlePageChangeInternal(direction) {
  const newPage = currentPage + direction;
  // Check bounds against totalPages based on filtered results
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
    if (!form) throw new Error("Không tìm thấy form sách.");

    const formData = new FormData(form);
    const bookData = {}; // Object to be sent

    // --- Prepare data according to the exact schema ---
    // Required fields
    bookData.tieu_de = formData.get("tieu_de")?.trim() || "";
    bookData.gia_tien = formData.get("gia_tien")?.trim() || "";
    bookData.gioi_thieu = formData.get("gioi_thieu")?.trim() || "";
    const ma_nha_xuat_ban = parseOptionalInt(formData.get("ma_nha_xuat_ban"));
    // Treat publisher as required for this logic
    if (ma_nha_xuat_ban === null) {
      alert("Vui lòng chọn Nhà xuất bản.");
      // Optionally focus the element: document.getElementById('publisherId')?.focus();
      return;
    }
    bookData.ma_nha_xuat_ban = ma_nha_xuat_ban;

    // Optional fields
    const danh_gia = formData.get("danh_gia")?.trim();
    if (danh_gia) bookData.danh_gia = danh_gia;

    const ngay_xuat_ban = formData.get("ngay_xuat_ban");
    if (ngay_xuat_ban) {
      // Validate date format if necessary
      if (/^\d{4}-\d{2}-\d{2}$/.test(ngay_xuat_ban)) {
        bookData.ngay_xuat_ban = ngay_xuat_ban;
      } else {
        alert("Định dạng Ngày xuất bản không hợp lệ (YYYY-MM-DD).");
        document.getElementById("publishDate")?.focus();
        return;
      }
    }

    const tong_so_trang = parseOptionalInt(formData.get("tong_so_trang"));
    if (tong_so_trang !== null) {
      if (tong_so_trang < 0) {
        alert("Tổng số trang không được âm.");
        return;
      }
      bookData.tong_so_trang = tong_so_trang;
    }

    const ma_bo_sach = parseOptionalInt(formData.get("ma_bo_sach"));
    if (ma_bo_sach !== null) bookData.ma_bo_sach = ma_bo_sach;

    const ma_tac_gia = parseOptionalInt(formData.get("ma_tac_gia"));
    if (ma_tac_gia !== null) bookData.ma_tac_gia = ma_tac_gia;

    // *** NEW: Get Book Type ID ***
    const ma_kieu_sach = parseOptionalInt(formData.get("ma_kieu_sach"));
    if (ma_kieu_sach !== null) bookData.ma_kieu_sach = ma_kieu_sach;

    const so_tap = parseOptionalFloat(formData.get("so_tap"));
    if (so_tap !== null) {
      if (so_tap < 0) {
        alert("Số tập không được âm.");
        return;
      }
      bookData.so_tap = so_tap;
    }

    // Image URLs (get from URL fields only, file uploads handle URL setting)
    const url_bia_chinh = formData.get("url_bia_chinh")?.trim();
    if (url_bia_chinh) bookData.url_bia_chinh = url_bia_chinh;
    const url_bia_cover = formData.get("url_bia_cover")?.trim();
    if (url_bia_cover) bookData.url_bia_cover = url_bia_cover;
    const url_bia_phu = formData.get("url_bia_phu")?.trim();
    if (url_bia_phu) bookData.url_bia_phu = url_bia_phu;
    const url_bookmark = formData.get("url_bookmark")?.trim();
    if (url_bookmark) bookData.url_bookmark = url_bookmark;

    // --- Validation ---
    if (!bookData.tieu_de || !bookData.gia_tien || !bookData.gioi_thieu) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc:\n- Tiêu đề\n- Giá tiền\n- Giới thiệu"
      );
      // Highlight missing fields visually (optional enhancement)
      if (!bookData.tieu_de) document.getElementById("title")?.focus();
      else if (!bookData.gia_tien) document.getElementById("price")?.focus();
      else if (!bookData.gioi_thieu)
        document.getElementById("description")?.focus();
      return;
    }
    // Validate price format/value
    const priceValue = parseFloat(bookData.gia_tien);
    if (isNaN(priceValue) || priceValue < 0) {
      alert("Giá tiền không hợp lệ hoặc là số âm.");
      document.getElementById("price")?.focus();
      return;
    }
    bookData.gia_tien = priceValue.toString(); // Send as string if API expects string

    console.log("Dữ liệu sách gửi đi (SCHEMA MATCHED):", bookData);
    showLoading(true);

    let response;
    let apiUrl;
    let method;

    if (currentEditId) {
      // Update existing book
      if (!APP_ENV.UPDATE_BOOK_URL)
        throw new Error("Lỗi cấu hình: UPDATE_BOOK_URL chưa định nghĩa.");
      apiUrl = APP_ENV.UPDATE_BOOK_URL.endsWith("/")
        ? `${APP_ENV.UPDATE_BOOK_URL}${currentEditId}`
        : `${APP_ENV.UPDATE_BOOK_URL}/${currentEditId}`;
      method = "PUT"; // Or PATCH if appropriate
    } else {
      // Create new book
      if (!APP_ENV.UPLOAD_BOOK_URL)
        throw new Error("Lỗi cấu hình: UPLOAD_BOOK_URL chưa định nghĩa.");
      apiUrl = APP_ENV.UPLOAD_BOOK_URL;
      method = "POST";
    }

    response = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });

    const resultText = await response.text(); // Get text regardless of status
    showLoading(false); // Hide loading indicator

    if (response.ok) {
      alert(
        currentEditId
          ? "Cập nhật sách thành công!"
          : "Thêm sách mới thành công!"
      );
      await fetchAndRenderBooks(); // Refresh the list
      closeSidePanel(); // Close the panel on success
    } else {
      // Handle API error
      let errorMessage = `Lỗi ${response.status} (${method} ${apiUrl}): `;
      try {
        const errorJson = JSON.parse(resultText);
        errorMessage +=
          errorJson.detail || // FastAPI common error field
          errorJson.message ||
          errorJson.error ||
          JSON.stringify(errorJson); // Fallback to stringified JSON
      } catch (e) {
        errorMessage += resultText; // Fallback to raw text if not JSON
      }
      console.error("API Error Response:", resultText);
      alert(`Lưu sách thất bại: ${errorMessage}`);
    }
  } catch (error) {
    showLoading(false);
    console.error("Lỗi hệ thống khi submit sách:", error);
    alert(`Lỗi hệ thống: ${error.message}`);
  }
}

// Populates the form for editing a book
function editBook(id) {
  // id is ma_sach (number)
  const book = books.find((b) => b.ma_sach === id);
  if (!book) {
    alert(
      "Không tìm thấy sách để sửa (ID: " + id + "). Có thể sách đã bị xóa?"
    );
    return;
  }

  console.log("Editing book:", book); // Log the book data being edited
  currentEditId = id;
  formTitle.textContent = "Sửa Thông Tin Sách";

  // Populate form fields, ensuring types match form input expectations (mostly strings)
  document.getElementById("title").value = book.tieu_de || "";
  document.getElementById("price").value = book.gia_tien || ""; // Keep as string for form input type=number works ok
  document.getElementById("description").value = book.gioi_thieu || "";
  document.getElementById("rating").value = book.danh_gia || ""; // Keep as string

  // Select dropdowns - value should match the option's value (which we set as number)
  document.getElementById("publisherId").value = book.ma_nha_xuat_ban ?? ""; // Use number ID for selection, fallback to ""
  document.getElementById("authorId").value = book.ma_tac_gia ?? "";
  document.getElementById("seriesId").value = book.ma_bo_sach ?? "";
  document.getElementById("bookTypeId").value = book.ma_kieu_sach ?? ""; // *** NEW: Set Book Type ***

  // Numeric fields for form
  document.getElementById("totalPages").value = book.tong_so_trang ?? "";
  document.getElementById("volume").value = book.so_tap ?? "";

  // Date field (ensure format matches YYYY-MM-DD if API provides it)
  let publishDate = book.ngay_xuat_ban; // Comes as string YYYY-MM-DD or potentially other formats
  if (publishDate) {
    try {
      // Attempt to parse and reformat to ensure YYYY-MM-DD
      const dateObj = new Date(publishDate);
      // Check if the date is valid before formatting
      if (!isNaN(dateObj.getTime())) {
        // Pad month and day with leading zeros if necessary
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        publishDate = `${year}-${month}-${day}`;
      } else {
        console.warn(
          "Invalid date format received for ngay_xuat_ban:",
          book.ngay_xuat_ban
        );
        publishDate = ""; // Clear if invalid
      }
    } catch (e) {
      console.error("Error parsing date:", e);
      publishDate = ""; // Clear on error
    }
  }
  document.getElementById("publishDate").value = publishDate || "";

  // Image fields - Use the specific URLs from sach_bia_sach if available
  const biaSach = book.sach_bia_sach || {}; // Handle potential null relation
  setImageField(
    "url_bia_chinh",
    "mainCoverPreview",
    biaSach.url_bia_chinh || book.image // Use fallback book.image if bia_chinh is missing
  );
  setImageField("url_bia_cover", "coverImagePreview", biaSach.url_bia_cover);
  setImageField("url_bia_phu", "backCoverPreview", biaSach.url_bia_phu);
  setImageField("url_bookmark", "bookmarkPreview", biaSach.url_bookmark);

  openSidePanel(false); // Open panel without resetting form
}

// Prompts user before deleting a book
function confirmDeleteBook(id) {
  // id is ma_sach (number)
  const book = books.find((b) => b.ma_sach === id); // Find in the master list
  const bookTitle = book ? book.tieu_de : `ID ${id}`;
  if (
    confirm(
      `Bạn có chắc chắn muốn xóa sách "${bookTitle}" (ID: ${id})? Thao tác này không thể hoàn tác.`
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
    if (!APP_ENV.DELETE_BOOK_URL)
      throw new Error("Lỗi cấu hình: DELETE_BOOK_URL chưa định nghĩa.");

    // Ensure URL construction is correct (handles trailing slash)
    const deleteUrl = APP_ENV.DELETE_BOOK_URL.endsWith("/")
      ? `${APP_ENV.DELETE_BOOK_URL}${id}`
      : `${APP_ENV.DELETE_BOOK_URL}/${id}`;

    const res = await fetch(deleteUrl, {
      method: "DELETE",
      // Add headers if required by your API (e.g., Authorization)
      // headers: { 'Authorization': `Bearer ${your_token}` }
    });

    const resultText = await res.text(); // Get text for detailed error reporting

    if (!res.ok) {
      let errorMessage = `Lỗi xóa sách (ID: ${id}, Status: ${res.status}): `;
      try {
        const errorJson = JSON.parse(resultText);
        errorMessage +=
          errorJson.detail ||
          errorJson.message ||
          errorJson.error ||
          JSON.stringify(errorJson);
      } catch (e) {
        errorMessage += resultText || res.statusText; // Fallback if response not JSON
      }
      throw new Error(errorMessage);
    }

    alert(`Đã xóa sách (ID: ${id}) thành công!`);
    // Refresh the book list FROM THE SERVER after successful deletion
    await fetchAndRenderBooks();
  } catch (error) {
    console.error("Lỗi xóa sách:", error);
    alert(`${error.message}`); // Display the detailed error message
  } finally {
    showLoading(false);
  }
}

// --- Form Panel Visibility and Reset ---

function resetForm() {
  if (bookForm) bookForm.reset(); // Resets most standard input fields
  formTitle.textContent = "Thêm Sách Mới";
  currentEditId = null;

  // Manually clear/reset fields not handled by form.reset() or needing specific state
  // Reset image previews and statuses
  document.querySelectorAll(".image-preview img").forEach((img) => {
    img.src = "";
    img.style.display = "none";
  });
  document.querySelectorAll(".upload-status").forEach((status) => {
    status.textContent = "";
    status.className = "upload-status";
  });
  // Reset file input values visually (though actual file list is read-only)
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.value = ""; // Attempts to clear the visual selection
  });

  // Close any open inline forms and reset their state
  ["publisher", "author", "series"].forEach((type) => {
    const formId = `inlineAdd${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const formElement = document.getElementById(formId);
    if (formElement && formElement.style.display !== "none") {
      toggleInlineAdd(type); // Call toggle to hide and potentially clear input
    }
    // Ensure hidden just in case toggle logic failed
    if (formElement) formElement.style.display = "none";
  });

  // *** NEW: Reset Book Type Select ***
  if (bookTypeSelect) bookTypeSelect.value = ""; // Reset selection to default "-- Chọn kiểu sách --"

  // Set default tab active visually
  setupFormTabs(); // Re-run to ensure correct tab state
}

function openSidePanel(doReset = true) {
  if (doReset) {
    resetForm();
  } else if (currentEditId) {
    // If editing, ensure dropdowns reflect the data (in case they were fetched AFTER editBook ran)
    const book = books.find((b) => b.ma_sach === currentEditId);
    if (book) {
      updatePublisherDropdown(book.ma_nha_xuat_ban);
      updateAuthorDropdown(book.ma_tac_gia);
      updateSeriesDropdown(book.ma_bo_sach);
      updateBookTypeDropdown(book.ma_kieu_sach); // *** NEW ***
    }
  }
  sidePanel?.classList.add("open");
  // Optionally focus the first input field
  document.getElementById("title")?.focus();
}

function closeSidePanel() {
  sidePanel?.classList.remove("open");
  resetForm(); // Always reset when closing to clear state
}

// --- Section Visibility Control ---

function showBooks() {
  const dashboard = document.getElementById("dashboardSection");
  const booksSection = document.getElementById("booksSection"); // Changed variable name for clarity
  if (dashboard) dashboard.style.display = "none";
  if (booksSection) booksSection.style.display = "block";
  fetchAndRenderBooks(); // Load/refresh books when section is shown
}

function showDashboard() {
  const dashboard = document.getElementById("dashboardSection");
  const booksSection = document.getElementById("booksSection"); // Changed variable name for clarity
  if (dashboard) dashboard.style.display = "block";
  if (booksSection) booksSection.style.display = "none";
  // Optional: Refresh dashboard data if needed
  // initChart(); // Re-init or update chart data if it can change
}

// --- Preview Image from URL Input ---
function previewImage(inputId, previewId) {
  const urlInput = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!urlInput || !preview) return;

  const url = urlInput.value.trim();
  const statusElementId = `status_${inputId.replace("url_", "")}`;
  const statusElement = document.getElementById(statusElementId);
  const fileInputId = inputId.replace("url_", "file_");
  const fileInput = document.getElementById(fileInputId);

  // If URL is entered, clear the corresponding file input and its status
  if (url && fileInput) {
    fileInput.value = ""; // Clear file selection
    if (statusElement) {
      statusElement.textContent = "";
      statusElement.className = "upload-status";
    }
  }

  if (!url) {
    preview.src = "";
    preview.style.display = "none";
    return;
  }
  // Basic URL validation (can be improved)
  if (
    !url.toLowerCase().startsWith("http://") &&
    !url.toLowerCase().startsWith("https://")
  ) {
    alert("URL không hợp lệ. Phải bắt đầu bằng http:// hoặc https://");
    preview.src = "";
    preview.style.display = "none";
    return;
  }

  // Set up handlers *before* setting src
  preview.onload = () => {
    preview.style.display = "block"; // Show only on successful load
  };
  preview.onerror = () => {
    // alert("Không thể tải ảnh từ URL được cung cấp. Vui lòng kiểm tra lại URL."); // đang lỗi nên comment outout
    preview.src = "";
    preview.style.display = "none";
    urlInput.focus(); // Focus back on the input
  };

  preview.src = url; // Set src triggers load/error
  preview.style.display = "block"; // Show immediately (or a placeholder) to indicate loading attempt
}

// --- Global Function Exposure ---
// Assign functions called by HTML onclick/oninput/onchange to window object
// This makes them accessible directly from the HTML attributes
window.showDashboard = showDashboard;
window.showBooks = showBooks;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.submitBook = submitBook;
window.editBook = editBook;
window.confirmDeleteBook = confirmDeleteBook;
window.handleSearchInput = handleSearchInputInternal; // Use internal name for HTML oninput
window.handleSortChange = handleSortChangeInternal; // Use internal name for HTML onchange
window.handlePageChange = handlePageChangeInternal; // Use internal name for HTML onclick
window.previewImage = previewImage;
window.toggleInlineAdd = toggleInlineAdd;
window.saveInlineItem = saveInlineItem;

// --- Initial Load ---
// Use DOMContentLoaded to ensure the HTML is fully parsed before running scripts
document.addEventListener("DOMContentLoaded", init);

// --- END OF FILE script.js ---
