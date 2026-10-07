import type { Lang } from "./api";

const en = {
  appName: "Symptom Checker",
  navCheck: "Check symptoms",
  navEncyclopedia: "Disease encyclopedia",
  language: "Language",
  heroTitle: "Choose your region",
  heroText:
    "Diseases, and how common they are, differ from place to place. Pick your region so the results fit your situation.",
  africa: "Africa",
  otherRegions: "Other regions",
  selectedRegion: "Selected region:",
  continue: "Continue",
  chooseFirst: "Pick a region to continue",
  loading: "Loading…",
  apiError: "Cannot reach the server. Make sure the backend is running.",
  disclaimer:
    "For information only. This is not a diagnosis and does not replace a doctor or health worker. If you feel very unwell, seek medical care.",
  checkTitle: "Symptom checklist",
  checkSoon: "This screen is built in the next step.",
};

export type Strings = Record<keyof typeof en, string>;

const fr: Strings = {
  appName: "Vérificateur de symptômes",
  navCheck: "Vérifier les symptômes",
  navEncyclopedia: "Encyclopédie des maladies",
  language: "Langue",
  heroTitle: "Choisissez votre région",
  heroText:
    "Les maladies, et leur fréquence, varient d'un endroit à l'autre. Choisissez votre région pour des résultats adaptés à votre situation.",
  africa: "Afrique",
  otherRegions: "Autres régions",
  selectedRegion: "Région choisie :",
  continue: "Continuer",
  chooseFirst: "Choisissez une région pour continuer",
  loading: "Chargement…",
  apiError: "Impossible de joindre le serveur. Vérifiez que le serveur est lancé.",
  disclaimer:
    "À titre informatif uniquement. Ceci n'est pas un diagnostic et ne remplace pas un médecin ou un agent de santé. Si vous vous sentez très mal, consultez un professionnel de santé.",
  checkTitle: "Liste de symptômes",
  checkSoon: "Cet écran sera construit à l'étape suivante.",
};

export const UI: Record<Lang, Strings> = { en, fr };