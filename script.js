document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const topNav = document.getElementById('myTopnav');

    // Toggle the menu visibility when the hamburger icon is clicked
    menuToggle.addEventListener('click', function() {
        topNav.classList.toggle('responsive');
        console.log('Menu toggled');
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