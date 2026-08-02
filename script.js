// Mobile navigation
const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      navLinks.classList.remove("open");
    }
  });
}

// Dynamic year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = String(new Date().getFullYear());
}

// Scroll reveal animations
const revealEls = document.querySelectorAll(".reveal");

if (revealEls.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  revealEls.forEach((el) => observer.observe(el));
}

// =====================================================================
// VIDEO SHOWCASE — hover-preview, click-to-play, mute, progress bar
// =====================================================================
(function initVideoCards() {
  const cards = document.querySelectorAll(".video-card");
  if (!cards.length) return;

  // Track which card is currently in "full play" mode
  let activeCard = null;

  // ── helpers ──────────────────────────────────────────────────────────

  function getEls(card) {
    return {
      video:    card.querySelector("video"),
      playBtn:  card.querySelector(".video-play-btn"),
      muteBtn:  card.querySelector(".video-mute-btn"),
      progress: card.querySelector(".video-progress-bar"),
      centerPlay: card.querySelector(".video-center-play"),
    };
  }

  function setPlayIcon(btn, isPlaying) {
    if (!btn) return;
    btn.innerHTML = isPlaying
      ? '<i class="fas fa-pause"></i>'
      : '<i class="fas fa-play"></i>';
    btn.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
  }

  function setMuteIcon(btn, isMuted) {
    if (!btn) return;
    btn.innerHTML = isMuted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
    btn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
  }

  function stopCard(card) {
    const { video, playBtn, progress } = getEls(card);
    video.pause();
    video.muted = true;
    card.classList.remove("is-playing");
    setPlayIcon(playBtn, false);
    setMuteIcon(card.querySelector(".video-mute-btn"), true);
    if (progress) progress.style.width = "0%";
    if (activeCard === card) activeCard = null;
  }

  function playCard(card) {
    // Stop whatever was playing before
    if (activeCard && activeCard !== card) {
      stopCard(activeCard);
    }
    const { video, playBtn, muteBtn } = getEls(card);
    // Unmute on explicit user play
    video.muted = false;
    video.play().catch(() => {
      // Autoplay blocked — keep muted and try again
      video.muted = true;
      video.play().catch(() => {});
    });
    card.classList.add("is-playing");
    setPlayIcon(playBtn, true);
    setMuteIcon(muteBtn, video.muted);
    activeCard = card;
  }

  // ── per-card setup ────────────────────────────────────────────────────

  cards.forEach((card) => {
    const { video, playBtn, muteBtn, progress } = getEls(card);
    if (!video) return;

    // Start silent / paused
    video.muted = true;
    video.pause();

    // ── hover: silent preview ──────────────────────────────────────────
    card.addEventListener("mouseenter", () => {
      if (card.classList.contains("is-playing")) return; // already in play mode
      video.muted = true;
      video.play().catch(() => {});
    });

    card.addEventListener("mouseleave", () => {
      if (card.classList.contains("is-playing")) return;
      video.pause();
      video.currentTime = 0;
    });

    // ── click on card body (not buttons): toggle full play ─────────────
    card.addEventListener("click", (e) => {
      // Ignore clicks that land on the control buttons themselves
      if (e.target.closest(".video-play-btn") || e.target.closest(".video-mute-btn")) return;
      if (card.classList.contains("is-playing")) {
        stopCard(card);
      } else {
        playCard(card);
      }
    });

    // ── play button ───────────────────────────────────────────────────
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (card.classList.contains("is-playing")) {
          stopCard(card);
        } else {
          playCard(card);
        }
      });
    }

    // ── mute button ───────────────────────────────────────────────────
    if (muteBtn) {
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        setMuteIcon(muteBtn, video.muted);
      });
    }

    // ── progress bar ──────────────────────────────────────────────────
    if (progress) {
      video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        progress.style.width = pct + "%";
      });
      video.addEventListener("ended", () => {
        // Loop restarts automatically (loop attr), but reset UI if not looping
        if (!video.loop) stopCard(card);
      });
    }

    // ── keep mute icon in sync ─────────────────────────────────────────
    video.addEventListener("volumechange", () => {
      setMuteIcon(muteBtn, video.muted);
    });
  });

  // ── IntersectionObserver: pause cards that scroll out of view ─────────
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        if (!entry.isIntersecting && card.classList.contains("is-playing")) {
          stopCard(card);
        }
      });
    },
    { threshold: 0.15 }
  );

  cards.forEach((card) => visibilityObserver.observe(card));
})();


