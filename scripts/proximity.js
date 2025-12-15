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
   GUIDANCE GLOW (NEXT STEP ONLY)
   ===================================================== */

AFRAME.registerComponent("guidance-glow", {
  init() {
    this.el.setAttribute("material", "emissiveIntensity", 0.2);

    this.el.setAttribute("animation__glow", {
      property: "material.emissiveIntensity",
      from: 0.2,
      to: 0.6,
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

    // Always pulse (base visual presence)
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

      // Remove glow immediately (this node is no longer a target)
      this.el.removeAttribute("guidance-glow");

      if (this.system) {
        // 🔒 GLOBAL root lock
        this.system.lockRootPath?.(this.data.id);

        // 🔒 LOCAL sibling lock
        this.system.lockChoice?.(this.data.id);
      }

      // Hide visual immediately (fade handled elsewhere)
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
