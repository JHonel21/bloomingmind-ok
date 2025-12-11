document.addEventListener('DOMContentLoaded', function () { 
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        const form = document.getElementById('contact-form');
        form.appendChild(notification);

        // Force reflow to enable animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 400); // matches transition duration
        }, 3000);
    }

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        document.querySelectorAll('#nav-menu li a').forEach(link => {
            link.addEventListener('click', function () {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }

    let windowWidth = window.innerWidth;
    window.addEventListener('resize', function () {
        windowWidth = window.innerWidth;
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = {
                name: contactForm.elements['name'].value,
                email: contactForm.elements['email'].value,
                message: contactForm.elements['message'].value,
                hasInsurance: contactForm.elements['has-insurance'].value,
                insuranceProvider: contactForm.elements['insurance-provider'].value
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
                        const insuranceField = document.getElementById('insurance-provider');
                        if (insuranceField) {
                            insuranceField.parentElement.style.display = 'none';
                        }
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

    window.addEventListener('scroll', function () {
        let scrollTop = window.scrollY;
        if (scrollTop > lastScrollTop) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
        lastScrollTop = scrollTop;
    });

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

    const insuranceSelect = document.getElementById('has-insurance');
    const insuranceField = document.getElementById('insurance-provider');
    if (insuranceSelect && insuranceField) {
        insuranceField.parentElement.style.display = 'none';
        insuranceSelect.addEventListener('change', function () {
            if (insuranceSelect.value === 'Yes') {
                insuranceField.parentElement.style.display = 'block';
                insuranceField.required = true;
            } else {
                insuranceField.parentElement.style.display = 'none';
                insuranceField.required = false;
            }
        });
    }
});
