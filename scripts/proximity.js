/* =====================================================
   PLATFORM DETECTION (SINGLE SOURCE OF TRUTH)
   ===================================================== */
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

/* =====================================================
   SOFT PULSE + GENTLE BOUNCE
   ===================================================== */
AFRAME.registerComponent("soft-pulse", {
  schema: {
    scaleMax: { type: "number", default: 1.03 },
    bounce: { type: "number", default: 0.025 },
    duration: { type: "number", default: 2600 }
  },

  init() {
    const el = this.el;
    const y = el.object3D.position.y;

    el.setAttribute("animation__scale", {
      property: "scale",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      to: `${this.data.scaleMax} ${this.data.scaleMax} ${this.data.scaleMax}`
    });

    el.setAttribute("animation__bounce", {
      property: "position",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      to: `${el.object3D.position.x} ${y + this.data.bounce} ${el.object3D.position.z}`
    });
  }
});

/* =====================================================
   GUIDANCE GLOW
   ===================================================== */
AFRAME.registerComponent("guidance-glow", {
  init() {
    this.el.setAttribute("material", "emissive", "#ffffff");
    this.el.setAttribute("material", "emissiveIntensity", 0.25);

    this.el.setAttribute("animation__glow", {
      property: "material.emissiveIntensity",
      from: 0.25,
      to: 0.7,
      dir: "alternate",
      dur: 1800,
      easing: "easeInOutSine",
      loop: true
    });
  },

  remove() {
    this.el.removeAttribute("animation__glow");
    this.el.setAttribute("material", "emissiveIntensity", 0);
  }
});

/* =====================================================
   PATH NODE
   - iOS: TAP to trigger
   - Desktop/Android: DISTANCE to trigger
   - Audio completion unlocks next nodes
   ===================================================== */
AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] }
  },

  init() {
    this.triggered = false;
    this.finished = false;
    this.isChoice = false;

    this.system = this.el.sceneEl.systems["path-manager"];
    this.sound = null;
    this._onEnded = null;

    // iOS → tap
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
    // iOS does not use distance triggers
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
    this.isChoice = true;

    // Visual + guidance cleanup
    this.el.removeAttribute("guidance-glow");
    this.el.removeAttribute("soft-pulse");
    this.el.setAttribute("visible", false);

    // Register as current audio node
    window.__CURRENT_AUDIO_NODE__ = this;

    // Silent nodes finish immediately
    if (!this.sound?.components?.sound) {
      this.forceFinish();
      return;
    }

    // Play audio
    this.sound.components.sound.playSound();

    this._onEnded = () => this.forceFinish();
    this.sound.addEventListener("sound-ended", this._onEnded, { once: true });
  },

  /* =====================================================
     SAFE FINISH — SAME PATH FOR NATURAL END & SKIP
     ===================================================== */
  forceFinish() {
    if (this.finished) return;
    this.finished = true;

    try {
      this.sound?.components?.sound?.stopSound();
      this.sound?.removeEventListener("sound-ended", this._onEnded);
    } catch {}

    window.__CURRENT_AUDIO_NODE__ = null;

    // Unlock next nodes ONLY now (after audio fully finished)
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
