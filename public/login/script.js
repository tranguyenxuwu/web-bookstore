const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Debug request
    console.log('Sending login request:', { username, password });

    try {
        const response = await fetch('http://localhost/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        console.log('Server response:', data); // Debug response

        if (!response.ok) {
            if (response.status === 422) {
                const errorMessage = data.errors ? 
                    Object.values(data.errors).flat().join(', ') : 
                    data.message || 'Validation failed';
                throw new Error(errorMessage);
            }
            throw new Error('Login failed');
        }

        if (data.status && data.data) {
            localStorage.setItem('user', JSON.stringify(data.data.user));
            localStorage.setItem('token', data.data.token);
            
            if (data.data.user.is_admin === 1) {
                window.location.href = '/admin/dashboard/index.html';
            } else {
                window.location.href = '../index/index.html';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }
});