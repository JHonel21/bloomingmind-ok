// Toggle navigation menu on small screens
document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

// Handle form submission
document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Simulate form submission and display status
    document.getElementById('form-status').textContent = 'Thank you for your message, ' + name + '! We will get back to you shortly.';
    document.getElementById('contact-form').reset();
});
