const CHEST_Y = 1.3;
const STEP = 0.5;

/* =====================================================
   PATH GRAPH — AUTHORITATIVE
   ===================================================== */

const PATH_GRAPH = {
  front_1: { color: "#ffffff", next: ["front_2"] },
  front_2: { color: "#ffffff", next: ["front_3a", "front_3b"] },
  front_3a: { color: "#ffffff", next: ["front_4a", "front_4b"] },
  front_3b: { color: "#ffffff", next: ["front_4c", "front_4d"] },
  front_4a: { color: "#ffffff", next: ["front_5a"] },
  front_4b: { color: "#ffffff", next: ["front_5a"] },
  front_4c: { color: "#ffffff", next: ["front_5b"] },
  front_4d: { color: "#ffffff", next: ["front_5b"] },
  front_5a: { color: "#ffffff", next: ["end_b", "end_a"] },
  front_5b: { color: "#ffffff", next: ["end_b", "end_a"] },

  back_1: { color: "#000000", next: ["back_2"] },
  back_2: { color: "#000000", next: ["back_3a", "back_3b"] },
  back_3a: { color: "#000000", next: ["back_4a", "back_4b"] },
  back_3b: { color: "#000000", next: ["back_4c", "back_4d"] },
  back_4a: { color: "#000000", next: ["back_5a"] },
  back_4b: { color: "#000000", next: ["back_5a"] },
  back_4c: { color: "#000000", next: ["back_5b"] },
  back_4d: { color: "#000000", next: ["back_5b"] },
  back_5a: { color: "#000000", next: ["end_b", "end_a"] },
  back_5b: { color: "#000000", next: ["end_b", "end_a"] },

  left_1: { color: "#ff0000", next: ["left_2"] },
  left_2: { color: "#ff0000", next: ["left_3a", "left_3b"] },
  left_3a: { color: "#ff0000", next: ["left_4a"] },
  left_3b: { color: "#ff0000", next: ["left_4b"] },
  left_4a: { color: "#ff0000", next: ["end_b", "end_a"] },
  left_4b: { color: "#ff0000", next: ["end_b", "end_a"] },


  right_1: { color: "#0066ff", next: ["right_2"] },
  right_2: { color: "#0066ff", next: ["right_3a", "right_3b"] },
  right_3a: { color: "#0066ff", next: ["right_4a"] },
  right_3b: { color: "#0066ff", next: ["right_4b"] },
  right_4a: { color: "#0066ff", next: ["right_5a", "right_5b"] },
  right_4b: { color: "#0066ff", next: ["right_5b", "right_5c"] },
  right_5a: { color: "#0066ff", next: ["right_6a"] },
  right_5b: { color: "#0066ff", next: ["right_6b"] },
  right_5c: { color: "#0066ff", next: ["right_6c"] },
  right_6a: { color: "#0066ff", next: ["right_7"] },
  right_6b: { color: "#0066ff", next: ["right_7"] },
  right_6c: { color: "#0066ff", next: ["right_7"] },
  right_7: { color: "#0066ff", next: ["end_b", "end_a"] },

  end_a: { color: "#88ffee", next: ["explore_more"] },
  end_b: { color: "#ff4444", next: ["bomb_end"] },

  explore_more: { color: "#ffffff", next: [] },
  bomb_end: { color: "#000000", next: [] }
};
