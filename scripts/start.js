window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const debugBtn = document.querySelector("#debugButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");
  const scene = document.querySelector("a-scene");
  const camera = document.querySelector("#camera");

  if (!startBtn || !debugBtn || !overlay || !intro || !scene) {
    console.error("Start.js: required elements missing");
    return;
  }

  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn("Audio unlock failed", e);
      }
    }
  }

  function startExperience() {
    overlay.style.display = "none";

    intro.components.sound.playSound();

    intro.addEventListener(
      "sound-ended",
      () => {
        const pm = scene.systems["path-manager"];
        if (pm) {
          pm.spawnInitialDirections();
        } else {
          console.error("PathManager not found");
        }
      },
      { once: true }
    );
  }

  startBtn.onclick = async () => {
    await unlockAudio();
    startExperience();
  };

  debugBtn.onclick = async () => {
    await unlockAudio();
    camera.setAttribute("wasd-controls", "enabled:true");
    startExperience();
  };
});
