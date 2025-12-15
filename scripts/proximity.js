/* =====================================================
   SOFT PULSE + GENTLE BOUNCE (ROBUST)
   ===================================================== */

AFRAME.registerComponent("soft-pulse", {
  schema: {
    scaleMin: { type: "number", default: 0.97 },
    scaleMax: { type: "number", default: 1.03 },
    bounce:   { type: "number", default: 0.025 }, // meters
    duration: { type: "number", default: 2600 }
  },

  init() {
    const el = this.el;

    // Capture starting values ONCE
    const startScale = el.getAttribute("scale") || { x: 1, y: 1, z: 1 };
    const startY = el.object3D.position.y;

    // Scale breathing (to scaleMax)
    el.setAttribute("scale", `${startScale.x} ${startScale.y} ${startScale.z}`);
    el.setAttribute("animation__pulse_scale", {
      property: "scale",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      from: `${this.data.scaleMin} ${this.data.scaleMin} ${this.data.scaleMin}`,
      to: `${this.data.scaleMax} ${this.data.scaleMax} ${this.data.scaleMax}`
    });

    // ✅ Bounce safely on Y only (never fights positioning)
    el.setAttribute("animation__pulse_y", {
      property: "object3D.position.y",
      dir: "alternate",
      dur: this.data.duration,
      easing: "easeInOutSine",
      loop: true,
      from: startY,
      to: startY + this.data.bounce
    });
  }
});

/* =====================================================
   GUIDANCE GLOW (NEXT STEP ONLY)
   ===================================================== */

AFRAME.registerComponent("guidance-glow", {
  init() {
    // Ensure emissive exists
    this.el.setAttribute("material", {
      emissive: "#ffffff",
      emissiveIntensity: 0.2
    });

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
    this.system = this.el.sceneEl.systems["path-manager"];

    // Base visual presence
    this.el.setAttribute("soft-pulse", "");

    // Optional audio (silent nodes allowed)
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
    if (this.triggered) return;

    const camPos = this.el.sceneEl.camera.el.object3D.position;
    const nodePos = this.el.object3D.position;

    if (camPos.distanceTo(nodePos) < 0.75) {
      this.triggered = true;

      // Stop visual guidance instantly
      this.el.removeAttribute("guidance-glow");
      this.el.removeAttribute("soft-pulse");
      this.el.removeAttribute("animation__pulse_scale");
      this.el.removeAttribute("animation__pulse_y");

      if (this.system) {
        // Global root lock
        if (typeof this.system.lockRootPath === "function") {
          this.system.lockRootPath(this.data.id);
        }

        // Local sibling lock
        if (typeof this.system.lockChoice === "function") {
          this.system.lockChoice(this.data.id);
        }
      }

      // Hide node immediately (audio continues if present)
      this.el.setAttribute("visible", "false");

      if (this.sound && this.sound.components && this.sound.components.sound) {
        this.sound.components.sound.playSound();
        this.sound.addEventListener("sound-ended", () => this.finish(), { once: true });
      } else {
        this.finish();
      }
    }
  },

  finish() {
    if (this.system && typeof this.system.completeNode === "function") {
      this.system.completeNode(this.data.id, this.data.next, this.el.object3D.position);
    }
    this.el.remove();
  }
});
