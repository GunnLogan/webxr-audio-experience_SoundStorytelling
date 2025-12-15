window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#startButton");
  const debugBtn = document.querySelector("#debugButton");
  const overlay = document.querySelector("#startOverlay");
  const intro = document.querySelector("#intro");

  async function unlockAudio() {
    const ctx = AFRAME.audioContext;
    if (ctx && ctx.state === "suspended") await ctx.resume();
  }

  function startExperience() {
    overlay.style.display = "none";
    intro.components.sound.playSound();

    intro.addEventListener("sound-ended", () => {
      document
        .querySelector("a-scene")
        .systems["path-manager"]
        .spawnInitialDirections();
    }, { once: true });
  }

  startBtn.onclick = async () => {
    await unlockAudio();
    startExperience();
  };

  debugBtn.onclick = async () => {
    await unlockAudio();
    document.querySelector("#camera")
      .setAttribute("wasd-controls", "enabled:true");
    startExperience();
  };
});
