const CHEST_Y = 1.3;
const STEP = 0.5;
const IS_IOS = window.IS_IOS === true;

/* =====================================================
   PATH GRAPH — AUTHORITATIVE
   ===================================================== */

const PATH_GRAPH = {
  front_1: { color: "#ffffff", offset: { forward: STEP }, next: ["front_2"] },
  front_2: { color: "#ffffff", offset: { forward: STEP }, next: ["front_3a", "front_3b"] },
  front_3a: { color: "#ffffff", offset: { forward: STEP, right: -STEP }, next: ["front_4a", "front_4b"] },
  front_3b: { color: "#ffffff", offset: { forward: STEP, right: STEP }, next: ["front_4c", "front_4d"] },
  front_4a: { color: "#ffffff", offset: { forward: STEP }, next: ["front_5a"] },
  front_4b: { color: "#ffffff", offset: { forward: STEP }, next: ["front_5a"] },
  front_4c: { color: "#ffffff", offset: { forward: STEP }, next: ["front_5b"] },
  front_4d: { color: "#ffffff", offset: { forward: STEP }, next: ["front_5b"] },
  front_5a: { color: "#ffffff", offset: { forward: STEP }, next: ["end_b", "end_a"] },
  front_5b: { color: "#ffffff", offset: { forward: STEP }, next: ["end_b", "end_a"] },

  back_1: { color: "#000000", offset: { forward: STEP }, next: ["back_2"] },
  back_2: { color: "#000000", offset: { forward: STEP }, next: ["back_3a", "back_3b"] },
  back_3a: { color: "#000000", offset: { forward: STEP, right: -STEP }, next: ["back_4a", "back_4b"] },
  back_3b: { color: "#000000", offset: { forward: STEP, right: STEP }, next: ["back_4c", "back_4d"] },
  back_4a: { color: "#000000", offset: { forward: STEP }, next: ["back_5a"] },
  back_4b: { color: "#000000", offset: { forward: STEP }, next: ["back_5a"] },
  back_4c: { color: "#000000", offset: { forward: STEP }, next: ["back_5b"] },
  back_4d: { color: "#000000", offset: { forward: STEP }, next: ["back_5b"] },
  back_5a: { color: "#000000", offset: { forward: STEP }, next: ["end_b", "end_a"] },
  back_5b: { color: "#000000", offset: { forward: STEP }, next: ["end_b", "end_a"] },

  left_1: { color: "#ff0000", offset: { forward: STEP }, next: ["left_2"] },
  left_2: { color: "#ff0000", offset: { forward: STEP }, next: ["left_3a", "left_3b"] },
  left_3a: { color: "#ff0000", offset: { forward: STEP }, next: ["left_4a"] },
  left_3b: { color: "#ff0000", offset: { forward: STEP }, next: ["left_3a_return", "left_4b"] },
  left_3a_return: { color: "#ff0000", offset: { right: STEP }, next: ["left_4a"] },
  left_4a: { color: "#ff0000", offset: { forward: STEP }, next: ["end_b", "end_a"] },
  left_4b: { color: "#ff0000", offset: { forward: STEP }, next: ["end_b", "end_a"] },

  right_1: { color: "#0066ff", offset: { forward: STEP }, next: ["right_2"] },
  right_2: { color: "#0066ff", offset: { forward: STEP }, next: ["right_3a", "right_3b"] },
  right_3a: { color: "#0066ff", offset: { forward: STEP }, next: ["right_4a"] },
  right_3b: { color: "#0066ff", offset: { forward: STEP }, next: ["right_4b"] },
  right_4a: { color: "#0066ff", offset: { forward: STEP }, next: ["right_5a", "right_5b"] },
  right_4b: { color: "#0066ff", offset: { forward: STEP }, next: ["right_5b", "right_5c"] },
  right_5a: { color: "#0066ff", offset: { forward: STEP }, next: ["right_6a"] },
  right_5b: { color: "#0066ff", offset: { forward: STEP }, next: ["right_6b"] },
  right_5c: { color: "#0066ff", offset: { forward: STEP }, next: ["right_6c"] },
  right_6a: { color: "#0066ff", offset: { forward: STEP }, next: ["right_7"] },
  right_6b: { color: "#0066ff", offset: { forward: STEP }, next: ["right_7"] },
  right_6c: { color: "#0066ff", offset: { forward: STEP }, next: ["right_7"] },
  right_7: { color: "#0066ff", offset: { forward: STEP }, next: ["end_b", "end_a"] },

  end_a: { color: "#88ffee", offset: { center: true }, next: ["explore_more"] },
  end_b: { color: "#ff4444", offset: { center: true }, next: ["bomb_end"] },

  explore_more: { color: "#ffffff", offset: { center: true }, next: [] },
  bomb_end: { color: "#000000", offset: { center: true }, next: [] }
};

