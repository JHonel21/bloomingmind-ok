document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Ensure elements exist
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            // Toggle the menu visibility
            navMenu.classList.toggle('active');
        });
    }

    // Close the navigation menu when a link is clicked (for mobile screens)
    const navLinks = document.querySelectorAll('#nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });

    // Example of AJAX form submission
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
          .then(data => {
              alert("Message Sent");
          }).catch(error => {
              alert("Error sending message");
          });
    });
});