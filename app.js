(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  // -----------------------------
  // Mobile navigation
  // -----------------------------
  const menuButton = $('#menu');
  const navigation = $('#siteNav');

  menuButton?.addEventListener('click', () => {
    const open = navigation.classList.toggle('mobileOpen');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  navigation?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navigation.classList.remove('mobileOpen');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Open navigation');
    });
  });

  // -----------------------------
  // Merit badge search/filter
  // -----------------------------
  const search = $('#search');
  const badges = $$('.badge');
  const filters = $$('.filter');
  const noBadges = $('#noBadges');
  let activeFilter = 'all';

  function updateBadges() {
    const query = (search?.value || '').trim().toLowerCase();
    let visible = 0;

    badges.forEach((badge) => {
      const matchesText = badge.textContent.toLowerCase().includes(query);
      const matchesFilter = activeFilter === 'all' || badge.dataset.cat === activeFilter;
      const show = matchesText && matchesFilter;
      badge.hidden = !show;
      if (show) visible += 1;
    });

    if (noBadges) noBadges.hidden = visible !== 0;
  }

  search?.addEventListener('input', updateBadges);
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeFilter = button.dataset.f || 'all';
      updateBadges();
    });
  });

  // -----------------------------
  // Calendar
  // -----------------------------
  const calendarEvents = {
    '2026-09-15': { title: 'Board meeting', type: 'meeting', time: '7:00–8:00 PM', location: 'Troop Hall', description: 'Monthly troop leadership meeting.', start: '20260915T190000', end: '20260915T200000' },
    '2026-09-22': { title: 'Troop meeting', type: 'meeting', time: '7:00–8:30 PM', location: 'Troop Hall', description: 'Weekly troop meeting.', start: '20260922T190000', end: '20260922T203000' },
    '2026-09-28': { title: 'River clean-up', type: 'service', time: '9:00 AM–12:00 PM', location: 'North Fork Park', description: 'Community service project. Bring work gloves and water.', start: '20260928T090000', end: '20260928T120000' },
    '2026-10-04': { title: 'Fall campout', type: 'campout', time: 'October 4–6', location: 'Camp Cedar Ridge', description: 'Fall weekend campout. Registration details will be shared by troop leadership.', start: '20261004', end: '20261006' },
  };

  const calendarTitle = $('#calendarTitle');
  const calendarDays = $('#calendarDays');
  let selectedEventKey = '2026-09-22';
  let calendarDate = new Date(2026, 8, 1);

  const pad = (number) => String(number).padStart(2, '0');
  const keyFor = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  function renderCalendar() {
    if (!calendarDays || !calendarTitle) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayKey = keyFor(today.getFullYear(), today.getMonth(), today.getDate());

    calendarTitle.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate);
    calendarDays.innerHTML = '';

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const cell = document.createElement('span');
      cell.className = 'mutedDay';
      cell.textContent = String(previousMonthDays - i);
      cell.setAttribute('aria-hidden', 'true');
      calendarDays.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = keyFor(year, month, day);
      const event = calendarEvents[key];
      const cell = document.createElement(event ? 'button' : 'span');
      cell.className = event ? `event ${event.type}` : '';
      if (key === todayKey) cell.classList.add('today');
      cell.innerHTML = `<strong>${day}</strong>`;

      if (event) {
        const label = document.createElement('small');
        label.textContent = event.title;
        cell.appendChild(label);
        cell.title = event.title;
        cell.setAttribute('aria-label', `${day}: ${event.title}`);
        cell.type = 'button';
        cell.addEventListener('click', () => {
          selectedEventKey = key;
          showEventDetails(key, event);
        });
      } else {
        cell.setAttribute('aria-label', String(day));
      }

      calendarDays.appendChild(cell);
    }

    const totalCells = firstDay + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= trailing; day += 1) {
      const cell = document.createElement('span');
      cell.className = 'mutedDay';
      cell.textContent = String(day);
      cell.setAttribute('aria-hidden', 'true');
      calendarDays.appendChild(cell);
    }
  }

  function showEventDetails(key, event) {
    const modal = $('#eventDetailsModal');
    if (!modal) return;
    $('#eventDetailsTitle').textContent = event.title;
    $('#eventDetailsDate').textContent = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date(`${key}T12:00:00`));
    $('#eventDetailsTime').textContent = event.time;
    $('#eventDetailsLocation').textContent = event.location;
    $('#eventDetailsDescription').textContent = event.description;
    modal.classList.remove('hidden');
    $('#closeEventDetails')?.focus();
  }

  $('#prevMonth')?.addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    renderCalendar();
  });

  $('#nextMonth')?.addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    renderCalendar();
  });

  // Creates an .ics file for the selected troop event.
  $('#addCalendar')?.addEventListener('click', () => {
    const key = selectedEventKey || Object.keys(calendarEvents)[0];
    const event = calendarEvents[key];
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Troop 832//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:troop832-${key}@troop832.org`,
      'DTSTAMP:20260922T120000Z',
      `DTSTART:${event.start}`,
      `DTEND:${event.end}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.location}`,
      `DESCRIPTION:${event.description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `troop-832-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  renderCalendar();

  $('#closeEventDetails')?.addEventListener('click', () => $('#eventDetailsModal')?.classList.add('hidden'));
  $('#eventDetailsModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'eventDetailsModal') event.currentTarget.classList.add('hidden');
  });

  // -----------------------------
  // Demo login
  // -----------------------------
  const modal = $('#loginModal');
  const loginButton = $('#loginBtn');
  const closeModal = $('#closeModal');
  const signIn = $('#signIn');
  const greeting = $('#userGreeting');

  function openModal() {
    modal?.classList.remove('hidden');
    $('#email')?.focus();
  }

  function closeLoginModal() {
    modal?.classList.add('hidden');
  }

  function setDemoSession(role) {
    const names = { leader: 'Troop Leader', scout: 'Scout', parent: 'Parent' };
    if (greeting) greeting.textContent = `${names[role] || 'User'} account`;
    if (loginButton) loginButton.textContent = 'Sign out';
  }

  loginButton?.addEventListener('click', () => {
    if (localStorage.getItem('troop832Role')) {
      localStorage.removeItem('troop832Role');
      location.reload();
    } else {
      openModal();
    }
  });

  closeModal?.addEventListener('click', closeLoginModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeLoginModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLoginModal();
  });

  signIn?.addEventListener('click', () => {
    const role = $('#role')?.value || 'scout';
    localStorage.setItem('troop832Role', role);
    closeLoginModal();
    setDemoSession(role);
  });

  const savedRole = localStorage.getItem('troop832Role');
  if (savedRole) setDemoSession(savedRole);
})();
