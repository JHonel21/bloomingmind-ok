document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Close the mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('#nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });

    // Handle form submission with validation and user feedback
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            const formStatus = document.getElementById('form-status');

            formStatus.textContent = '';

            // Form validation
            if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
                formStatus.textContent = 'Please fill in all fields.';
                formStatus.style.color = 'red';
                return;
            }

            // Simulate form submission
            formStatus.textContent = `Thank you for your message, ${name}! We will get back to you shortly.`;
            formStatus.style.color = 'green';

            form.reset();
        });
    }
});