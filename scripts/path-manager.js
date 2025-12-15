const CHEST_Y = 1.3;
const STEP = 0.5;

/* =====================================================
   PATH GRAPH — AUTHORITATIVE
   ===================================================== */

const PATH_GRAPH = {
  /* FRONT — WHITE */
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

  /* BACK — BLACK */
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

  /* LEFT — RED */
  left_1: { color: "#ff0000", offset: { forward: STEP }, next: ["left_2"] },
  left_2: { color: "#ff0000", offset: { forward: STEP }, next: ["left_3a", "left_3b"] },
  left_3a: { color: "#ff0000", offset: { forward: STEP }, next: ["left_4a"] },
  left_3b: { color: "#ff0000", offset: { forward: STEP }, next: ["left_3a_return", "left_4b"] },
  left_3a_return: { color: "#ff0000", offset: { right: STEP }, next: ["left_4a"] },
  left_4a: { color: "#ff0000", offset: { forward: STEP }, next: ["end_b", "end_a"] },
  left_4b: { color: "#ff0000", offset: { forward: STEP }, next: ["end_b", "end_a"] },

  /* RIGHT — BLUE */
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

  /* END */
  end_a: { color: "#88ffee", offset: { forward: STEP, right: STEP }, next: ["explore_more"] },
  end_b: { color: "#ff4444", offset: { forward: STEP, right: -STEP }, next: ["bomb_end"] },

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
    this.spawnNode("front_1", this.forward(1));
    this.spawnNode("back_1", this.forward(-1));
    this.spawnNode("left_1", this.right(-1));
    this.spawnNode("right_1", this.right(1));
  },

  clearAll() {
    this.root.innerHTML = "";
    this.active.clear();
    this.choiceGroups
