/* =====================================================
   SOFT PULSE (SUBTLE VISUAL GUIDANCE)
   ===================================================== */

AFRAME.registerComponent("soft-pulse", {
  schema: {
    min: { type: "number", default: 0.96 },
    max: { type: "number", default: 1.04 },
    duration: { type: "number", default: 2400 }
  },

  init() {
    this.el.setAttribute("animation__pulse", {
      property: "scale",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      to: `${this.data.max} ${this.data.max} ${this.data.max}`
    });
  }
});

/* =====================================================
   PATH NODE (PROXIMITY + AUDIO)
   ===================================================== */

AFRAME.registerComponent("path-node", {
  schema: {
    id: { type: "string" },
    next: { type: "array", default: [] }
  },

  init() {
    this.triggered = false;
    this.consumed = false;
    this.system = this.el.sceneEl.systems["path-manager"];

    // Visual pulse
    this.el.setAttribute("soft-pulse", "");

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

    const camPos = this.el.sceneEl.camera.el.object3D.position;
    const nodePos = this.el.object3D.position;

    if (camPos.distanceTo(nodePos) < 0.75) {
      this.triggered = true;
      this.consumed = true;

      if (this.system) {
        // 🔒 GLOBAL root lock (front_1, back_1, left_1, right_1)
        if (this.system.lockRootPath) {
          this.system.lockRootPath(this.data.id);
        }

        // 🔒 LOCAL sibling lock (branching)
        if (this.system.lockChoice) {
          this.system.lockChoice(this.data.id);
        }
      }

      // Hide visual immediately
      this.el.setAttribute("visible", "false");

      if (this.sound && this.sound.components?.sound) {
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
    if (this.system) {
      this.system.completeNode(
        this.data.id,
        this.data.next,
        this.el.object3D.position
      );
    }
    this.el.remove();
  }
});
