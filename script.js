document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Custom notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Ensure elements exist
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            // Toggle the menu visibility and the icon (hamburger/close)
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Cache window width and update on resize
    let windowWidth = window.innerWidth;
    window.addEventListener('resize', function () {
        windowWidth = window.innerWidth;
    });

    // Close the navigation menu when a link is clicked (for mobile screens)
    const navLinks = document.querySelectorAll('#nav-menu li a');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Gather form data
            const formData = {
                name: contactForm.elements['name'].value,
                email: contactForm.elements['email'].value,
                message: contactForm.elements['message'].value,
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
                        showNotification('Message Sent Successfully!', 'success');
                        contactForm.reset(); // Reset form after successful submission
                    } else {
                        return response.text().then(text => {
                            throw new Error(text || 'Error sending message');
                        });
                    }
                })
                .catch(error => {
                    showNotification(`Failed to send message: ${error.message}`, 'error');
                });
        });
    }
});