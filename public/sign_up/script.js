document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    const email = document.getElementById('email').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newUsername === '' || email === '' || newPassword === '' || confirmPassword === '') {
        alert('Please fill in all fields.');
    } else if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
    } else {
        alert('Sign-up successful!');
        // Redirect to login page after successful sign-up
        window.location.href = '../login/login.html';
    }
});
