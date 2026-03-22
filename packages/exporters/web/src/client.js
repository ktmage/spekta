  // --- Mobile Menu ---
  var menuBtn = document.getElementById('menu-toggle');
  var sidebar = document.getElementById('sidebar');
  var mainContent = document.getElementById('main-content');
  var menuOpen = false;

  function setMenuOpen(open) {
    menuOpen = open;
    if (open) {
      sidebar.classList.add('sidebar--open');
      menuBtn.classList.add('menu-toggle--active');
      menuBtn.setAttribute('aria-label', '\u30E1\u30CB\u30E5\u30FC\u3092\u9589\u3058\u308B');
      menuBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    } else {
      sidebar.classList.remove('sidebar--open');
      menuBtn.classList.remove('menu-toggle--active');
      menuBtn.setAttribute('aria-label', '\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F');
      menuBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function() { setMenuOpen(!menuOpen); });
  }
  if (mainContent) {
    mainContent.addEventListener('click', function() { if (menuOpen) setMenuOpen(false); });
  }
  if (sidebar) {
    sidebar.addEventListener('click', function(e) {
      if (e.target.closest && e.target.closest('a')) { setMenuOpen(false); }
    });
  }

  // --- Search ---
  var searchInput = document.getElementById('spekta-search');
  var searchResults = document.getElementById('spekta-search-results');
  var entries = [];
  try { entries = JSON.parse(document.getElementById('spekta-search-data').textContent); } catch(e) {}

  var selectedIndex = 0;

  function renderResults(query) {
    if (!query) { searchResults.innerHTML = ''; return; }
    var q = query.toLowerCase();
    var filtered = entries.filter(function(e) {
      var pm = e.pageTitle.toLowerCase().indexOf(q) !== -1;
      var sm = e.sectionTitle ? e.sectionTitle.toLowerCase().indexOf(q) !== -1 : false;
      return pm || sm;
    });
    selectedIndex = 0;
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var entry = filtered[i];
      var hash = entry.sectionId ? '#' + entry.sectionId : '';
      var href = '/' + entry.pageId + '/' + hash;
      var cls = 'search__result' + (i === 0 ? ' search__result--selected' : '');
      var label = entry.sectionTitle || entry.pageTitle;
      var context = entry.sectionTitle ? '<span class="search__result-context">' + escHtml(entry.pageTitle) + '</span>' : '';
      html += '<a href="' + href + '" class="' + cls + '" data-index="' + i + '"><span class="search__result-label">' + escHtml(label) + '</span>' + context + '</a>';
    }
    searchResults.innerHTML = html;
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function updateSelected() {
    var items = searchResults.querySelectorAll('.search__result');
    for (var i = 0; i < items.length; i++) {
      if (i === selectedIndex) {
        items[i].classList.add('search__result--selected');
        items[i].scrollIntoView({ block: 'nearest' });
      } else {
        items[i].classList.remove('search__result--selected');
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() { renderResults(this.value); });
    searchInput.addEventListener('focus', function() { if (this.value) renderResults(this.value); });
    searchInput.addEventListener('blur', function() { setTimeout(function() { searchResults.innerHTML = ''; }, 150); });
    searchInput.addEventListener('keydown', function(e) {
      var items = searchResults.querySelectorAll('.search__result');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelected();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) { items[selectedIndex].click(); }
      } else if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchInput.blur();
      }
    });
  }
})();`;
