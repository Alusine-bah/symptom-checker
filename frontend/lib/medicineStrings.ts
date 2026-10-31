import type { Lang } from "./engine";

const en = {
  title: "Medicines guide",
  intro:
    "Educational information about medicines, summarised from named public health sources. It is not a prescription.",
  search: "Search medicines…",
  count: "medicines",
  noResults: "No medicines match your search.",
  loading: "Loading…",
  back: "← All medicines",
  notFound: "Medicine not found.",
  draft: "Draft",
  reviewed: "Reviewed",
  draftBanner:
    "Draft: this entry has not yet been checked by the clinical reviewer. It is published so that readers and reviewers can help check it. Do not use it to decide on treatment.",
  reviewedBanner: "Clinically reviewed",
  notice:
    "This is educational information summarised from the sources listed. It is not a prescription and does not replace advice from a health worker. Follow the label and the instructions of the health worker who treats you.",
  lastChecked: "Last checked",
  by: "by",
  on: "on",
  whatItIs: "What it is",
  usedFor: "What it is used for",
  howUsed: "How it is used",
  whoCareful: "Who should be careful",
  otherMedicines: "Other medicines",
  sideEffects: "Side effects",
  pregnancy: "Pregnancy and breastfeeding",
  urgent: "When to get urgent help",
  openPoints: "Open points: what is not yet confirmed",
  sourcesTitle: "Sources",
  noLink: "no link available",
  relatedTitle: "Related conditions",
  reportTitle: "Spotted a mistake or know a better source?",
  reportText: "Tell us. Every report is checked against a source before anything changes.",
  reportLink: "Report a mistake ↗",
};

export type MedStrings = typeof en;

const fr: MedStrings = {
  title: "Guide des médicaments",
  intro:
    "Informations éducatives sur les médicaments, résumées à partir de sources de santé publique citées. Ce n'est pas une ordonnance.",
  search: "Rechercher un médicament…",
  count: "médicaments",
  noResults: "Aucun médicament ne correspond à votre recherche.",
  loading: "Chargement…",
  back: "← Tous les médicaments",
  notFound: "Médicament introuvable.",
  draft: "Brouillon",
  reviewed: "Relu",
  draftBanner:
    "Brouillon : cette fiche n'a pas encore été vérifiée par le relecteur clinique. Elle est publiée pour que les lecteurs et les relecteurs puissent aider à la vérifier. Ne l'utilisez pas pour décider d'un traitement.",
  reviewedBanner: "Relue par un clinicien",
  notice:
    "Ce sont des informations éducatives résumées à partir des sources citées. Ce n'est pas une ordonnance et cela ne remplace pas l'avis d'un professionnel de santé. Suivez la notice et les instructions du professionnel de santé qui vous soigne.",
  lastChecked: "Dernière vérification",
  by: "par",
  on: "le",
  whatItIs: "Ce que c'est",
  usedFor: "À quoi il sert",
  howUsed: "Comment il s'utilise",
  whoCareful: "Qui doit être prudent",
  otherMedicines: "Autres médicaments",
  sideEffects: "Effets indésirables",
  pregnancy: "Grossesse et allaitement",
  urgent: "Quand chercher une aide urgente",
  openPoints: "Points ouverts : ce qui n'est pas encore confirmé",
  sourcesTitle: "Sources",
  noLink: "pas de lien disponible",
  relatedTitle: "Maladies liées",
  reportTitle: "Une erreur repérée ou une meilleure source ?",
  reportText: "Dites-le-nous. Chaque signalement est vérifié avec une source avant tout changement.",
  reportLink: "Signaler une erreur ↗",
};

export const MED: Record<Lang, MedStrings> = { en, fr };

export const REPORT_URL = "https://github.com/Alusine-bah/symptom-checker/issues/new";

export const STATUS_BADGE: Record<"draft" | "reviewed", string> = {
  draft: "bg-amber-100 text-amber-800",
  reviewed: "bg-emerald-100 text-emerald-800",
};
