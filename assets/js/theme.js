(function () {
  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');
  if (!button) return;

  var media = window.matchMedia('(prefers-color-scheme: light)');

  function currentTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return media.matches ? 'light' : 'dark';
  }

  function reflect() {
    button.setAttribute('aria-pressed', String(currentTheme() === 'light'));
  }

  button.addEventListener('click', function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    reflect();
  });

  reflect();
})();
