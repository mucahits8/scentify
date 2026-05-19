export type ScentLanguage = "tr" | "en";

const TR_LABELS: Record<string, string> = {
  fresh: "Ferah",
  woody: "Odunsu",
  sweet: "Tatlı",
  citrus: "Narenciye",
  spicy: "Baharatlı",
  aquatic: "Akuatik",
  powdery: "Pudralı",
  musky: "Misk",
  amber: "Amber",
  vanilla: "Vanilya",
  leather: "Deri",
  floral: "Çiçeksi",
  smoky: "Dumanlı",
  oriental: "Oryantal",
  green: "Yeşil",
  aromatic: "Aromatik",
  resinous: "Reçineli",
  spring: "ilkbahar",
  summer: "yaz",
  fall: "sonbahar",
  autumn: "sonbahar",
  winter: "kış",
  clean: "temiz",
  professional: "profesyonel",
  elegant: "zarif",
  modern: "modern",
  "skin scent": "tene yakın",
  warm: "sıcak",
  sexy: "çekici",
  luxurious: "lüks",
  airy: "havada",
  minimal: "minimal",
  crisp: "canlı",
  metallic: "metalik",
  polished: "rafine",
  radiant: "ışıl ışıl",
  soft: "yumuşak",
  meditative: "meditatif",
  dry: "kuru",
  dramatic: "dramatik",
  velvet: "kadifemsi",
  confident: "özgüvenli",
  decadent: "yoğun",
  cozy: "konforlu",
  addictive: "bağımlılık yaratan",
  artful: "sanatsal",
};

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

export function localizeScentLabel(label: string, language: ScentLanguage): string {
  if (language !== "tr") return label;
  return TR_LABELS[normalizeLabel(label)] ?? label;
}

export function localizeScentLabels(labels: string[], language: ScentLanguage): string[] {
  return labels.map((label) => localizeScentLabel(label, language));
}
