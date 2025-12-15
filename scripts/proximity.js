AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] }
  },

  init() {
    this.triggered = false;
    this.consumed = false;
    this.system = this.el.sceneEl.systems["path-manager"];

    // Audio is optional (silent nodes allowed)
    const audioSrc = `assets/audio/${this.data.id}.wav`;
    this.sound = null;

    fetch(audioSrc, { method: "HEAD" })
      .then(res => {
        if (!res.ok) throw new Error();
        this.sound = document.createElement("a-entity");
        this.sound.setAttribute("sound", {
          src: `url(${audioSrc})`,
          autoplay: false,
          positional: true
        });
        this.el.appendChild(this.sound);
      })
      .catch(() => {
        this.sound = null;
      });
  },

  tick() {
    if (this.triggered || this.consumed) return;

    const cam = this.el.sceneEl.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    if (cam.distanceTo(pos) < 0.75) {
      this.triggered = true;
      this.consumed = true;

      // 🔒 LOCK THE CHOICE IMMEDIATELY
      this.system.lockChoice(this.data.id);

      this.el.setAttribute("visible", "false");

      if (this.sound) {
        this.sound.components.sound.playSound();
        this.sound.addEventListener(
          "sound-ended",
          () => this.finish(),
          { once: true }
        );
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
