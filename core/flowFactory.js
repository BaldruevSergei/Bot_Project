export function makeFlow(lang = "ru") {
  return [
    { id: "intro", mode: "learn", timeSec: 20, file: `./data/${lang}/intro/00_intro_ai.txt` },

    // Stage 1: квотный рандом по 4 направлениям
    {
      id: "stage1",
      mode: "quiz",
      timeSec: 25,
      parts: [
        { tag: "logic",       file: `./data/${lang}/stage1/01_stage1_logic.txt`,       pick: 2 },
        { tag: "spatial",     file: `./data/${lang}/stage1/01_stage1_spatial.txt`,     pick: 2 },
        { tag: "algorithm",   file: `./data/${lang}/stage1/01_stage1_algorithm.txt`,   pick: 2 },
        { tag: "engineering", file: `./data/${lang}/stage1/01_stage1_engineering.txt`, pick: 2 },
      ],
    },

    // Physics
    {
      id: "physics",
      mode: "quiz",
      timeSec: 25,
      parts: [
        { tag: "physics", file: `./data/${lang}/physics/02_physics_l1.txt`, pick: 2 },
        { tag: "physics", file: `./data/${lang}/physics/02_physics_l2.txt`, pick: 2 },
        { tag: "physics", file: `./data/${lang}/physics/02_physics_l3.txt`, pick: 2 },
      ],
    },

    // IT
    {
      id: "it",
      mode: "quiz",
      timeSec: 25,
      parts: [
        { tag: "it", file: `./data/${lang}/it/03_it_l1.txt`, pick: 2 },
        { tag: "it", file: `./data/${lang}/it/03_it_l2.txt`, pick: 2 },
        { tag: "it", file: `./data/${lang}/it/03_it_l3.txt`, pick: 2 },
        { tag: "it", file: `./data/${lang}/it/03_it_logic.txt`, pick: 2 },
      ],
    },
  ];
}