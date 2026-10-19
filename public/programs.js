// Group Programs + 8-Hour Intensives pages.
// Both pages are driven by JSON catalogs in /data so staff can add or change
// programs without touching HTML. Depends on window.BM from script.js.
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const BM = window.BM || {};
    const INQUIRY_ENDPOINT = '/.netlify/functions/send-program-inquiry';
    const GENERAL_GROUP_ID = 'general-groups';
    const ANY_DATE = 'any';
    const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // ---------------------------
    // Small helpers
    // ---------------------------
    function h(tag, options, children) {
        const node = document.createElement(tag);
        const opts = options || {};
        if (opts.className) node.className = opts.className;
        if (opts.text !== undefined) node.textContent = opts.text;
        if (opts.attrs) {
            Object.keys(opts.attrs).forEach((key) => node.setAttribute(key, opts.attrs[key]));
        }
        (children || []).forEach((child) => child && node.appendChild(child));
        return node;
    }

    function metaItem(label, value) {
        if (!value) return null;
        return h('li', {}, [h('strong', { text: label + ': ' }), document.createTextNode(value)]);
    }

    function parseLocalDate(str) {
        // Parse as a local date (not UTC) so the displayed day doesn't shift.
        const [year, month, day] = String(str).split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDate(str, long) {
        return parseLocalDate(str).toLocaleDateString('en-US', long
            ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
            : { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function startOfToday() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function smoothScrollTo(node) {
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }

    function loadJson(path) {
        return fetch(path, { cache: 'no-cache' }).then((response) => {
            if (!response.ok) throw new Error('Could not load ' + path);
            return response.json();
        });
    }

    function setOptions(select, options, selectedValue) {
        select.innerHTML = '';
        options.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });
        if (selectedValue !== undefined) select.value = selectedValue;
    }

    // Wires up a program inquiry form: validation is native (required
    // attributes), submission goes to the shared function.
    function wireInquiryForm(config) {
        const { form, button, responseEl, idleLabel, successText, buildPayload, afterReset } = config;

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            button.disabled = true;
            button.textContent = 'Sending...';
            responseEl.textContent = '';
            responseEl.className = 'inquiry-response';

            fetch(INQUIRY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPayload(form)),
            })
                .then((response) => {
                    if (response.ok) {
                        form.reset();
                        if (BM.resetTurnstile) BM.resetTurnstile(form);
                        if (afterReset) afterReset();
                        responseEl.textContent = successText;
                        responseEl.className = 'inquiry-response success';
                        if (BM.showNotification) BM.showNotification('Inquiry Sent Successfully!', 'success');
                    } else {
                        return response.text().then((text) => {
                            throw new Error(text || 'Error sending inquiry');
                        });
                    }
                })
                .catch((error) => {
                    responseEl.textContent = error.message;
                    responseEl.className = 'inquiry-response error';
                    if (BM.showNotification) BM.showNotification('Failed to send inquiry: ' + error.message, 'error');
                    if (BM.resetTurnstile) BM.resetTurnstile(form);
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = idleLabel;
                });
        });
    }

    function basePayload(form) {
        return {
            program: form.elements['program'].value,
            name: form.elements['name'].value,
            email: form.elements['email'].value,
            phone: form.elements['phone'].value,
            message: form.elements['message'].value,
            consent: form.elements['privacy'].checked && form.elements['terms'].checked,
            botField: form.elements['botField'].value,
            turnstileToken: BM.getTurnstileToken ? BM.getTurnstileToken(form) : '',
        };
    }

    function preselectFromQuery(select) {
        const wanted = new URLSearchParams(window.location.search).get('program');
        if (wanted && Array.from(select.options).some((o) => o.value === wanted)) {
            select.value = wanted;
            select.dispatchEvent(new Event('change'));
        }
    }

    // ===========================
    // Group Programs page
    // ===========================
    const groupsGrid = document.getElementById('groups-grid');
    if (groupsGrid) initGroups();

    function initGroups() {
        const statusEl = document.getElementById('groups-status');
        const filtersEl = document.getElementById('groups-filters');
        const countEl = document.getElementById('groups-count');
        const form = document.getElementById('group-form');
        const programSelect = document.getElementById('group-program');
        const scheduleNote = document.getElementById('group-schedule-note');
        const submitBtn = document.getElementById('group-submit-btn');
        const responseEl = document.getElementById('group-form-response');

        const STATUS = {
            'open': { label: 'Accepting participants', cta: "I'm Interested" },
            'forming': { label: 'Forming: interest list open', cta: 'Join Interest List' },
            'full': { label: 'Full: waitlist open', cta: 'Join Waitlist' },
            'coming-soon': { label: 'Coming soon', cta: 'Notify Me' },
        };

        let programs = [];
        const state = { category: 'all', day: 'all' };

        function daysOf(program) {
            if (Array.isArray(program.day)) return program.day;
            return program.day ? [program.day] : [];
        }

        function selectProgram(id) {
            programSelect.value = id;
            programSelect.dispatchEvent(new Event('change'));
            smoothScrollTo(document.getElementById('group-inquiry'));
            programSelect.focus({ preventScroll: true });
        }

        function renderCard(program) {
            const status = STATUS[program.status] || STATUS.open;

            const top = h('div', { className: 'program-card-top' }, [
                h('span', { className: 'status-badge status-' + (STATUS[program.status] ? program.status : 'open'), text: status.label }),
                program.category ? h('span', { className: 'program-category', text: program.category }) : null,
            ]);

            const meta = h('ul', { className: 'program-meta' }, [
                metaItem('For', program.audience),
                metaItem('Format', program.format),
                metaItem('Led by', program.facilitator),
                program.startDate ? metaItem('Starts', formatDate(program.startDate, false)) : null,
                metaItem('Cost', program.cost),
            ]);

            let action;
            if (program.signupUrl && program.status === 'open') {
                action = h('a', {
                    className: 'cta-button program-cta',
                    text: 'Sign Up',
                    attrs: { href: program.signupUrl, target: '_blank', rel: 'noopener noreferrer' },
                });
            } else {
                action = h('button', { className: 'cta-button program-cta', text: status.cta, attrs: { type: 'button' } });
                action.addEventListener('click', () => selectProgram(program.id));
            }

            return h('article', { className: 'program-card', attrs: { id: 'group-' + program.id } }, [
                top,
                h('h3', { text: program.title }),
                program.schedule ? h('p', { className: 'program-schedule', text: program.schedule }) : null,
                program.summary ? h('p', { className: 'program-summary', text: program.summary }) : null,
                meta,
                action,
            ]);
        }

        function visiblePrograms() {
            return programs.filter((p) =>
                (state.category === 'all' || p.category === state.category) &&
                (state.day === 'all' || daysOf(p).includes(state.day))
            );
        }

        function renderGrid() {
            const shown = visiblePrograms();
            groupsGrid.innerHTML = '';

            if (!shown.length) {
                const empty = h('div', { className: 'programs-empty' }, [
                    h('p', { text: 'No groups match those filters.' }),
                ]);
                const reset = h('button', { className: 'link-button', text: 'Show all groups', attrs: { type: 'button' } });
                reset.addEventListener('click', () => {
                    state.category = 'all';
                    state.day = 'all';
                    buildFilters();
                    renderGrid();
                });
                empty.appendChild(reset);
                groupsGrid.appendChild(empty);
            } else {
                shown.forEach((p) => groupsGrid.appendChild(renderCard(p)));
            }

            countEl.textContent = programs.length > 1
                ? 'Showing ' + shown.length + ' of ' + programs.length + ' groups'
                : '';
        }

        function buildFilters() {
            filtersEl.innerHTML = '';
            const categories = Array.from(new Set(programs.map((p) => p.category).filter(Boolean)));
            const days = DAY_ORDER.filter((d) => programs.some((p) => daysOf(p).includes(d)));

            if (categories.length > 1) {
                const group = h('div', { className: 'filter-chips', attrs: { role: 'group', 'aria-label': 'Filter by topic' } });
                ['all'].concat(categories).forEach((cat) => {
                    const chip = h('button', {
                        className: 'filter-chip',
                        text: cat === 'all' ? 'All' : cat,
                        attrs: { type: 'button', 'aria-pressed': state.category === cat ? 'true' : 'false' },
                    });
                    chip.addEventListener('click', () => {
                        state.category = cat;
                        buildFilters();
                        renderGrid();
                    });
                    group.appendChild(chip);
                });
                filtersEl.appendChild(group);
            }

            if (days.length > 1) {
                const select = h('select', { attrs: { id: 'groups-day-filter' } });
                setOptions(select, [{ value: 'all', label: 'Any day' }].concat(days.map((d) => ({ value: d, label: d }))), state.day);
                select.addEventListener('change', () => {
                    state.day = select.value;
                    renderGrid();
                });
                filtersEl.appendChild(h('div', { className: 'filter-day' }, [
                    h('label', { text: 'Day', attrs: { for: 'groups-day-filter' } }),
                    select,
                ]));
            }

            filtersEl.hidden = !filtersEl.children.length;
        }

        function buildFormOptions() {
            const options = [{ value: '', label: '-- Please Select --' }];
            programs.forEach((p) => options.push({ value: p.id, label: p.title }));
            options.push({ value: GENERAL_GROUP_ID, label: "Not sure yet, tell me about all group options" });
            setOptions(programSelect, options, '');
        }

        function updateScheduleNote() {
            const program = programs.find((p) => p.id === programSelect.value);
            if (!program) {
                scheduleNote.textContent = '';
                return;
            }
            scheduleNote.textContent = [program.schedule, program.format].filter(Boolean).join(' | ');
        }

        programSelect.addEventListener('change', updateScheduleNote);

        wireInquiryForm({
            form,
            button: submitBtn,
            responseEl,
            idleLabel: 'Send Inquiry',
            successText: 'Thank you. We received your inquiry and will be in touch about next steps.',
            buildPayload: basePayload,
            afterReset: updateScheduleNote,
        });

        loadJson('data/programs.json')
            .then((data) => {
                programs = (Array.isArray(data) ? data : []).filter((p) => p && p.id && p.title && p.status !== 'hidden');
            })
            .catch(() => {
                programs = [];
            })
            .then(() => {
                buildFormOptions();
                if (!programs.length) {
                    statusEl.textContent = 'New group programs are being added. Use the form below to tell us what you are interested in and we will reach out as soon as groups open.';
                    return;
                }
                statusEl.hidden = true;
                buildFilters();
                renderGrid();
                groupsGrid.hidden = false;
                preselectFromQuery(programSelect);
            });
    }

    // ===========================
    // 8-Hour Intensives page
    // ===========================
    const intensivesGrid = document.getElementById('intensives-grid');
    if (intensivesGrid) initIntensives();

    function initIntensives() {
        const statusEl = document.getElementById('intensives-status');
        const form = document.getElementById('intensive-form');
        const programSelect = document.getElementById('intensive-program');
        const dateSelect = document.getElementById('intensive-date');
        const submitBtn = document.getElementById('intensive-submit-btn');
        const responseEl = document.getElementById('intensive-form-response');

        let intensives = [];

        function upcomingDates(intensive) {
            const today = startOfToday();
            return (Array.isArray(intensive.dates) ? intensive.dates : [])
                .filter((d) => d && d.date && parseLocalDate(d.date) >= today)
                .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
        }

        function dateLabel(d) {
            return [formatDate(d.date, true), d.time, d.format].filter(Boolean).join(' | ');
        }

        function selectIntensive(id) {
            programSelect.value = id;
            programSelect.dispatchEvent(new Event('change'));
            smoothScrollTo(document.getElementById('intensive-inquiry'));
            programSelect.focus({ preventScroll: true });
        }

        function renderCard(intensive) {
            const dates = upcomingDates(intensive);

            const datesBlock = h('div', { className: 'intensive-dates' }, [
                h('h4', { text: dates.length ? 'Upcoming dates' : 'Dates' }),
            ]);
            if (dates.length) {
                const list = h('ul', {});
                dates.forEach((d) => list.appendChild(h('li', { text: dateLabel(d) })));
                datesBlock.appendChild(list);
            } else {
                datesBlock.appendChild(h('p', { text: 'Next dates will be announced soon. Request a consult and we will reach out as soon as they are set.' }));
            }

            const actions = h('div', { className: 'program-actions' });
            const request = h('button', { className: 'cta-button program-cta', text: 'Request a Consult', attrs: { type: 'button' } });
            request.addEventListener('click', () => selectIntensive(intensive.id));
            actions.appendChild(request);
            if (intensive.detailId && document.getElementById(intensive.detailId)) {
                actions.appendChild(h('a', { className: 'text-link', text: 'Learn more', attrs: { href: '#' + intensive.detailId } }));
            }

            const meta = h('ul', { className: 'program-meta' }, [
                metaItem('For', intensive.audience),
                metaItem('Led by', intensive.facilitator),
                metaItem('Investment', intensive.price),
            ]);

            return h('article', { className: 'program-card' }, [
                h('h3', { text: intensive.title }),
                intensive.tagline ? h('p', { className: 'program-summary', text: intensive.tagline }) : null,
                meta,
                datesBlock,
                actions,
            ]);
        }

        function updateDateOptions() {
            const intensive = intensives.find((i) => i.id === programSelect.value);
            if (!intensive) {
                setOptions(dateSelect, [{ value: '', label: 'Select an intensive first' }], '');
                dateSelect.disabled = true;
                return;
            }
            const options = [{ value: ANY_DATE, label: 'No preference, notify me of future dates' }];
            upcomingDates(intensive).forEach((d) => options.push({ value: d.date, label: dateLabel(d) }));
            setOptions(dateSelect, options, ANY_DATE);
            dateSelect.disabled = false;
        }

        programSelect.addEventListener('change', updateDateOptions);

        // Any link or button marked data-select-program preselects that intensive
        // in the form (used by the CTA inside each detail section).
        document.querySelectorAll('[data-select-program]').forEach((trigger) => {
            trigger.addEventListener('click', () => {
                programSelect.value = trigger.getAttribute('data-select-program');
                programSelect.dispatchEvent(new Event('change'));
            });
        });

        wireInquiryForm({
            form,
            button: submitBtn,
            responseEl,
            idleLabel: 'Send Inquiry',
            successText: 'Thank you. We received your inquiry and will be in touch to schedule a consult.',
            buildPayload: function (f) {
                const payload = basePayload(f);
                payload.preferredFormat = f.elements['preferredFormat'].value;
                payload.preferredDate = f.elements['preferredDate'].value;
                return payload;
            },
            afterReset: updateDateOptions,
        });

        loadJson('data/intensives.json')
            .then((data) => {
                intensives = (Array.isArray(data) ? data : []).filter((i) => i && i.id && i.title);
            })
            .catch(() => {
                intensives = [];
            })
            .then(() => {
                if (!intensives.length) {
                    statusEl.textContent = 'Intensive details are loading slowly. Please refresh, or contact us for upcoming dates.';
                    return;
                }
                setOptions(programSelect, [{ value: '', label: '-- Please Select --' }].concat(
                    intensives.map((i) => ({ value: i.id, label: i.title }))), '');
                statusEl.hidden = true;
                intensivesGrid.innerHTML = '';
                intensives.forEach((i) => intensivesGrid.appendChild(renderCard(i)));
                intensivesGrid.hidden = false;
                updateDateOptions();
                preselectFromQuery(programSelect);
            });
    }
});
