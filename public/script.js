document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');

        const text = document.createElement('span');
        text.textContent = message;
        notification.appendChild(text);

        function dismiss() {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        }

        if (type === 'error') {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', dismiss);
            notification.appendChild(closeBtn);
        }

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        if (type === 'success') {
            setTimeout(dismiss, 3500);
        }
        // errors stay until the close button is clicked
    }

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            const isOpen = navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.querySelectorAll('#nav-menu li a').forEach(link => {
            link.addEventListener('click', function () {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
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

    if (header) {
        window.addEventListener('scroll', function () {
            let scrollTop = window.scrollY;
            if (scrollTop > lastScrollTop) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
            lastScrollTop = scrollTop;
        });
    }

    // Header height is used by sticky sub-nav and team anchor offsets
    if (header) {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
        window.addEventListener('resize', function () {
            document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (!targetElement) {
                return; // let the browser handle plain "#" or missing targets
            }
            e.preventDefault();
            const headerOffset = header ? header.offsetHeight : 80;
            window.scrollTo({
                top: targetElement.getBoundingClientRect().top + window.scrollY - headerOffset - 12,
                behavior: 'smooth',
            });
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

    // ------------------------------------------------------------
    // Scroll-reveal, gated behind prefers-reduced-motion and
    // IntersectionObserver support so it degrades gracefully.
    // ------------------------------------------------------------
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealTargets = document.querySelectorAll('.reveal');

    if (revealTargets.length) {
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            revealTargets.forEach(el => el.classList.add('is-visible'));
        } else {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

            revealTargets.forEach(el => revealObserver.observe(el));
        }
    }

    // ------------------------------------------------------------
    // Sticky sub-nav active-section highlighting (services.html)
    // ------------------------------------------------------------
    const subNav = document.querySelector('.sub-nav');
    if (subNav) {
        const subNavLinks = Array.from(subNav.querySelectorAll('a[href^="#"]'));
        const sections = subNavLinks
            .map(link => document.getElementById(link.getAttribute('href').substring(1)))
            .filter(Boolean);

        if (sections.length && 'IntersectionObserver' in window) {
            const setActive = (id) => {
                subNavLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            };

            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActive(entry.target.id);
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

            sections.forEach(section => sectionObserver.observe(section));
        }
    }
});