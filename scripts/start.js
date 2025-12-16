window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");
  const debugSky = document.querySelector("#debugSky");
  const iosVideo = document.querySelector("#iosCamera");

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  let introPlayed = false;
  let debugMode = false;
  let longPressTimer = null;

  window.__DEBUG_MODE__ = false;
  window.__CURRENT_AUDIO_NODE__ = null;

  function setWASDEnabled(enabled) {
    if (!window.__DEBUG_MODE__) return;
    camera.setAttribute("wasd-controls", {
      enabled,
      fly: true,
      acceleration: 35
    });
  }

  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
  }

  async function startExperience() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => overlay.style.display = "none", 600);

    if (!debugMode && scene.enterAR && !isIOS) {
      try { await scene.enterAR(); } catch {}
    }

    if (debugMode) {
      debugSky?.setAttribute("visible", "true");
      setWASDEnabled(true);
    }

    if (!introPlayed) {
      introPlayed = true;
      setWASDEnabled(false);

      intro.components.sound.playSound();
      intro.addEventListener("sound-ended", () => {
        setWASDEnabled(true);
        scene.systems["path-manager"]?.spawnInitialDirections();
      }, { once: true });
    }
  }

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

  /* ===============================
     DEBUG: X KEY SKIP AUDIO (FIXED)
     =============================== */
  window.addEventListener("keydown", (e) => {
    if (!window.__DEBUG_MODE__) return;
    if (e.code !== "KeyX") return;

    const node = window.__CURRENT_AUDIO_NODE__;
    if (!node) return;

    console.log("⏭️ Debug skip audio");

    try {
      node.sound?.components?.sound?.stopSound();
    } catch {}

    node.finish(); // ✅ safe, guarded
  });
});
