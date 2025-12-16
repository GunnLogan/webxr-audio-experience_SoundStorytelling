AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] },
    triggerDistance: { type: "number", default: 0.75 }
  },

  init() {
    this.triggered = false;
    this.finished = false;
    this.system = this.el.sceneEl.systems["path-manager"];
    this.sound = null;

    this.el.classList.add("clickable");

    if (window.IS_IOS) {
      this.el.addEventListener("click", () => this.handleTrigger());
    }

    if (this.data.id === "explore_more") return;

    const src = `assets/audio/${this.data.id}.wav`;
    this.sound = document.createElement("a-entity");
    this.sound.setAttribute("sound", {
      src: `url(${src})`,
      autoplay: false,
      positional: true
    });
    this.el.appendChild(this.sound);
  },

  tick() {
    if (window.IS_IOS) return;
    if (this.triggered) return;
    if (window.__CURRENT_AUDIO_NODE__ || window.__CURRENT_AUDIO_ENTITY__) return;

    const cam = this.el.sceneEl.camera?.el;
    if (!cam) return;

    const camPos = new THREE.Vector3();
    const nodePos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);
    this.el.object3D.getWorldPosition(nodePos);

    if (camPos.distanceTo(nodePos) < this.data.triggerDistance) {
      this.handleTrigger();
    }
  },

  handleTrigger() {
    if (this.triggered) return;
    if (window.__CURRENT_AUDIO_NODE__ || window.__CURRENT_AUDIO_ENTITY__) return;

    this.triggered = true;
    window.__CURRENT_AUDIO_NODE__ = this;

    // 🔥 IMMEDIATELY REMOVE SIBLING ROOTS
    this.system.active.forEach((el, key) => {
      if (key !== this.data.id) el.remove();
    });
    this.system.active.clear();

    this.el.setAttribute("visible", false);

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
      this.sound?.components?.sound?.stopSound();
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    // ✅ ALWAYS ADVANCE (natural OR X)
    this.system.completeNode(this.data.id, this.data.next);

    this.el.remove();
  }
});
