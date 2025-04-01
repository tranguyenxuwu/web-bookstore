// Import env variables
import { APP_ENV } from '../assets/script/env.js';

document.addEventListener('DOMContentLoaded', () => {
  // Page loading animation
  const pageTransition = document.querySelector('.page-transition');
  if (pageTransition) {
    setTimeout(() => {
      pageTransition.style.opacity = '0';
      setTimeout(() => {
        pageTransition.style.display = 'none';
      }, 500);
    }, 800);
  }

  // Setup search
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput ? searchInput.value.trim() : '';
      window.location.href = `../search.html?title=${encodeURIComponent(searchTerm)}`;
    });
  }

  const addressForm = document.getElementById('addressForm');
  const provinceSelect = document.getElementById('province');
  const districtSelect = document.getElementById('district');
  const wardSelect = document.getElementById('ward');
  const errorDiv = document.getElementById('error-message');
  
  // Handle province selection
  provinceSelect.addEventListener('change', function() {
    // Reset district and ward
    districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    wardSelect.disabled = true;
    
    if (this.value) {
      districtSelect.disabled = false;
      loadDistricts(this.value);
    } else {
      districtSelect.disabled = true;
    }
  });
  
  // Handle district selection
  districtSelect.addEventListener('change', function() {
    // Reset ward
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    
    if (this.value) {
      wardSelect.disabled = false;
      loadWards(this.value);
    } else {
      wardSelect.disabled = true;
    }
  });
  
  // Handle form submission
  addressForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Show processing state
      const submitBtn = addressForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      submitBtn.disabled = true;
      
      // Collect form data
      const formData = new FormData(addressForm);
      const addressData = Object.fromEntries(formData.entries());
      
      // Validation
      if (!addressData.fullName || !addressData.phone || !addressData.province || 
          !addressData.district || !addressData.ward || !addressData.street) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc!');
      }
      
      // Validate phone number
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(addressData.phone)) {
        throw new Error('Số điện thoại không hợp lệ! Vui lòng nhập 10 chữ số.');
      }
      
      // Validate email if provided
      if (addressData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(addressData.email)) {
          throw new Error('Email không hợp lệ!');
        }
      }
      
      // Send data to API - will be replaced with actual API call
      console.log('Dữ liệu địa chỉ:', addressData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for cart integration
      localStorage.setItem('shipping_address', JSON.stringify(addressData));
      
      // Show success message
      alert('Lưu địa chỉ thành công!');
      
      // Redirect back to cart page or continue to payment
      window.location.href = './cart/cart.html';
      
    } catch (error) {
      // Show error
      showError(error.message);
      
      // Reset submit button
      const submitBtn = addressForm.querySelector('button[type="submit"]');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
  
  // Error display function
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
    
    // Scroll to top to show error
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  // Load districts function (mock data)
  function loadDistricts(provinceCode) {
    // In real implementation, this would be an API call
    const districts = {
      'HCM': [
        {code: 'Q1', name: 'Quận 1'},
        {code: 'Q2', name: 'Quận 2'},
        {code: 'Q3', name: 'Quận 3'},
        {code: 'Q4', name: 'Quận 4'},
        {code: 'Q5', name: 'Quận 5'}
      ],
      'HN': [
        {code: 'HK', name: 'Quận Hoàn Kiếm'},
        {code: 'BD', name: 'Quận Ba Đình'},
        {code: 'BTL', name: 'Quận Bắc Từ Liêm'},
        {code: 'CG', name: 'Quận Cầu Giấy'}
      ],
      'DN': [
        {code: 'HC', name: 'Quận Hải Châu'},
        {code: 'TK', name: 'Quận Thanh Khê'},
        {code: 'LS', name: 'Quận Liên Chiểu'}
      ]
    };
    
    // Add options to select
    if (districts[provinceCode]) {
      districts[provinceCode].forEach(district => {
        const option = document.createElement('option');
        option.value = district.code;
        option.textContent = district.name;
        districtSelect.appendChild(option);
      });
    }
  }
  
  // Load wards function (mock data)
  function loadWards(districtCode) {
    // In real implementation, this would be an API call
    const wards = {
      'Q1': [
        {code: 'BN', name: 'Phường Bến Nghé'},
        {code: 'BT', name: 'Phường Bến Thành'},
        {code: 'DN', name: 'Phường Đa Kao'}
      ],
      'HK': [
        {code: 'CG', name: 'Phường Chương Dương'},
        {code: 'HG', name: 'Phường Hàng Bạc'},
        {code: 'HK', name: 'Phường Hàng Bài'}
      ]
    };
    
    // Add options to select
    if (wards[districtCode]) {
      wards[districtCode].forEach(ward => {
        const option = document.createElement('option');
        option.value = ward.code;
        option.textContent = ward.name;
        wardSelect.appendChild(option);
      });
    }
  }
});