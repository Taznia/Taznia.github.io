// Mobile navigation (old styles.css nav, kept for compatibility)
const navToggle = document.getElementById("navToggle");
const navLinksEl = document.querySelector(".nav-links");
if (navToggle && navLinksEl) {
  navToggle.addEventListener("click", () => navLinksEl.classList.toggle("open"));
  navLinksEl.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navLinksEl.classList.remove("open");
  });
}

// Dynamic year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

// Scroll reveal (.reveal class — old styles.css)
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length) {
  const revealObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); revealObs.unobserve(e.target); } }),
    { threshold: 0.18 }
  );
  revealEls.forEach((el) => revealObs.observe(el));
}

// =====================================================================
// PROJECT VIDEO CARDS — sidebar layout
// =====================================================================
function initProjectVideoCards() {
  const cards = document.querySelectorAll(".proj-video-card");
  if (!cards.length) return;

  let activeCard = null;

  // ── helpers ──────────────────────────────────────────────────────────
  function getEls(card) {
    return {
      video:      card.querySelector(".proj-video"),
      playBtn:    card.querySelector(".proj-play-btn"),
      muteBtn:    card.querySelector(".proj-mute-btn"),
      progressBar:card.querySelector(".proj-progress-bar"),
      centerPlay: card.querySelector(".proj-center-play"),
    };
  }

  function setPlayBtnState(card, isPlaying) {
    const btn = card.querySelector(".proj-play-btn");
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (icon) icon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
    // .btn-label text is driven by CSS ::before content, no JS needed
  }

  function setMuteIcon(btn, isMuted) {
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (icon) icon.className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
    btn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
  }

  function stopCard(card) {
    const { video, progressBar } = getEls(card);
    video.pause();
    video.muted = true;
    card.classList.remove("is-playing");
    setPlayBtnState(card, false);
    setMuteIcon(card.querySelector(".proj-mute-btn"), true);
    if (progressBar) progressBar.style.width = "0%";
    if (activeCard === card) activeCard = null;
  }

  function playCard(card) {
    if (activeCard && activeCard !== card) stopCard(activeCard);
    const { video, muteBtn } = getEls(card);
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy blocked unmuted play — fall back to muted
        video.muted = true;
        video.play().catch(() => {});
      });
    }
    card.classList.add("is-playing");
    setPlayBtnState(card, true);
    setMuteIcon(muteBtn, video.muted);
    activeCard = card;
  }

  // ── per-card wiring ───────────────────────────────────────────────────
  cards.forEach((card) => {
    const { video, playBtn, muteBtn, progressBar } = getEls(card);
    if (!video) return;

    // ensure starts paused + muted
    video.muted = true;
    video.pause();

    const videoSide = card.querySelector(".proj-video-side");

    // hover on video side → silent preview
    if (videoSide) {
      videoSide.addEventListener("mouseenter", () => {
        if (card.classList.contains("is-playing")) return;
        video.muted = true;
        video.play().catch(() => {});
      });
      videoSide.addEventListener("mouseleave", () => {
        if (card.classList.contains("is-playing")) return;
        video.pause();
        video.currentTime = 0;
      });
      // click on video side → toggle full play
      videoSide.addEventListener("click", (e) => {
        if (e.target.closest(".proj-mute-btn")) return;
        card.classList.contains("is-playing") ? stopCard(card) : playCard(card);
      });
    }

    // play/pause button in info sidebar
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        card.classList.contains("is-playing") ? stopCard(card) : playCard(card);
      });
    }

    // mute toggle
    if (muteBtn) {
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        setMuteIcon(muteBtn, video.muted);
      });
    }

    // progress bar
    if (progressBar) {
      video.addEventListener("timeupdate", () => {
        if (!video.duration) return;
        progressBar.style.width = (video.currentTime / video.duration * 100) + "%";
      });
    }

    // sync mute icon if browser changes volume
    video.addEventListener("volumechange", () => {
      setMuteIcon(muteBtn, video.muted);
    });
  });

  // pause cards that scroll out of view
  const scrollPauseObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.target.classList.contains("is-playing")) {
          stopCard(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  cards.forEach((card) => scrollPauseObs.observe(card));
}

// Run everything after full DOM load
window.addEventListener("DOMContentLoaded", initProjectVideoCards);
