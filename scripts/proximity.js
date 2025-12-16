AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array" },
    triggerDistance: { default: 0.75 }
  },

  init() {
    this.triggered = false;
    this.finished = false;
    this.disabled = false;

    this.system = this.el.sceneEl.systems["path-manager"];
    this.el.classList.add("clickable");

    // iPhone: tap only
    if (window.IS_IOS) {
      this.el.addEventListener("click", () => this.handleTrigger());
      this.el.addEventListener("touchstart", () => this.handleTrigger());
    }

    // Load audio if it exists
    const src = `assets/audio/${this.data.id}.wav`;
    this.sound = document.createElement("a-entity");
    this.sound.setAttribute("sound", {
      src: `url(${src})`,
      autoplay: false,
      positional: true
    });
    this.el.appendChild(this.sound);
  },

  disable() {
    this.disabled = true;
  },

  tick() {
    // iPhone does not use distance triggers
    if (window.IS_IOS) return;
    if (this.triggered || this.disabled) return;
    if (window.__CURRENT_AUDIO_NODE__ || window.__CURRENT_AUDIO_ENTITY__) return;

    const cam = this.el.sceneEl.camera.el.object3D;
    const pos = this.el.object3D.position;

    if (cam.position.distanceTo(pos) < this.data.triggerDistance) {
      this.handleTrigger();
    }
  },

  handleTrigger() {
    if (this.triggered || this.disabled) return;
    if (window.__CURRENT_AUDIO_NODE__ || window.__CURRENT_AUDIO_ENTITY__) return;

    this.triggered = true;
    window.__CURRENT_AUDIO_NODE__ = this;

    // Hide node visually but keep it managed
    this.el.setAttribute("visible", false);

    if (!this.sound?.components?.sound) {
      this.finish();
      return;
    }

    this.sound.components.sound.playSound();
    this.sound.addEventListener("sound-ended", () => this.finish(), { once: true });
  },

  finish() {
    if (this.finished) return;
    this.finished = true;

    try {
      this.sound.components.sound.stopSound();
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    // Delegate progression to path-manager
    this.system.completeNode(this.data.id, this.data.next);
  }
});
