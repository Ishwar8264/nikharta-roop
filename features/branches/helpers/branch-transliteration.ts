import Sanscript from "sanscript";

const DEVANAGARI_PATTERN = /[\u0900-\u097F]/;
const LATIN_PATTERN = /[A-Za-z]/;
const ROMAN_TO_HINDI_WORDS: Record<string, string> = {
  bangalore: "बैंगलोर",
  bengaluru: "बेंगलुरु",
  bihar: "बिहार",
  branch: "ब्रांच",
  darbhanga: "दरभंगा",
  delhi: "दिल्ली",
  gurgaon: "गुरुग्राम",
  gurugram: "गुरुग्राम",
  ishwar: "ईश्वर",
  jaipur: "जयपुर",
  kolkata: "कोलकाता",
  lucknow: "लखनऊ",
  mumbai: "मुंबई",
  nikharta: "निखरता",
  noida: "नोएडा",
  patna: "पटना",
  pune: "पुणे",
  roop: "रूप",
  sahani: "साहनी",
  salon: "सैलून",
  studio: "स्टूडियो",
};
const HINDI_TO_ROMAN_WORDS = Object.fromEntries(
  Object.entries(ROMAN_TO_HINDI_WORDS).map(([roman, hindi]) => [hindi, roman]),
);

// Converts roman branch names into Devanagari for the Hindi field.
export function toHindiName(value: string) {
  if (!LATIN_PATTERN.test(value)) return value;

  return value
    .split(/(\s+)/)
    .map((part) => toHindiWord(part))
    .join("");
}

// Converts Devanagari branch names into a readable roman value.
export function toEnglishName(value: string) {
  if (!DEVANAGARI_PATTERN.test(value)) return value;

  return titleCase(
    value
      .split(/(\s+)/)
      .map((part) => HINDI_TO_ROMAN_WORDS[part] ?? toEnglishWord(part))
      .join(""),
  );
}

export function hasHindiText(value: string) {
  return DEVANAGARI_PATTERN.test(value);
}

export function hasLatinText(value: string) {
  return LATIN_PATTERN.test(value);
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toHindiWord(value: string) {
  const normalizedValue = value.toLowerCase();

  return ROMAN_TO_HINDI_WORDS[normalizedValue] ?? Sanscript.t(
    toItrantsHindiWord(normalizedValue),
    "itrans",
    "devanagari",
    { syncope: true },
  );
}

function toEnglishWord(value: string) {
  return Sanscript.t(value, "devanagari", "itrans")
    .replace(/M/g, "n")
    .replace(/A/g, "a")
    .replace(/I/g, "i");
}

function toItrantsHindiWord(value: string) {
  return value
    .replace(/rbh/g, "rabh")
    .replace(/nga\b/g, "Mgaa")
    .replace(/ng/g, "Mg")
    .replace(/har\b/g, "hAra")
    .replace(/ai/g, "ai")
    .replace(/ee/g, "I")
    .replace(/oo/g, "U");
}
