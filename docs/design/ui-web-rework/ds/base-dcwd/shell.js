// The parts of the app's frame every QA Hub board shares: minimizing the sidebar, the profile menu at the bottom of the
// sidebar, and the notifications sidebar on the right. The look comes from bundle.css and tokens.css.
// The minimized choice is remembered in this browser, so it carries from board to board in Play.
(function () {
  var KEY = 'qa-hub-sidebar-minimized';
  var BELL = '.dc-iconbtn[aria-label^="Notifications"]';
  function icon(path) {
    return '<svg class="dc-i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"></path></svg>';
  }
  var ICONS = {
    user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    close: 'M18 6 6 18M6 6l12 12',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    read: 'M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16'
  };
  // Sample data. The real app fills this from GET /api/notifications: number, title, who acted and when.
  var ITEMS = [
    { no: 1042, title: 'BAM posting shows the old balance until the page is reloaded', who: 'Marco Tan', ago: '25m' },
    { no: 1039, title: 'OR number skips one value after a voided payment', who: 'Marco Tan', ago: '1h' },
    { no: 1033, title: 'JMS sequence gate message is cut off on small screens', who: 'Jenny Uy', ago: '3h' },
    { no: 1036, title: 'Add a module filter to the MCR approval list', who: 'Paolo Lim', ago: '5h' }
  ];
  var unread = true;
  var ROOMY = 1800;
  var autoMinimized = false;
  var tipEl = null;
  var tipFor = null;

  function saved() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function save(on) {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* the sidebar still works, it just won't remember */ }
  }
  function shellEl() {
    return document.querySelector('.dc-shell');
  }
  function apply(on) {
    var shell = shellEl();
    if (!shell) return false;
    shell.classList.toggle('collapsed', on);
    shell.querySelectorAll('.dc-navlist .dc-nav').forEach(function (a) {
      var label = a.querySelector('span');
      a.removeAttribute('data-q-tip');
      if (label) a.title = on ? label.textContent.trim() : '';
    });
    var name = shell.querySelector('.q-sb-user .n');
    var prof = shell.querySelector('.q-sb-user .dc-prof');
    if (prof) prof.removeAttribute('data-q-tip');
    if (name && prof) prof.title = on ? name.textContent.trim() : '';
    return true;
  }

  function closeMenu() {
    var shell = shellEl();
    var menu = shell && shell.querySelector('.q-sb-menu');
    if (!menu) return false;
    menu.remove();
    shell.classList.remove('q-menu-open');
    var prof = shell.querySelector('.q-sb-user .dc-prof');
    if (prof) prof.setAttribute('aria-expanded', 'false');
    return true;
  }
  function openMenu(prof) {
    var box = prof.closest('.q-sb-user');
    var menu = document.createElement('div');
    menu.className = 'dc-pmenu q-sb-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<a class="dc-menu-row" role="menuitem" href="Account.dc.html">' + icon(ICONS.user) + 'My account</a>' +
      '<a class="dc-menu-row danger" role="menuitem" href="Login.dc.html">' + icon(ICONS.out) + 'Sign out</a>';
    box.appendChild(menu);
    shellEl().classList.add('q-menu-open');
    prof.setAttribute('aria-expanded', 'true');
  }

  function fillPanel(panel) {
    var rows = unread
      ? ITEMS.map(function (x) {
          return '<a class="q-notif-row" href="Ticket.dc.html"><span class="q-notif-dot" aria-hidden="true"></span><span class="q-notif-tx">' +
            '<span class="t">' + x.title + '</span>' +
            '<span class="m"><span class="dc-mono">#' + x.no + '</span> · ' + x.who + ' · ' + x.ago + '</span></span></a>';
        }).join('')
      : '<p class="q-notif-none">You\'re all caught up.</p>';
    panel.innerHTML =
      '<div class="q-notif-in">' +
        '<header class="q-notif-h"><div><h2 class="dc-h2">Notifications</h2>' +
          '<p>' + (unread ? ITEMS.length + ' unread' : 'Nothing unread') + '</p></div>' +
          '<button class="dc-iconbtn q-notif-close" type="button" aria-label="Close notifications">' + icon(ICONS.close) + '</button></header>' +
        '<div class="q-notif-list">' + rows + '</div>' +
        '<footer class="q-notif-f">' +
          '<a class="dc-btn" href="Inbox.dc.html">' + icon(ICONS.inbox) + 'My inbox</a>' +
          (unread ? '<button class="dc-btn q-notif-read" type="button">' + icon(ICONS.read) + 'Mark all as read</button>' : '') +
        '</footer>' +
      '</div>';
  }
  function setPanel(open) {
    var shell = shellEl();
    if (!shell) return;
    // Under this width the page would get too narrow, so the left sidebar minimizes while notifications are open.
    if (open && window.innerWidth < ROOMY && !shell.classList.contains('collapsed')) {
      autoMinimized = true;
      apply(true);
    } else if (!open && autoMinimized) {
      autoMinimized = false;
      apply(false);
    }
    var bell = shell.querySelector(BELL);
    var panel = shell.querySelector('.q-notif');
    if (open && !panel) {
      panel = document.createElement('aside');
      panel.className = 'q-notif';
      panel.id = 'q-notif';
      panel.setAttribute('aria-label', 'Notifications');
      fillPanel(panel);
      shell.appendChild(panel);
      void panel.offsetWidth; // Lays it out closed first, so it slides in.
    }
    shell.classList.toggle('q-notif-open', open);
    if (!bell) return;
    bell.setAttribute('aria-expanded', open ? 'true' : 'false');
    bell.setAttribute('aria-controls', 'q-notif');
    if (open) panel.querySelector('.q-notif-close').focus({ preventScroll: true });
    else bell.focus({ preventScroll: true });
  }
  function markAllRead() {
    var shell = shellEl();
    unread = false;
    fillPanel(shell.querySelector('.q-notif'));
    var bell = shell.querySelector(BELL);
    var dot = bell && bell.querySelector('.dot');
    if (dot) dot.remove();
    if (bell) bell.setAttribute('aria-label', 'Notifications');
    shell.querySelector('.q-notif-close').focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var size = t.closest('.dc-iconbtn.collapse, .dc-iconbtn.expand');
    if (size) {
      var on = size.classList.contains('collapse');
      autoMinimized = false;
      save(on);
      apply(on);
    }
    var prof = t.closest('.q-sb-user .dc-prof');
    if (prof) {
      if (!closeMenu()) openMenu(prof);
      return;
    }
    if (!t.closest('.q-sb-menu')) closeMenu();
    if (t.closest(BELL)) {
      var shell = shellEl();
      setPanel(!shell.classList.contains('q-notif-open'));
    } else if (t.closest('.q-notif-close')) {
      setPanel(false);
    } else if (t.closest('.q-notif-read')) {
      markAllRead();
    }
  });
  // One tooltip for the whole frame, in the info icon's style. It shows an element's title, or the full text of
  // anything cut off with "…". The title moves to data-q-tip so the browser's own tooltip stays away.
  function findTip(t) {
    if (!t.closest || !t.closest('.dc-shell') || t.closest('input, select, textarea, .q-tip')) return null;
    for (var el = t, i = 0; el && i < 3; el = el.parentElement, i++) {
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === 'ellipsis') {
        return { el: el, text: el.textContent.trim() };
      }
    }
    var holder = t.closest('[title]:not([title=""]), [data-q-tip]');
    if (!holder) return null;
    if (holder.title) {
      holder.setAttribute('data-q-tip', holder.title);
      holder.removeAttribute('title');
    }
    return { el: holder, text: holder.getAttribute('data-q-tip') };
  }
  function hideTip() {
    if (tipEl) tipEl.remove();
    tipEl = null;
    tipFor = null;
  }
  function showTip(found) {
    hideTip();
    var shell = shellEl();
    if (!shell || !found.text) return;
    tipFor = found.el;
    tipEl = document.createElement('div');
    tipEl.className = 'q-floattip';
    tipEl.setAttribute('role', 'tooltip');
    tipEl.textContent = found.text;
    shell.appendChild(tipEl);
    var zoom = parseFloat(getComputedStyle(shell).zoom) || 1; // Boards at 2560 are zoomed, and fixed positions scale with it.
    var r = found.el.getBoundingClientRect();
    var size = tipEl.getBoundingClientRect();
    var top = r.top - size.height - 6;
    if (top < 4) top = r.bottom + 6;
    var left = Math.max(4, Math.min(r.left, window.innerWidth - size.width - 8));
    tipEl.style.top = top / zoom + 'px';
    tipEl.style.left = left / zoom + 'px';
  }
  document.addEventListener('mouseover', function (e) {
    var found = findTip(e.target);
    if (!found) hideTip();
    else if (found.el !== tipFor) showTip(found);
  });
  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) hideTip();
  });
  document.addEventListener('focusin', function (e) {
    if (!e.target.matches || !e.target.matches(':focus-visible')) return;
    var found = findTip(e.target);
    if (found) showTip(found);
  });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('scroll', hideTip, true);
  document.addEventListener('click', hideTip, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    hideTip();
    if (closeMenu()) return;
    var shell = shellEl();
    if (shell && shell.classList.contains('q-notif-open')) setPanel(false);
  });

  if (!apply(saved())) {
    var watcher = new MutationObserver(function () {
      if (apply(saved())) watcher.disconnect();
    });
    watcher.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
