// Shared helpers. Declared at the top level (not inside DOMContentLoaded) and
// exposed on window.BM so programs.js can reuse the same notification and
// Turnstile behavior as the contact form.
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
        closeBtn.textContent = '\u00d7';
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

// Turnstile helpers. Pages can hold more than one widget, so the token
// is always read from, and the reset always aimed at, the form being
// submitted. A page-wide querySelector would grab whichever widget comes
// first in the DOM.
function getTurnstileToken(form) {
    const field = form.querySelector('[name="cf-turnstile-response"]');
    return field ? field.value : '';
}

function resetTurnstile(form) {
    const widget = form.querySelector('.cf-turnstile');
    if (window.turnstile && widget) {
        try {
            window.turnstile.reset(widget);
        } catch (error) {
            // Widget not rendered yet. Nothing to reset.
        }
    }
}

window.BM = { showNotification, getTurnstileToken, resetTurnstile };

document.addEventListener('DOMContentLoaded', function () { 
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const header = document.querySelector('header');
    let lastScrollTop = 0;

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

    // ===========================
    // Nav dropdowns (About, Groups/Intensives/CEUs). Click-toggle only, no hover behavior, to avoid
    // the double-tap-to-navigate issue hover menus cause on touch devices)
    // ===========================
    document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
        const dropdown = toggle.closest('.nav-dropdown');
        if (!dropdown) return;

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            // Close any other open dropdown first so only one menu shows at a time.
            document.querySelectorAll('.nav-dropdown.open').forEach((other) => {
                if (other !== dropdown) {
                    other.classList.remove('open');
                    const otherToggle = other.querySelector('.nav-dropdown-toggle');
                    if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
                }
            });
            const isOpen = dropdown.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });

    document.querySelectorAll('.nav-submenu a').forEach((link) => {
        link.addEventListener('click', function () {
            const dropdown = link.closest('.nav-dropdown');
            if (!dropdown) return;
            dropdown.classList.remove('open');
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', function (event) {
        document.querySelectorAll('.nav-dropdown.open').forEach((dropdown) => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
                const toggle = dropdown.querySelector('.nav-dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.nav-dropdown.open').forEach((dropdown) => {
                dropdown.classList.remove('open');
                const toggle = dropdown.querySelector('.nav-dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        }
    });

    let windowWidth = window.innerWidth;
    window.addEventListener('resize', function () {
        windowWidth = window.innerWidth;
    });

    // ===========================
    // Scroll reveal for .reveal sections (progressively enhanced)
    // ===========================
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

            revealEls.forEach((el) => revealObserver.observe(el));
        } else {
            // No IntersectionObserver support: show everything immediately
            // rather than leaving sections stuck invisible.
            revealEls.forEach((el) => el.classList.add('is-visible'));
        }
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = {
                name: contactForm.elements['name'].value,
                email: contactForm.elements['email'].value,
                message: contactForm.elements['message'].value,
                hasInsurance: contactForm.elements['has-insurance'].value,
                insuranceProvider: contactForm.elements['insurance-provider'].value,
                botField: contactForm.elements['bot-field'].value,
                turnstileToken: getTurnstileToken(contactForm)
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
                        resetTurnstile(contactForm);
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
                    resetTurnstile(contactForm);
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
