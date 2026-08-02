"use strict";

const ICON_MUTE =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>';
const ICON_UNMUTE =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>';

function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');

  const apply = (theme) => {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0e14" : "#F7F9FC");
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }
}

function initNav() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!toggle || !mobileNav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.hidden = !open;
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (!items.length) return;

  const show = (el) => el.classList.add("is-visible");

  // Hero already animates via CSS — mark visible so JS doesn't fight it
  document.querySelectorAll(".hero .reveal").forEach(show);

  const rest = items.filter((el) => !el.closest(".hero"));
  if (!rest.length) return;

  // Progressive enhancement: never leave content stuck invisible
  if (!("IntersectionObserver" in window)) {
    rest.forEach(show);
    return;
  }

  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.96 && r.bottom > 0;
  };

  // Reveal anything already on screen immediately (tunnel / restore / hash jumps)
  rest.filter(inView).forEach(show);

  const pending = rest.filter((el) => !el.classList.contains("is-visible"));
  if (!pending.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px 12% 0px", threshold: 0.01 }
  );

  pending.forEach((el) => observer.observe(el));

  // Safety net: if observer never fires (embedded previews / tunnel quirks), force show
  window.setTimeout(() => {
    pending.forEach((el) => {
      if (!el.classList.contains("is-visible")) show(el);
    });
  }, 1800);
}

function animateCount(el) {
  const target = Number(el.dataset.count || 0);
  const decimals = Number(el.dataset.decimals || 0);
  const duration = 1100;
  const start = performance.now();

  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function initCounters() {
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  if (!counters.length) return;

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animateCount);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ---------- Project videos ---------- */
const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getFeature(card) {
  return card.closest(".project-feature") || card;
}

function getVideo(card) {
  return card.querySelector(".proj-video");
}

function getPlayBtn(card) {
  return getFeature(card).querySelector(".proj-play-btn");
}

function getMuteBtn(card) {
  return card.querySelector(".proj-mute-btn");
}

function getCenterPlay(card) {
  return card.querySelector(".proj-center-play");
}

function getProgress(card) {
  return card.querySelector(".proj-progress-bar");
}

function setPlayBtn(card, playing) {
  const btn = getPlayBtn(card);
  if (!btn) return;
  const label = btn.querySelector(".btn-label");
  if (label) label.textContent = playing ? "Pause demo" : "Play demo";
}

function setMuteBtn(card, muted) {
  const btn = getMuteBtn(card);
  if (!btn) return;
  btn.innerHTML = muted ? ICON_MUTE : ICON_UNMUTE;
  btn.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
}

function setProgress(card, video) {
  const bar = getProgress(card);
  if (!bar || !video.duration || !Number.isFinite(video.duration)) return;
  bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
}

function ensureSource(video) {
  if (!video) return false;
  const sources = Array.from(video.querySelectorAll("source[data-src]"));
  if (!sources.length) return Boolean(video.currentSrc);
  if (sources[0].getAttribute("src")) return true;
  sources.forEach((source) => {
    source.src = source.dataset.src;
  });
  video.preload = "auto";
  video.load();
  return true;
}

function updateOrientation(card, video) {
  const width = video.videoWidth || 16;
  const height = video.videoHeight || 9;
  const portrait = card.classList.contains("portrait") || height > width;
  const side = card.querySelector(".proj-video-side");

  card.classList.toggle("portrait", portrait);
  card.classList.toggle("landscape", !portrait);
  card.dataset.orientation = portrait ? "portrait" : "landscape";

  if (side) {
    side.style.removeProperty("aspect-ratio");
    side.style.removeProperty("width");
    side.style.removeProperty("height");
  }
}

function setPlaying(card, playing) {
  card.classList.toggle("is-playing", playing);
  setPlayBtn(card, playing);
}

function pauseCard(card) {
  const video = getVideo(card);
  if (!video) return;
  video.dataset.userPaused = "1";
  video.pause();
  setPlaying(card, false);
}

async function playCard(card, { user = false } = {}) {
  const video = getVideo(card);
  if (!video) return;

  ensureSource(video);
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  setMuteBtn(card, true);
  if (user) delete video.dataset.userPaused;

  if (video.readyState < 1) {
    await new Promise((resolve) => {
      const done = () => resolve();
      video.addEventListener("loadedmetadata", done, { once: true });
      video.addEventListener("loadeddata", done, { once: true });
      window.setTimeout(done, 1500);
    });
  }

  await video.play();
  setPlaying(card, true);
}

function toggleCard(card) {
  const video = getVideo(card);
  if (!video) return;
  if (video.paused) {
    void playCard(card, { user: true }).catch(() => setPlaying(card, false));
  } else {
    pauseCard(card);
  }
}

function autoplayCard(card) {
  const video = getVideo(card);
  if (!video || reduceMotion() || video.dataset.userPaused === "1") return;
  void playCard(card).catch(() => setPlaying(card, false));
}

function bindCard(card) {
  const video = getVideo(card);
  const playBtn = getPlayBtn(card);
  const muteBtn = getMuteBtn(card);
  const centerPlay = getCenterPlay(card);
  const side = card.querySelector(".proj-video-side");
  if (!video) return;

  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  setMuteBtn(card, true);
  setPlayBtn(card, false);

  video.addEventListener("loadedmetadata", () => updateOrientation(card, video));
  video.addEventListener("play", () => setPlaying(card, true));
  video.addEventListener("pause", () => {
    if (!video.ended) setPlaying(card, false);
  });
  video.addEventListener("timeupdate", () => setProgress(card, video));
  video.addEventListener("volumechange", () => setMuteBtn(card, video.muted));

  if (side) {
    side.setAttribute("role", "button");
    side.setAttribute("tabindex", "0");
    side.setAttribute("aria-label", "Play or pause the video demo");
    side.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      toggleCard(card);
    });
    side.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      toggleCard(card);
    });
  }

  if (centerPlay) {
    centerPlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCard(card);
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCard(card);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      video.muted = !video.muted;
      setMuteBtn(card, video.muted);
    });
  }
}

