// Toggle navigation menu on small screens
document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('active');
});

// Close the navigation menu when a link is clicked (for mobile screens)
const navLinks = document.querySelectorAll('#nav-menu .nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('nav-menu').classList.remove('active');
    });
});

// Handle form submission with validation and user feedback
document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const formStatus = document.getElementById('form-status');

    // Clear previous form status
    formStatus.textContent = '';

    // Form validation
    if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
        formStatus.textContent = 'Please fill in all fields.';
        formStatus.style.color = 'red';
        return; // Prevent submission if validation fails
    }

    // Simulate form submission and display success message
    formStatus.textContent = `Thank you for your message, ${name}! We will get back to you shortly.`;
    formStatus.style.color = 'green';

    // Optionally reset the form
    document.getElementById('contact-form').reset();
});