import type { Lang } from "./engine";

const en = {
  title: "Describe a symptom",
  hint: "Type it your own way, for example “burning when I pass urine”, then tap a match to add it.",
  placeholder: "Type a symptom…",
  added: "Added",
  dangerSign: "Danger sign",
  noMatch:
    "We could not find that symptom in our list, so it cannot be scored. Try different words, or browse the groups below. If you feel very unwell or it is getting worse, seek medical care.",
};

export type SearchStrings = typeof en;

const fr: SearchStrings = {
  title: "Décrivez un symptôme",
  hint: "Écrivez-le à votre façon, par exemple « brûlure en urinant », puis touchez un résultat pour l'ajouter.",
  placeholder: "Écrivez un symptôme…",
  added: "Ajouté",
  dangerSign: "Signe de danger",
  noMatch:
    "Nous n'avons pas trouvé ce symptôme dans notre liste, il ne peut donc pas être évalué. Essayez d'autres mots, ou parcourez les groupes ci-dessous. Si vous vous sentez très mal ou si cela s'aggrave, consultez un professionnel de santé.",
};

export const SEARCH: Record<Lang, SearchStrings> = { en, fr };
