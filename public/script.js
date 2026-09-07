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

    // ===========================
    // Services dropdown (click-toggle only, no hover behavior, to avoid
    // the double-tap-to-navigate issue hover menus cause on touch devices)
    // ===========================
    document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
        const dropdown = toggle.closest('.nav-dropdown');
        if (!dropdown) return;

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
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
                turnstileToken: document.querySelector('[name="cf-turnstile-response"]')?.value || ''
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
                        if (window.turnstile) {
                            turnstile.reset();
                        }
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
                    if (window.turnstile) {
                        turnstile.reset();
                    }
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

    // ===========================
    // Programs page: assessment/class booking
    // ===========================
    const programsGrid = document.getElementById('programs-grid');
    if (programsGrid) {
        const statusEl = document.getElementById('programs-status');
        const modal = document.getElementById('booking-modal');
        const modalSubtitle = document.getElementById('booking-modal-subtitle');
        const bookingForm = document.getElementById('booking-form');
        const sessionIdField = document.getElementById('booking-session-id');
        const submitBtn = document.getElementById('booking-submit-btn');
        const responseEl = document.getElementById('booking-form-response');

        function formatSessionDate(dateStr) {
            // Parse as a local date (not UTC) so the displayed day doesn't shift.
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        }

        function renderIndividualCard(session) {
            const card = document.createElement('div');
            card.className = 'program-card';
            card.innerHTML = `
                <h3>${session.title}</h3>
                <p>${session.description}</p>
                <ul class="program-meta">
                    <li><strong>Format:</strong> ${session.format}</li>
                    <li><strong>Length:</strong> ${session.durationLabel}</li>
                </ul>
                <a class="cta-button program-cta" href="${session.calendarUrl}" target="_blank" rel="noopener noreferrer">Schedule an Assessment</a>
            `;
            return card;
        }

        function renderClassCard(session) {
            const card = document.createElement('div');
            card.className = 'program-card';

            const seatsLabel = session.full
                ? 'Session full'
                : `${session.seatsRemaining} of ${session.capacity} spots remaining`;
            const seatsClass = session.full ? 'seats-badge seats-full' : 'seats-badge';

            card.innerHTML = `
                <h3>${session.title}</h3>
                <p>${session.description}</p>
                <ul class="program-meta">
                    <li><strong>Date:</strong> ${formatSessionDate(session.date)}</li>
                    <li><strong>Time:</strong> ${session.time}</li>
                    <li><strong>Format:</strong> ${session.format}</li>
                </ul>
                <span class="${seatsClass}">${seatsLabel}</span>
            `;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cta-button program-cta';
            button.textContent = session.full ? 'Join Waitlist' : 'Reserve a Spot';
            button.addEventListener('click', function () {
                openBookingModal(session);
            });

            card.appendChild(button);
            return card;
        }

        function renderPrograms(sessions) {
            programsGrid.innerHTML = '';
            sessions.forEach((session) => {
                const card = session.type === 'individual'
                    ? renderIndividualCard(session)
                    : renderClassCard(session);
                programsGrid.appendChild(card);
            });
            programsGrid.hidden = false;
            statusEl.hidden = true;
        }

        function openBookingModal(session) {
            sessionIdField.value = session.id;

            modalSubtitle.textContent = session.full
                ? `${session.title} on ${formatSessionDate(session.date)} is currently full. Submit this form to be added to the waitlist.`
                : `${session.title} — ${formatSessionDate(session.date)}, ${session.time}`;

            responseEl.textContent = '';
            responseEl.className = '';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Reservation';
            bookingForm.reset();
            sessionIdField.value = session.id;

            // Turnstile tokens are single-use and short-lived. Reset the
            // widget whenever the modal opens so there's always a fresh
            // token to submit, whether this is the first attempt or a retry.
            if (window.turnstile) {
                window.turnstile.reset();
            }

            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        }

        function closeBookingModal() {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        }

        document.querySelectorAll('[data-close-modal]').forEach((el) => {
            el.addEventListener('click', closeBookingModal);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !modal.hidden) {
                closeBookingModal();
            }
        });

        bookingForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const payload = {
                sessionId: sessionIdField.value,
                name: bookingForm.elements['name'].value,
                email: bookingForm.elements['email'].value,
                phone: bookingForm.elements['phone'].value,
                notes: bookingForm.elements['notes'].value,
                botField: bookingForm.elements['botField'].value,
                turnstileToken: document.querySelector('[name="cf-turnstile-response"]')?.value || ''
            };

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            responseEl.textContent = '';
            responseEl.className = '';

            fetch('/.netlify/functions/book-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
                .then((response) => {
                    if (response.ok) {
                        responseEl.textContent = "You're confirmed! Check your email for details.";
                        responseEl.className = 'booking-response success';
                        submitBtn.textContent = 'Reserved';
                        loadPrograms(); // refresh seat counts in the background
                        setTimeout(closeBookingModal, 2500);
                    } else {
                        return response.text().then((text) => {
                            throw new Error(text || 'Something went wrong. Please try again.');
                        });
                    }
                })
                .catch((error) => {
                    responseEl.textContent = error.message;
                    responseEl.className = 'booking-response error';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm Reservation';
                    if (window.turnstile) {
                        window.turnstile.reset();
                    }
                });
        });

        function loadPrograms() {
            fetch('/.netlify/functions/get-sessions')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Unable to load current availability.');
                    }
                    return response.json();
                })
                .then(renderPrograms)
                .catch(() => {
                    statusEl.textContent = 'Group classes coming soon!';
                });
        }

        loadPrograms();
    }
});