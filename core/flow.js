export const FLOW = [
  { id: "intro", mode: "learn", file: "./data/ru/intro/00_intro_ai.txt", timeSec: 0 },

  {
    id: "stage1",
    mode: "quiz",
    timeSec: 25,
    parts: [
      { tag: "logic", file: "./data/ru/stage1/01_stage1_logic.txt", pick: 2 },
      { tag: "spatial", file: "./data/ru/stage1/01_stage1_spatial.txt", pick: 2 },
      { tag: "algorithm", file: "./data/ru/stage1/01_stage1_algorithm.txt", pick: 2 },
      { tag: "engineering", file: "./data/ru/stage1/01_stage1_engineering.txt", pick: 1 },
    ],
  },

  {
    id: "physics",
    mode: "quiz",
    timeSec: 35,
    parts: [
      { tag: "p1", file: "./data/ru/physics/02_physics_l1.txt", pick: 4 },
      { tag: "p2", file: "./data/ru/physics/02_physics_l2.txt", pick: 3 },
      { tag: "p3", file: "./data/ru/physics/02_physics_l3.txt", pick: 3 },
    ],
  },

  {
    id: "it",
    mode: "quiz",
    timeSec: 30,
    parts: [
      { tag: "it1", file: "./data/ru/it/03_it_l1.txt", pick: 4 },
      { tag: "it2", file: "./data/ru/it/03_it_l2.txt", pick: 3 },
      { tag: "it3", file: "./data/ru/it/03_it_l3.txt", pick: 3 },
    ],
  },
];