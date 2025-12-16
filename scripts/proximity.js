AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] },
    triggerDistance: { type: "number", default: 0.75 }
  },

  init() {
    this.triggered = false;
    this.finished = false;
    this.isExploreMore = this.data.id === "explore_more";

    this.system = this.el.sceneEl.systems["path-manager"];
    this.sound = null;
    this._onEnded = null;

    this.el.classList.add("clickable");

    // iOS tap ONLY
    if (window.IS_IOS) {
      this.el.addEventListener("click", () => this.handleTrigger());
    }

    // 🔥 RE-ARM proximity ONLY for real nodes
    this._rearm = () => {
      if (this.isExploreMore) return;
      if (!this.finished) this.triggered = false;
    };
    this.el.sceneEl.addEventListener("audio-finished", this._rearm);

    if (this.isExploreMore) return;

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
    if (window.IS_IOS || this.triggered) return;
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
    this.el.setAttribute("visible", false);

    if (!this.sound?.components?.sound) {
      this.forceFinish(false);
      return;
    }

    this.sound.components.sound.playSound();
    this._onEnded = () => this.forceFinish(false); // ✅ natural end
    this.sound.addEventListener("sound-ended", this._onEnded, { once: true });
  },

  /* =====================================================
     FINISH
     forced = true  → stop audio ONLY
     forced = false → advance story
     ===================================================== */
  forceFinish(forced = false) {
    if (this.finished) return;
    this.finished = true;

    try {
      this.sound?.components?.sound?.stopSound();
      this.sound?.removeEventListener("sound-ended", this._onEnded);
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    // ✅ ONLY advance if NOT forced
    if (!forced) {
      this.system?.completeNode(this.data.id, this.data.next);
    }

    this.el.remove();
  },

  remove() {
    this.el.sceneEl.removeEventListener("audio-finished", this._rearm);
  }
});
