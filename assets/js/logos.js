(function () {
  var scope = document.getElementById('clients');
  if (!scope) return;

  function fallback(img) {
    var name = document.createElement('span');
    name.className = 'logo-name';
    name.textContent = img.alt;
    img.replaceWith(name);
  }

  scope.querySelectorAll('img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) fallback(img);
    else img.addEventListener('error', function () { fallback(img); }, { once: true });
  });
})();
