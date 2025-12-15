AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] }
  },

  init() {
    this.triggered = false;
    this.system = this.el.sceneEl.systems["path-manager"];
    this.audioPlayed = this.system.played.has(this.data.id);

    if (!this.audioPlayed) {
      this.sound = document.createElement("a-entity");
      this.sound.setAttribute("sound", {
        src: `url(assets/audio/${this.data.id}.wav)`,
        autoplay: false,
        positional: true
      });
      this.el.appendChild(this.sound);
    }
  },

  tick() {
    if (this.triggered) return;

    const cam = this.el.sceneEl.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    if (cam.distanceTo(pos) < 0.75) {
      this.triggered = true;
      this.el.setAttribute("visible", "false");

      if (this.sound) {
        this.sound.components.sound.playSound();
        this.sound.addEventListener("sound-ended", () => {
          this.finish();
        }, { once: true });
      } else {
        this.finish();
      }
    }
  },

  finish() {
    this.system.completeNode(
      this.data.id,
      this.data.next,
      this.el.object3D.position
    );
    this.el.remove();
  }
});
