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
   PATH NODE — TAP (iOS) / PROXIMITY (OTHERS)
   ===================================================== */
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

    // 🔒 Detect iOS LOCALLY (no globals!)
    this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Tap-to-trigger on iOS
    if (this.isIOS) {
      this.el.addEventListener("click", () => {
        if (this.triggered) return;
        this.triggered = true;
        this.forceFinish();
      });
    }

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
    if (this.triggered) return;
    if (this.isIOS) return; // iOS uses tap, not distance

    const cam = this.el.sceneEl.camera.el.object3D.position;
    const pos = this.el.object3D.position;

    if (cam.distanceTo(pos) < 0.75) {
      this.triggered = true;
      this.forceFinish();
    }
  },

  forceFinish() {
    if (this.finished) return;
    this.finished = true;

    window.__CURRENT_AUDIO_NODE__ = this;

    if (this.sound?.components?.sound) {
      this.sound.components.sound.playSound();
      this.sound.addEventListener(
        "sound-ended",
        () => this.complete(),
        { once: true }
      );
    } else {
      this.complete();
    }
  },

  complete() {
    window.__CURRENT_AUDIO_NODE__ = null;

    this.system?.completeNode(
      this.data.id,
      this.data.next,
      this.el.object3D.position
    );

    this.el.remove();
  }
});
