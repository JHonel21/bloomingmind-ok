document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const header = document.querySelector('header');
    let lastScrollTop = 0;

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
        // Toggle menu visibility and hamburger X animation
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

    // Cache window width and update on resize
    let windowWidth = window.innerWidth;
    window.addEventListener('resize', function () {
        windowWidth = window.innerWidth;
    });

    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = {
                name: contactForm.elements['name'].value,
                email: contactForm.elements['email'].value,
                message: contactForm.elements['message'].value,
            };

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

    // Sticky Header
    window.addEventListener('scroll', function () {
        let scrollTop = window.scrollY;
        if (scrollTop > lastScrollTop) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
        lastScrollTop = scrollTop;
    });

    // Smooth anchor scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth',
                });
            }
        });
    });
});