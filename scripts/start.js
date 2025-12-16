// ✅ DEFINE ONCE — GLOBAL
window.IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");
  const iosVideo = document.querySelector("#iosCamera");
  const mobileSkipBtn = document.querySelector("#mobileSkipButton");
  const debugHint = document.querySelector("#debugHint");

  if (!startBtn || !overlay || !intro || !scene || !camera) return;

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  /* =====================================================
     GLOBAL SHARED STATE
     ===================================================== */
  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO_NODE__ = null;
  window.__CURRENT_AUDIO_ENTITY__ = null;

  /* =====================================================
     UI
     ===================================================== */
  function showSkipHint() {
    if (window.__DEBUG_MODE__) debugHint?.classList.add("visible");
  }

  function hideSkipHint() {
    debugHint?.classList.remove("visible");
  }

  function setWASDEnabled(enabled) {
    if (!window.__DEBUG_MODE__) return;
    camera.setAttribute("wasd-controls", {
      enabled,
      fly: true,
      acceleration: 35
    });
  }

  /* =====================================================
     AUDIO UNLOCK
     ===================================================== */
  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx?.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
  }

  /* =====================================================
     iOS CAMERA PASSTHROUGH
     ===================================================== */
  async function enableIOSCameraPassthrough() {
    if (!iosVideo) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      iosVideo.srcObject = stream;
      iosVideo.style.display = "block";
      scene.renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.warn("iOS camera failed", e);
    }
  }

  /* =====================================================
     INTRO FINISH (NATURAL OR SKIPPED)
     ===================================================== */
  function finishIntro() {
    try { intro.components.sound.stopSound(); } catch {}

    window.__CURRENT_AUDIO_ENTITY__ = null;
    window.__CURRENT_AUDIO_NODE__ = null;

    hideSkipHint();
    setWASDEnabled(true);

    scene.systems["path-manager"]?.spawnInitialDirections();
  }

  /* =====================================================
     START EXPERIENCE
     ===================================================== */
  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => overlay.style.display = "none", 600);

    if (debugMode) {
      debugSky?.setAttribute("visible", "true");
      setWASDEnabled(true);
    } else {
      debugSky?.setAttribute("visible", "false");

      // 🤖 Android — REAL AR
      if (!window.IS_IOS && scene.enterAR) {
        try { await scene.enterAR(); } catch {}
      }

      // 🍎 iOS — fake passthrough
      if (window.IS_IOS) {
        await enableIOSCameraPassthrough();
      }
    }

    if (!introPlayed) {
      introPlayed = true;
      setWASDEnabled(false);

      window.__CURRENT_AUDIO_ENTITY__ = intro;
      showSkipHint();

      intro.components.sound.playSound();
      intro.addEventListener("sound-ended", finishIntro, { once: true });
    }
  }

  /* =====================================================
     START INPUT
     ===================================================== */
  startBtn.addEventListener("click", async (e) => {
    debugMode = e.shiftKey === true;
    window.__DEBUG_MODE__ = debugMode;
    await unlockAudio();
    startExperience();
  });

  startBtn.addEventListener("touchstart", () => {
    longPressTimer = setTimeout(() => {
      debugMode = true;
      window.__DEBUG_MODE__ = true;
    }, 800);
  });

  startBtn.addEventListener("touchend", async () => {
    clearTimeout(longPressTimer);
    await unlockAudio();
    startExperience();
  });

  /* =====================================================
     DESKTOP — X = FINISH AUDIO NATURALLY
     ===================================================== */
  document.addEventListener("keydown", (e) => {
    if (!window.__DEBUG_MODE__ || e.code !== "KeyX") return;

    if (window.__CURRENT_AUDIO_NODE__) {
      window.__CURRENT_AUDIO_NODE__.forceFinish(); // ✅ advance
      hideSkipHint();
      setWASDEnabled(true);
      return;
    }

    if (window.__CURRENT_AUDIO_ENTITY__) {
      finishIntro();
    }
  }, true);

  /* =====================================================
     MOBILE SKIP — SAME BEHAVIOR
     ===================================================== */
  mobileSkipBtn?.addEventListener("click", () => {
    if (window.__CURRENT_AUDIO_NODE__) {
      window.__CURRENT_AUDIO_NODE__.forceFinish(); // ✅ advance
    } else if (window.__CURRENT_AUDIO_ENTITY__) {
      finishIntro();
    }
  });
});
