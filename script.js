// =====================================================================
// PROJECT VIDEO CARDS — sidebar layout with video + info panel
// Runs on window.onload so the inline script's window.onload fires
// first (galaxy/chat), then this appends to the load queue via
// addEventListener which stacks safely.
// =====================================================================
window.addEventListener('load', function () {

  var cards = document.querySelectorAll('.proj-video-card');
  if (!cards.length) return;

  var activeCard = null;

  function getVideo(card)    { return card.querySelector('.proj-video'); }
  function getPlayBtn(card)  { return card.querySelector('.proj-play-btn'); }
  function getMuteBtn(card)  { return card.querySelector('.proj-mute-btn'); }
  function getProgress(card) { return card.querySelector('.proj-progress-bar'); }

  function setPlayBtn(card, playing) {
    var btn = getPlayBtn(card);
    if (!btn) return;
    var icon = btn.querySelector('i');
    if (icon) icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
    var label = btn.querySelector('.btn-label');
    if (label) label.textContent = playing ? 'Pause' : 'Play Demo';
  }

  function setMuteIcon(btn, muted) {
    if (!btn) return;
    var icon = btn.querySelector('i');
    if (icon) icon.className = muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  }

  function stopCard(card) {
    var vid = getVideo(card);
    var bar = getProgress(card);
    vid.pause();
    vid.muted = true;
    card.classList.remove('is-playing');
    setPlayBtn(card, false);
    setMuteIcon(getMuteBtn(card), true);
    if (bar) bar.style.width = '0%';
    if (activeCard === card) activeCard = null;
  }

  function playCard(card) {
    // stop whoever was playing
    if (activeCard && activeCard !== card) stopCard(activeCard);

    var vid = getVideo(card);
    var muteBtn = getMuteBtn(card);

    vid.muted = false;
    var p = vid.play();
    if (p !== undefined) {
      p.catch(function () {
        // browser blocked unmuted autoplay — retry muted
        vid.muted = true;
        vid.play().catch(function () {});
      });
    }
    card.classList.add('is-playing');
    setPlayBtn(card, true);
    setMuteIcon(muteBtn, vid.muted);
    activeCard = card;
  }

  cards.forEach(function (card) {
    var vid     = getVideo(card);
    var playBtn = getPlayBtn(card);
    var muteBtn = getMuteBtn(card);
    var bar     = getProgress(card);
    var side    = card.querySelector('.proj-video-side');

    if (!vid) return;

    // reset state
    vid.muted = true;
    vid.pause();

    // hover over video side → silent preview
    if (side) {
      side.addEventListener('mouseenter', function () {
        if (card.classList.contains('is-playing')) return;
        vid.muted = true;
        vid.play().catch(function () {});
      });
      side.addEventListener('mouseleave', function () {
        if (card.classList.contains('is-playing')) return;
        vid.pause();
        vid.currentTime = 0;
      });
      // click video side → toggle play/stop
      side.addEventListener('click', function (e) {
        if (e.target.closest('.proj-mute-btn')) return;
        card.classList.contains('is-playing') ? stopCard(card) : playCard(card);
      });
    }

    // play/pause button in sidebar
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        card.classList.contains('is-playing') ? stopCard(card) : playCard(card);
      });
    }

    // mute toggle
    if (muteBtn) {
      muteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        vid.muted = !vid.muted;
        setMuteIcon(muteBtn, vid.muted);
      });
    }

    // progress bar
    if (bar) {
      vid.addEventListener('timeupdate', function () {
        if (!vid.duration) return;
        bar.style.width = (vid.currentTime / vid.duration * 100) + '%';
      });
    }

    vid.addEventListener('volumechange', function () {
      setMuteIcon(muteBtn, vid.muted);
    });
  });

  // pause when scrolled out of view
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && entry.target.classList.contains('is-playing')) {
          stopCard(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(function (card) { obs.observe(card); });
  }

});
