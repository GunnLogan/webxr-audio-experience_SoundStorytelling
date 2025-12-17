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

    // 🍎 iOS: TAP ONLY (NO touchstart!)
    if (window.IS_IOS) {
      this.el.addEventListener("click", () => this.handleTrigger());
    }

    // Load audio
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
    // iOS does NOT use proximity
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

    // 🔒 LOCK FIRST
    this.triggered = true;
    window.__CURRENT_AUDIO_NODE__ = this;

    // 🍎 iOS — ENSURE AUDIO CONTEXT IS RESUMED
    if (window.IS_IOS) {
      const ctx = AFRAME.audioContext;
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    }

    // 🔥 REMOVE ALL SIBLING NODES
    this.system.active.forEach((el, key) => {
      if (key !== this.data.id) {
        const comp = el.components["path-node"];
        if (comp) comp.disable();
        el.remove();
      }
    });
    this.system.active.clear();

    // Hide this node visually
    this.el.setAttribute("visible", false);

    // ▶️ PLAY AUDIO
    if (!this.sound?.components?.sound) {
      this.finish();
      return;
    }

    this.sound.components.sound.playSound();
    this.sound.addEventListener(
      "sound-ended",
      () => this.finish(),
      { once: true }
    );
  },

  finish() {
    if (this.finished) return;
    this.finished = true;

    try {
      this.sound.components.sound.stopSound();
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    // Hand off to path-manager
    this.system.completeNode(this.data.id, this.data.next);
  }
});
