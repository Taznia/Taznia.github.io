"use strict";

let activeCard = null;

function getVideo(card) {
  return card.querySelector('.proj-video');
}

function getPlayBtn(card) {
  return card.querySelector('.proj-play-btn');
}

function getMuteBtn(card) {
  return card.querySelector('.proj-mute-btn');
}

function getCenterPlay(card) {
  return card.querySelector('.proj-center-play');
}

function getProgress(card) {
  return card.querySelector('.proj-progress-bar');
}

function setPlayBtn(card, playing) {
  const btn = getPlayBtn(card);
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
  }
  const label = btn.querySelector('.btn-label');
  if (label) {
    label.textContent = playing ? 'Pause Demo' : 'Play Demo';
  }
}

function setMuteBtn(card, muted) {
  const btn = getMuteBtn(card);
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  }
  btn.setAttribute('aria-pressed', String(!muted));
  btn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
}

function setProgress(card, video) {
  const bar = getProgress(card);
  if (!bar || !video.duration || !Number.isFinite(video.duration)) return;
  bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
}

function ensureSource(video) {
  if (!video || video.getAttribute('src')) return false;

  const sources = Array.from(video.querySelectorAll('source[data-src]'));
  if (!sources.length) return false;

  sources.forEach((source) => {
    source.src = source.dataset.src;
  });

  video.preload = 'metadata';
  video.load();
  return true;
}

function updateOrientation(card, video) {
  const width = video.videoWidth || 16;
  const height = video.videoHeight || 9;
  card.style.setProperty('--video-ratio', `${width} / ${height}`);
  const portrait = width < height;
  card.dataset.orientation = portrait ? 'portrait' : 'landscape';
  card.classList.toggle('landscape', !portrait);
  card.classList.toggle('portrait', portrait);
}

function pauseCard(card, reset) {
  const video = getVideo(card);
  if (!video) return;
  video.pause();
  if (reset) {
    if (video.readyState >= 1) {
      video.currentTime = 0;
    }
  }
  card.classList.remove('is-playing');
  setPlayBtn(card, false);
  if (activeCard === card) {
    activeCard = null;
  }
}

function setPlaying(card, playing) {
  card.classList.toggle('is-playing', playing);
  setPlayBtn(card, playing);
  const centerPlay = getCenterPlay(card);
  if (centerPlay) {
    centerPlay.setAttribute('aria-pressed', String(playing));
  }
}

async function playCard(card) {
  const video = getVideo(card);
  if (!video) return;

  ensureSource(video);
  video.muted = true;
  setMuteBtn(card, true);

  if (video.readyState < 1) {
    await new Promise((resolve) => {
      const finish = () => resolve();
      video.addEventListener('loadedmetadata', finish, { once: true });
      video.addEventListener('loadeddata', finish, { once: true });
      window.setTimeout(finish, 1200);
    });
  }

  if (activeCard && activeCard !== card) {
    pauseCard(activeCard, false);
  }

  await video.play();

  activeCard = card;
  setPlaying(card, true);
}

function toggleCard(card) {
  const video = getVideo(card);
  if (!video) return;

  if (video.paused) {
    void playCard(card).catch((error) => {
      console.warn('Could not start video playback.', error);
      setPlaying(card, false);
    });
  } else {
    pauseCard(card, false);
  }
}

function bindCard(card) {
  const video = getVideo(card);
  const playBtn = getPlayBtn(card);
  const muteBtn = getMuteBtn(card);
  const centerPlay = getCenterPlay(card);
  const side = card.querySelector('.proj-video-side');

  if (!video) return;

  video.muted = true;
  video.playsInline = true;
  video.preload = 'none';
  setMuteBtn(card, true);

  const onMetadataReady = () => updateOrientation(card, video);
  video.addEventListener('loadedmetadata', onMetadataReady);
  if (video.readyState >= 1) {
    onMetadataReady();
  }

  video.addEventListener('play', () => {
    setPlaying(card, true);
    activeCard = card;
  });

  video.addEventListener('pause', () => {
    setPlaying(card, false);
  });

  video.addEventListener('ended', () => {
    pauseCard(card, true);
  });

  video.addEventListener('timeupdate', () => {
    setProgress(card, video);
  });

  video.addEventListener('volumechange', () => {
    setMuteBtn(card, video.muted);
  });

  if (side) {
    side.setAttribute('role', 'button');
    side.setAttribute('tabindex', '0');
    side.setAttribute('aria-label', 'Play or pause the video demo');

    side.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      toggleCard(card);
    });

    side.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleCard(card);
    });
  }

  if (centerPlay) {
    centerPlay.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleCard(card);
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', (event) => {
      event.preventDefault();
      toggleCard(card);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      video.muted = !video.muted;
      setMuteBtn(card, video.muted);
    });
  }

  setPlayBtn(card, false);
}

function initProjectVideos() {
  const cards = Array.from(document.querySelectorAll('.proj-video-card'));
  if (!cards.length) return;

  cards.forEach(bindCard);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        const video = getVideo(card);
        if (!video) return;

        if (entry.isIntersecting) {
          ensureSource(video);
        }
      });
    }, {
      rootMargin: '220px 0px',
      threshold: 0.15
    });

    cards.forEach((card) => observer.observe(card));
  } else {
    cards.forEach((card) => ensureSource(getVideo(card)));
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && activeCard) {
      pauseCard(activeCard, false);
    }
  });
}

window.addEventListener('load', initProjectVideos);
