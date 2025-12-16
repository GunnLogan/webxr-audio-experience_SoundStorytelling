/* =====================================================
   PLATFORM DETECTION (OPTION A)
   ===================================================== */
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

/* =====================================================
   PATH NODE
   ===================================================== */
AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] },
    triggerDistance: { type: "number", default: 0.75 }
  },

  init() {
    this.triggered = false;
    this.finished = false;
    this.isChoice = false;

    this.system = this.el.sceneEl.systems["path-manager"];
    this.sound = null;
    this._onEnded = null;

    // Make raycastable (cursor is always present, but only iOS listens)
    this.el.classList.add("clickable");

    // OPTION A: click ONLY on iOS
    if (IS_IOS) {
      this.el.addEventListener("click", () => this.handleTrigger());
    }

    // Silent node
    if (this.data.id === "explore_more") return;

    const audioSrc = `assets/audio/${this.data.id}.wav`;

    fetch(audioSrc, { method: "HEAD" })
      .then(r => {
        if (!r.ok) throw new Error();
        this.sound = document.createElement("a-entity");
        this.sound.setAttribute("sound", {
          src: `url(${audioSrc})`,
          autoplay: false,
          positional: true
        });
        this.el.appendChild(this.sound);
      })
      .catch(() => {});
  },

  tick() {
    // OPTION A: iOS NEVER uses distance
    if (IS_IOS) return;
    if (this.triggered) return;

    // Block if audio is already playing
    if (window.__CURRENT_AUDIO_NODE__ || window.__CURRENT_AUDIO_ENTITY__) return;

    const scene = this.el.sceneEl;
    if (!scene?.camera?.el) return;

    // WORLD SPACE DISTANCE (critical for AR)
    const camWorld = new THREE.Vector3();
    const nodeWorld = new THREE.Vector3();
    scene.camera.el.object3D.getWorldPosition(camWorld);
    this.el.object3D.getWorldPosition(nodeWorld);

    if (camWorld.distanceTo(nodeWorld) < this.data.triggerDistance) {
      this.handleTrigger();
    }
  },

  /* =====================================================
     TRIGGER ENTRY
     ===================================================== */
  handleTrigger() {
    if (this.triggered) return;

    // Never trigger if something else is playing
    if (window.__CURRENT_AUDIO_NODE__ || window.__CURRENT_AUDIO_ENTITY__) return;

    this.triggered = true;
    this.isChoice = true;

    this.el.setAttribute("visible", false);
    window.__CURRENT_AUDIO_NODE__ = this;

    // Silent node → immediate finish
    if (!this.sound?.components?.sound) {
      this.forceFinish();
      return;
    }

    this.sound.components.sound.playSound();
    this._onEnded = () => this.forceFinish();
    this.sound.addEventListener("sound-ended", this._onEnded, { once: true });
  },

  /* =====================================================
     FINISH (NATURAL OR SKIP)
     ===================================================== */
  forceFinish() {
    if (this.finished) return;
    this.finished = true;

    try {
      this.sound?.components?.sound?.stopSound();
      this.sound?.removeEventListener("sound-ended", this._onEnded);
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    if (this.isChoice) {
      this.system?.lockRootPath?.(this.data.id);
      this.system?.lockChoice?.(this.data.id);

      this.system?.completeNode(
        this.data.id,
        this.data.next,
        this.el.object3D.position
      );
    }

    this.el.remove();
  }
});
