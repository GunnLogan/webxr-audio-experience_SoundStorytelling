/* =====================================================
   PATH NODE
   - Desktop / Android: distance trigger
   - iPhone (iOS): tap trigger
   ===================================================== */

const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] }
  },

  init() {
    this.triggered = false;
    this.finished = false;
    this.system = this.el.sceneEl.systems["path-manager"];
    this.sound = null;
    this._onEnded = null;

    // 🔹 iOS ONLY — tap to trigger
    if (IS_IOS) {
      this.el.addEventListener("click", () => this.handleTrigger());
      this.el.addEventListener("touchstart", () => this.handleTrigger());
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
    // ❌ iOS does NOT use distance triggering
    if (IS_IOS) return;

    if (this.triggered) return;

    const cam = this.el.sceneEl.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    if (cam.distanceTo(pos) < 0.75) {
      this.handleTrigger();
    }
  },

  /* =====================================================
     SINGLE ENTRY POINT
     ===================================================== */
  handleTrigger() {
    if (this.triggered) return;
    this.triggered = true;

    this.el.removeAttribute("guidance-glow");
    this.el.setAttribute("visible", false);

    window.__CURRENT_AUDIO_NODE__ = this;

    if (!this.sound?.components?.sound) {
      this.forceFinish();
      return;
    }

    this.sound.components.sound.playSound();
    this._onEnded = () => this.forceFinish();
    this.sound.addEventListener("sound-ended", this._onEnded, { once: true });
  },

  /* =====================================================
     SAFE FINISH — AUTHORITATIVE
     ===================================================== */
  forceFinish() {
    if (this.finished) return;
    this.finished = true;

    try {
      this.sound?.components?.sound?.stopSound();
      this.sound?.removeEventListener("sound-ended", this._onEnded);
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    this.system?.lockRootPath?.(this.data.id);
    this.system?.lockChoice?.(this.data.id);

    this.system?.completeNode(
      this.data.id,
      this.data.next,
      this.el.object3D.position
    );

    this.el.remove();
  }
});
