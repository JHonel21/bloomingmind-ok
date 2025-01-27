document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Ensure elements exist
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            // Toggle the menu visibility
            navMenu.classList.toggle('active');
        });
    }

    // Close the navigation menu when a link is clicked (for mobile screens)
    const navLinks = document.querySelectorAll('#nav-menu li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768) { // Close the menu only for mobile
                navMenu.classList.remove('active');
            }
        });
    });

    // AJAX form submission for the contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent default form submission

            // Gather form data
            const formData = {
                name: this.name.value,
                email: this.email.value,
                message: this.message.value,
            };

            // Send the data using fetch
            fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
                .then(response => {
                    if (response.ok) {
                        alert('Message Sent Successfully!');
                        this.reset(); // Reset form after successful submission
                    } else {
                        return response.text().then(text => {
                            throw new Error(text || 'Error sending message');
                        });
                    }
                })
                .catch(error => {
                    alert(`Failed to send message: ${error.message}`);
                });
        });
    }
});