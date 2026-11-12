function initCarousel(root, pauseButton) {
  pauseButton.addEventListener('click', function () {
    var paused = root.classList.toggle('is-paused');
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? pauseButton.dataset.labelPlay : pauseButton.dataset.labelPause;
  });
}

(function () {
  var root = document.getElementById('carousel');
  var button = document.getElementById('carousel-pause');
  if (root && button) initCarousel(root, button);
})();
