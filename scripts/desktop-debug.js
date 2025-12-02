window.onload = () => {

  const debugButton = document.querySelector("#debugButton");

  if (!debugButton) {
    console.error("ERROR: #debugButton not found in DOM");
    return;
  }

  debugButton.addEventListener("click", () => {
    const overlay = document.querySelector("#startOverlay");
    const intro = document.querySelector("#intro");
    const ambient = document.querySelector("#ambient");
    const camera = document.querySelector("#camera");

    overlay.style.display = "none";

    // Enable WASD + mouse
    camera.setAttribute("wasd-controls", "enabled:true");
    camera.setAttribute(
      "look-controls",
      "enabled:true; pointerLockEnabled:false; magicWindowTracking:false;"
    );
    camera.setAttribute("position", "0 1.6 0");

    // Play intro for debug mode
    intro.components.sound.playSound();
    intro.addEventListener("sound-ended", () =>
      handleIntroEnded(intro, ambient)
    );
  });

};
