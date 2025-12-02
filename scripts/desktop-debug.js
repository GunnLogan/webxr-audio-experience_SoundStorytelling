document.querySelector("#debugButton").addEventListener("click",()=>{
  const overlay=document.querySelector("#startOverlay");
  const intro=document.querySelector("#intro");
  const ambient=document.querySelector("#ambient");
  const camera=document.querySelector("#camera");

  overlay.style.display="none";

  camera.setAttribute("wasd-controls","enabled:true");
  camera.setAttribute("look-controls",
    "enabled:true; pointerLockEnabled:false; magicWindowTracking:false;");

  camera.setAttribute("position","0 1.6 0");

  intro.components.sound.playSound();
  intro.addEventListener("sound-ended",()=>handleIntroEnded(intro,ambient));
});
