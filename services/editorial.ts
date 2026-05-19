export interface EditorialArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: "Wear" | "Notes" | "Houses" | "Craft" | "Care";
  readMinutes: number;
  author: string;
  publishedAt: string;
  coverLabel: string;
  excerpt: string;
  tags: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  takeaway: string[];
}

export const editorialArticles: EditorialArticle[] = [
  {
    id: "journal-layering-for-real-life",
    slug: "layering-for-real-life",
    title: "Layering, But Actually Wearable",
    subtitle: "How to combine two scents without creating noise.",
    category: "Wear",
    readMinutes: 6,
    author: "Scentify Editorial",
    publishedAt: "April 30, 2026",
    coverLabel: "editorial · layering",
    excerpt: "A practical framework for pairing perfumes by texture, not by hype.",
    tags: ["Layering", "Daily Wear", "Texture"],
    sections: [
      {
        heading: "Start With Function, Not Fantasy",
        paragraphs: [
          "Most layering fails because both perfumes want to be the loudest thing in the room. Instead of asking what sounds exciting, ask what you need from the final result.",
          "If your base perfume is dry and woody, the second layer can bring humidity or brightness. If your base is already creamy and sweet, the second layer should usually sharpen the edges.",
        ],
      },
      {
        heading: "Pair by Texture",
        paragraphs: [
          "Think in material language: airy, creamy, metallic, resinous, powdery. Two airy fragrances can feel invisible together; two dense fragrances can feel heavy.",
          "The most reliable formula is one structural scent plus one tonal scent. Structure gives shape, tone gives mood.",
        ],
      },
      {
        heading: "Timing Changes Everything",
        paragraphs: [
          "Apply the heavier composition first and let it settle for 3-5 minutes. Then add the brighter perfume on pulse points.",
          "Layering is less about quantity and more about sequence. One spray too many can erase the contrast that made the pairing beautiful.",
        ],
      },
    ],
    takeaway: [
      "Use one scent for structure and one for mood.",
      "Test pairs at skin level before full wear.",
      "Change only one variable at a time.",
    ],
  },
  {
    id: "journal-fig-note-guide",
    slug: "fig-note-guide",
    title: "Understanding Fig in Modern Perfumery",
    subtitle: "Why fig can feel green, milky, and woody at once.",
    category: "Notes",
    readMinutes: 7,
    author: "Scentify Editorial",
    publishedAt: "April 26, 2026",
    coverLabel: "note study · fig",
    excerpt: "A quick map of fig leaf, fig pulp, and fig wood in niche and designer releases.",
    tags: ["Fig", "Green", "Woody"],
    sections: [
      {
        heading: "Fig Is an Accord, Not a Single Smell",
        paragraphs: [
          "When people say a perfume smells like fig, they often mean a blend of green leaf facets, creamy lactonic material, and warm woods.",
          "Some houses push fig into sunlight and salt. Others treat it as a creamy skin note. Learning the direction helps avoid blind-buy mistakes.",
        ],
      },
      {
        heading: "Three Common Fig Profiles",
        paragraphs: [
          "Leaf-forward fig: crisp, bitter-green, often paired with citrus peel. Great in warm climates.",
          "Pulp-forward fig: soft, milky, comforting. Works well in close social settings.",
          "Wood-forward fig: dry, airy, and architectural. Stronger in office and evening contexts.",
        ],
      },
      {
        heading: "How to Wear Fig Better",
        paragraphs: [
          "In high heat, fig can become sweeter than expected. Keep dosage small and avoid stacking with heavy vanilla.",
          "If your skin eats freshness quickly, a cedar or vetiver base under fig can extend the line without making it louder.",
        ],
      },
    ],
    takeaway: [
      "Identify whether you prefer leaf, pulp, or wood fig.",
      "Adjust dosage by climate.",
      "Use woods to extend, not overpower.",
    ],
  },
  {
    id: "journal-signature-rotation",
    slug: "build-a-signature-rotation",
    title: "Build a Signature Rotation in 5 Bottles",
    subtitle: "A small wardrobe that still feels expressive.",
    category: "Wear",
    readMinutes: 8,
    author: "Scentify Editorial",
    publishedAt: "April 20, 2026",
    coverLabel: "wardrobe · five bottle",
    excerpt: "A structure for daily, work, evening, warmth, and wild-card moods.",
    tags: ["Wardrobe", "Signature", "Collection"],
    sections: [
      {
        heading: "Role-Based Curation",
        paragraphs: [
          "Stop buying by occasion labels and start buying by role. Each bottle should solve a different emotional or practical need.",
          "A strong five-bottle rotation usually includes: clean daily, polished work, warm evening, comfort scent, and one strange favorite.",
        ],
      },
      {
        heading: "Avoid Redundancy",
        paragraphs: [
          "If two bottles disappear into the same silhouette after 30 minutes, one of them is probably redundant.",
          "Sample side by side, then compare dry-down. Opening notes can mislead you into thinking two perfumes are different when they are not.",
        ],
      },
      {
        heading: "Let the Rotation Evolve",
        paragraphs: [
          "Your rotation should be stable but not static. One slot can remain flexible for seasonal experiments.",
          "When a new bottle enters, ask what role it replaces. Collections grow cleaner when every addition has a purpose.",
        ],
      },
    ],
    takeaway: [
      "Curate by role, not only by note list.",
      "Cut overlap aggressively.",
      "Keep one slot experimental.",
    ],
  },
  {
    id: "journal-care-storage-myths",
    slug: "storage-myths-and-care",
    title: "Storage Myths That Age Your Perfumes Faster",
    subtitle: "What actually protects a bottle and what does not.",
    category: "Care",
    readMinutes: 5,
    author: "Scentify Editorial",
    publishedAt: "April 15, 2026",
    coverLabel: "care · storage",
    excerpt: "Heat cycles and light exposure matter more than most people realize.",
    tags: ["Storage", "Care", "Longevity"],
    sections: [
      {
        heading: "The Real Enemies",
        paragraphs: [
          "Direct sunlight and repeated heat shifts do more damage than normal room oxygen exposure.",
          "Bathrooms are often the worst place for storage because humidity and temperature swing throughout the day.",
        ],
      },
      {
        heading: "What Helps in Real Homes",
        paragraphs: [
          "A closed drawer or cabinet in a stable room is enough for most collections.",
          "Original boxes can help with light protection, but they are not mandatory if the shelf is already shaded.",
        ],
      },
      {
        heading: "When to Worry",
        paragraphs: [
          "Color shifts and top-note flattening can happen slowly. That does not always mean the perfume is ruined; it may simply have softened.",
          "If you love a bottle, wear it. Perfect storage is less useful than actually enjoying what you bought.",
        ],
      },
    ],
    takeaway: [
      "Prioritize stable temperature over fancy storage hacks.",
      "Keep bottles out of direct light.",
      "Use and enjoy your favorites regularly.",
    ],
  },
  {
    id: "journal-house-language-map",
    slug: "how-to-read-a-fragrance-house",
    title: "How to Read a Fragrance House in 20 Minutes",
    subtitle: "A practical way to understand brand DNA before blind buying.",
    category: "Houses",
    readMinutes: 7,
    author: "Scentify Editorial",
    publishedAt: "April 12, 2026",
    coverLabel: "house study · dna",
    excerpt: "Use release patterns, perfumer roster, and material signatures to decode house style.",
    tags: ["Brands", "Discovery", "Sampling"],
    sections: [
      {
        heading: "Ignore Marketing Language First",
        paragraphs: [
          "Brand storytelling is useful, but it is not the fastest way to understand what you will actually smell on skin.",
          "Start with five core releases across different years. You are looking for recurring shape, not one perfect bottle.",
        ],
      },
      {
        heading: "Track Signature Materials",
        paragraphs: [
          "Every house has comfort materials it returns to: a cedar texture, a citrus profile, a musk finish.",
          "When two or three bottles share the same dry-down mood, you are seeing the house backbone.",
        ],
      },
      {
        heading: "Read the Perfumer Roster",
        paragraphs: [
          "Some houses rotate many perfumers but keep strong creative direction. Others become extensions of one perfumer voice.",
          "Knowing who composed your favorite release helps predict what to sample next with better hit rate.",
        ],
      },
    ],
    takeaway: [
      "Sample five releases before judging a house.",
      "Follow dry-down signatures, not only openings.",
      "Use perfumer credits as a smart discovery tool.",
    ],
  },
  {
    id: "journal-concentration-myths",
    slug: "edp-vs-extrait-what-matters",
    title: "EDP vs Extrait: What Actually Changes",
    subtitle: "Concentration labels matter less than composition behavior.",
    category: "Craft",
    readMinutes: 6,
    author: "Scentify Editorial",
    publishedAt: "April 8, 2026",
    coverLabel: "craft notes · concentration",
    excerpt: "Why stronger concentration does not always mean louder projection or better performance.",
    tags: ["Craft", "Performance", "Buying"],
    sections: [
      {
        heading: "Concentration Is Only One Variable",
        paragraphs: [
          "Higher oil concentration can increase texture and persistence, but it does not guarantee bigger projection.",
          "Formula balance, volatile materials, and skin chemistry shape performance more than a single label.",
        ],
      },
      {
        heading: "Different Intent, Not Better or Worse",
        paragraphs: [
          "Many extrait versions are smoother and closer to skin. Some EDP versions feel brighter and more diffusive.",
          "Choose by wearing context: close social settings may benefit from extrait behavior, while open environments may need lift.",
        ],
      },
      {
        heading: "How to Test Fairly",
        paragraphs: [
          "Apply equal spray counts, then evaluate at 15 minutes, 2 hours, and 6 hours.",
          "Judge not just longevity, but clarity of shape. The better version is the one that keeps its identity longer.",
        ],
      },
    ],
    takeaway: [
      "Do not assume higher concentration is always louder.",
      "Compare versions by context and shape retention.",
      "Test at multiple time checkpoints.",
    ],
  },
  {
    id: "journal-citrus-longevity-playbook",
    slug: "make-citrus-last-longer",
    title: "How to Make Citrus Fragrances Last Longer",
    subtitle: "Keep sparkle without muting the freshness you bought it for.",
    category: "Care",
    readMinutes: 5,
    author: "Scentify Editorial",
    publishedAt: "April 4, 2026",
    coverLabel: "care playbook · citrus",
    excerpt: "A clean protocol for extending citrus wear without turning it heavy.",
    tags: ["Citrus", "Longevity", "Summer"],
    sections: [
      {
        heading: "Hydration First",
        paragraphs: [
          "Dry skin often burns through top notes quickly. A light, unscented moisturizer improves adhesion and slows evaporation.",
          "Let moisturizer settle for a few minutes before spraying to avoid blurring note definition.",
        ],
      },
      {
        heading: "Anchor With Transparent Woods",
        paragraphs: [
          "If your citrus disappears too fast, pair it with a soft cedar or clean musk base.",
          "Use minimal layering. The goal is to extend the arc, not convert citrus into amber.",
        ],
      },
      {
        heading: "Reapply With Precision",
        paragraphs: [
          "Instead of full re-sprays, refresh one pulse point and one fabric edge.",
          "Controlled touch-ups preserve freshness and avoid scent fatigue for you and people around you.",
        ],
      },
    ],
    takeaway: [
      "Moisturize first for better hold.",
      "Anchor citrus with transparent woods or clean musks.",
      "Top up strategically, not aggressively.",
    ],
  },
];

export function getEditorialArticleBySlug(slug: string) {
  return editorialArticles.find((article) => article.slug === slug) ?? null;
}
