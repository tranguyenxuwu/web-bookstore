document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const errorDiv = document.getElementById('error-message');
  
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        username: document.getElementById('newUsername').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('newPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value
      };
  
      // Validate
      if (!Object.values(formData).every(Boolean)) {
        showError('Vui lòng điền đầy đủ thông tin!');
        return;
      }
  
      if (formData.password !== formData.confirmPassword) {
        showError('Mật khẩu xác nhận không khớp!');
        return;
      }
  
      try {
        const response = await fetch(APP_ENV.REGISTER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
  
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message || 'Đăng ký thất bại');
        
        // Xử lý thành công
        window.location.href = '../login/login.html?newUser=true';
      } catch (err) {
        showError(err.message);
      }
    });
  
    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
  });