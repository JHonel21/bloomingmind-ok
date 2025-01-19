document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Ensure elements exist
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            // Toggle the menu visibility
            navMenu.classList.toggle('active');
            console.log('Menu toggled');
        });
    } else {
        console.log('Menu toggle or nav menu not found');
    }

    // Close the navigation menu when a link is clicked (for mobile screens)
    const navLinks = document.querySelectorAll('#nav-menu a'); // Fixed this line
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            console.log('Menu closed');
        });
    });
});