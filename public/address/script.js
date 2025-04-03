// Import env variables - Keep this if you use it elsewhere, otherwise remove.
import { APP_ENV } from "../assets/script/env.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- Keep existing page transition and search setup ---
  const pageTransition = document.querySelector(".page-transition");
  if (pageTransition) {
    setTimeout(() => {
      pageTransition.style.opacity = "0";
      setTimeout(() => {
        pageTransition.style.display = "none";
      }, 500);
    }, 800);
  }

  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      const searchTerm = searchInput ? searchInput.value.trim() : "";
      window.location.href = `../search.html?title=${encodeURIComponent(
        searchTerm
      )}`;
    });
  }
  // --- End of existing setup ---

  const addressForm = document.getElementById("addressForm");
  const provinceSelect = document.getElementById("province");
  const districtSelect = document.getElementById("district");
  const wardSelect = document.getElementById("ward");
  const errorDiv = document.getElementById("error-message");

  const API_BASE_URL = "https://provinces.open-api.vn/api";

  // --- Keep populateSelect, setSelectState, fetchProvinces, fetchDistricts, fetchWards functions as they are ---
  // ... (Paste the helper and API fetching functions from the previous answer here) ...

  // --- Helper Functions ---

  // Function to reset and populate a select dropdown
  function populateSelect(selectElement, options, placeholderText) {
    selectElement.innerHTML = ""; // Clear existing options
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = placeholderText;
    placeholder.disabled = true;
    placeholder.selected = true;
    selectElement.appendChild(placeholder);

    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.code;
      option.textContent = item.name;
      option.dataset.name = item.name; // Store name for later retrieval if needed
      selectElement.appendChild(option);
    });
  }

  // Function to set select state (loading, disabled, enabled)
  function setSelectState(selectElement, state, placeholder) {
    selectElement.disabled = state === "disabled" || state === "loading";
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
  }

  // --- API Fetching Functions ---

  // Fetch Provinces
  async function fetchProvinces() {
    setSelectState(provinceSelect, "loading", "Đang tải tỉnh/thành...");
    setSelectState(districtSelect, "disabled", "Chọn Quận/Huyện");
    setSelectState(wardSelect, "disabled", "Chọn Phường/Xã");
    try {
      const response = await fetch(`${API_BASE_URL}/p/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const provinces = await response.json();
      populateSelect(provinceSelect, provinces, "Chọn Tỉnh/Thành phố");
      provinceSelect.disabled = false;
      provinceSelect.querySelector('option[value=""]').disabled = false;
      provinceSelect.querySelector('option[value=""]').selected = true;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      showError("Không thể tải danh sách Tỉnh/Thành phố. Vui lòng thử lại.");
      setSelectState(provinceSelect, "disabled", "Lỗi tải Tỉnh/Thành");
    }
  }

  // Fetch Districts for a selected Province
  async function fetchDistricts(provinceCode) {
    if (!provinceCode) return;
    setSelectState(districtSelect, "loading", "Đang tải Quận/Huyện...");
    setSelectState(wardSelect, "disabled", "Chọn Phường/Xã");
    try {
      const response = await fetch(`${API_BASE_URL}/p/${provinceCode}?depth=2`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const provinceData = await response.json();
      populateSelect(
        districtSelect,
        provinceData.districts || [],
        "Chọn Quận/Huyện"
      );
      districtSelect.disabled = false;
      districtSelect.querySelector('option[value=""]').disabled = false;
      districtSelect.querySelector('option[value=""]').selected = true;
    } catch (error) {
      console.error("Error fetching districts:", error);
      showError("Không thể tải danh sách Quận/Huyện. Vui lòng thử lại.");
      setSelectState(districtSelect, "disabled", "Lỗi tải Quận/Huyện");
    }
  }

  // Fetch Wards for a selected District
  async function fetchWards(districtCode) {
    if (!districtCode) return;
    setSelectState(wardSelect, "loading", "Đang tải Phường/Xã...");
    try {
      const response = await fetch(`${API_BASE_URL}/d/${districtCode}?depth=2`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const districtData = await response.json();
      populateSelect(wardSelect, districtData.wards || [], "Chọn Phường/Xã");
      wardSelect.disabled = false;
      wardSelect.querySelector('option[value=""]').disabled = false;
      wardSelect.querySelector('option[value=""]').selected = true;
    } catch (error) {
      console.error("Error fetching wards:", error);
      showError("Không thể tải danh sách Phường/Xã. Vui lòng thử lại.");
      setSelectState(wardSelect, "disabled", "Lỗi tải Phường/Xã");
    }
  }

  // --- Event Listeners ---

  provinceSelect.addEventListener("change", function () {
    const selectedProvinceCode = this.value;
    setSelectState(districtSelect, "disabled", "Chọn Quận/Huyện");
    setSelectState(wardSelect, "disabled", "Chọn Phường/Xã");
    if (selectedProvinceCode) {
      fetchDistricts(selectedProvinceCode);
    }
  });

  districtSelect.addEventListener("change", function () {
    const selectedDistrictCode = this.value;
    setSelectState(wardSelect, "disabled", "Chọn Phường/Xã");
    if (selectedDistrictCode) {
      fetchWards(selectedDistrictCode);
    }
  });

  // --- MODIFIED FORM SUBMISSION ---
  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission

    const submitBtn = addressForm.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML; // Store original button content

    try {
      // Show processing state
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      submitBtn.disabled = true;
      errorDiv.style.display = "none"; // Hide previous errors

      // --- 1. Collect Raw Form Data ---
      const formData = new FormData(addressForm);
      const rawData = Object.fromEntries(formData.entries());

      // --- 2. Get Selected Text Names (Crucial for the combined address) ---
      const provinceName =
        provinceSelect.options[provinceSelect.selectedIndex]?.text;
      const districtName =
        districtSelect.options[districtSelect.selectedIndex]?.text;
      const wardName = wardSelect.options[wardSelect.selectedIndex]?.text;

      // --- 3. Basic Validation ---
      // Check required fields from the form directly
      if (
        !rawData.fullName ||
        !rawData.phone ||
        !rawData.province ||
        !rawData.district ||
        !rawData.ward ||
        !rawData.street
      ) {
        if (!rawData.province || !rawData.district || !rawData.ward) {
          throw new Error(
            "Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện, Phường/Xã."
          );
        } else {
          throw new Error("Vui lòng điền đầy đủ thông tin bắt buộc (*)!");
        }
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(rawData.phone)) {
        throw new Error("Số điện thoại không hợp lệ! Vui lòng nhập 10 chữ số.");
      }

      // Validate email format if provided
      if (rawData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawData.email)) {
          throw new Error("Email không hợp lệ!");
        }
      }

      // --- 4. Construct the Payload in the desired format ---
      const payload = {
        ten_khach_hang: rawData.fullName,
        phone: rawData.phone,
        // Combine Ward, District, Province names into 'dia_chi'
        dia_chi: `${wardName || ""}, ${districtName || ""}, ${
          provinceName || ""
        }`.replace(/^,*\s*|,*\s*$/g, ""), // Combine and trim leading/trailing commas/spaces
        // Use the 'street' input directly for 'so_nha'
        so_nha: rawData.street,
      };

      // Add email only if it exists and is valid
      if (rawData.email) {
        payload.email = rawData.email;
      }

      console.log("Dữ liệu gửi đi (Payload):", payload);

      // --- 5. Send data to API via POST request ---
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // !!! REPLACE 'YOUR_API_ENDPOINT_HERE' WITH YOUR ACTUAL API URL !!!
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

      const response = await fetch(APP_ENV.CREATE_CUSTOMER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any other headers like Authorization if needed
          // 'Authorization': 'Bearer YOUR_TOKEN'
        },
        body: JSON.stringify(payload), // Convert the payload object to a JSON string
      });

      // --- 6. Handle API Response ---
      if (!response.ok) {
        // Try to get error message from API response body
        let errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage; // Use API error message if available
        } catch (jsonError) {
          // Could not parse JSON, stick with the status text
          console.error("Could not parse error response JSON:", jsonError);
        }
        throw new Error(errorMessage); // Throw error to be caught below
      }

      // If response is OK (e.g., status 200 or 201)
      const result = await response.json(); // Assuming the API returns JSON on success
      console.log("API Response Success:", result);

      // Show success message
      alert("Lưu địa chỉ thành công!"); // Replace with a nicer notification if desired

      // --- 7. Redirect (e.g., back to cart) ---
      // Remove the localStorage saving unless specifically needed elsewhere
      // localStorage.setItem('shipping_address', JSON.stringify(payload)); // Removed as requested

      window.location.href = "../cart/cart.html"; // Adjust path if needed
    } catch (error) {
      // --- 8. Show Error Message ---
      console.error("Form Submission Error:", error);
      showError(
        error.message || "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại."
      );

      // Reset submit button to original state
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.disabled = false;
    }
  }); // End of form submit listener

  // Error display function (Keep as is)
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- Initial Load ---
  fetchProvinces(); // Load provinces on page load
}); // End DOMContentLoaded