/* =====================================================
   PATH MANAGER SYSTEM
   ===================================================== */

AFRAME.registerSystem("path-manager", {
  init() {
    this.root = document.querySelector("#experienceRoot");
    this.active = new Map();
    this.played = new Set();
    this.choiceGroups = new Map();
    this.rootNodes = ["front_1", "back_1", "left_1", "right_1"];
    this.rootLocked = false;
  },

  spawnInitialDirections() {
    this.clearAll();
    this.rootLocked = false;

    if (IS_IOS) {
      // iOS: spawn ONE choice at center at a time
      this.spawnNode("front_1", this.center());
      return;
    }

    // Desktop / Android
    this.spawnNode("front_1", this.forward(1));
    this.spawnNode("back_1", this.forward(-1));
    this.spawnNode("left_1", this.right(-1));
    this.spawnNode("right_1", this.right(1));
  },

  clearAll() {
    this.root.innerHTML = "";
    this.active.clear();
    this.choiceGroups.clear();
  },

  spawnNode(id, pos, parentId = null) {
    if (this.active.has(id) || this.played.has(id)) return;

    const def = PATH_GRAPH[id];
    if (!def) return;

    const el = document.createElement("a-sphere");
    el.setAttribute("radius", 0.25);
    el.setAttribute("position", pos);
    el.setAttribute("material", {
      color: def.color,
      opacity: 0.55,
      transparent: true,
      depthWrite: false
    });

    el.setAttribute("soft-pulse", "");
    if (parentId) el.setAttribute("guidance-glow", "");
    el.setAttribute("path-node", { id, next: def.next });

    this.root.appendChild(el);
    this.active.set(id, el);
  },

  completeNode(id, nextIds) {
    if (this.played.has(id)) return;

    this.played.add(id);
    this.active.delete(id);

    if (id === "explore_more") {
      this.played.clear();
      this.spawnInitialDirections();
      return;
    }

    nextIds.forEach(nextId => {
      if (IS_IOS) {
        this.spawnNode(nextId, this.center(), id);
      } else {
        const def = PATH_GRAPH[nextId];
        const pos = def.offset.center
          ? this.center()
          : this.computePosition(
              this.sceneEl.camera.el.object3D.position,
              def.offset
            );

        this.spawnNode(nextId, pos, id);
      }
    });
  },

  computePosition(origin, offset) {
    const cam = this.sceneEl.camera.el.object3D;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const p = new THREE.Vector3(origin.x, CHEST_Y, origin.z);

    if (offset.forward) p.add(f.clone().multiplyScalar(offset.forward));
    if (offset.right) p.add(r.clone().multiplyScalar(offset.right));
    return p;
  },

  center() {
    return new THREE.Vector3(0, CHEST_Y, -1);
  },

  forward(m) {
    return { x: 0, y: CHEST_Y, z: -m };
  },

  right(m) {
    return { x: m, y: CHEST_Y, z: 0 };
  }
});
