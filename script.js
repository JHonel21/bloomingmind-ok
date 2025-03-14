document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const contactForm = document.getElementById('contact-form'); // Ensure the form exists

    // Notification function for form submission feedback
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // Close menu when clicking a link (for mobile)
        document.querySelectorAll('#nav-menu li a').forEach(link => {
            link.addEventListener('click', function () {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    // Contact form submission
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then(response => {
                    if (response.ok) {
                        showNotification('Message Sent Successfully!', 'success');
                        contactForm.reset();
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