function initProjectVideos() {
  const cards = Array.from(document.querySelectorAll(".proj-video-card"));
  if (!cards.length) return;

  cards.forEach(bindCard);

  if (reduceMotion()) return;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          if (entry.isIntersecting) {
            ensureSource(getVideo(card));
            autoplayCard(card);
          } else {
            const video = getVideo(card);
            if (video && !video.paused) video.pause();
          }
        });
      },
      { rootMargin: "120px 0px", threshold: 0.2 }
    );
    cards.forEach((card) => observer.observe(card));
  } else {
    cards.forEach((card) => {
      ensureSource(getVideo(card));
      autoplayCard(card);
    });
  }

  document.addEventListener("visibilitychange", () => {
    cards.forEach((card) => {
      const video = getVideo(card);
      if (!video) return;
      if (document.hidden) {
        if (!video.paused) video.pause();
      } else if (video.dataset.userPaused !== "1") {
        autoplayCard(card);
      }
    });
  });
}

function initLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  const started = performance.now();
  const minMs = 900;

  const dismiss = () => {
    const wait = Math.max(0, minMs - (performance.now() - started));
    window.setTimeout(() => {
      loader.classList.add("is-done");
      document.body.classList.add("is-loaded");
      window.setTimeout(() => loader.remove(), 600);
      initHeroVideo();
    }, wait);
  };

  if (document.readyState === "complete") dismiss();
  else window.addEventListener("load", dismiss, { once: true });
}

function initHeroVideo() {
  const video = document.getElementById("hero-video");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");

  const tryPlay = () => {
    const play = video.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        /* Autoplay blocked — stays muted poster frame until user interacts */
      });
    }
  };

  if (video.readyState >= 2) tryPlay();
  else video.addEventListener("loadeddata", tryPlay, { once: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
    else tryPlay();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  initLoader();
  initTheme();
  initNav();
  initScrollProgress();
  initReveal();
  initCounters();
  initProjectVideos();

  // Kick hero video early; loader dismiss also retries play()
  if (!document.getElementById("page-loader")) initHeroVideo();
});
