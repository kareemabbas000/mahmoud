/** Working-paper file letters per system page (section refs read e.g. "C·03"). */
export const PAGE_LETTER: Record<string, string> = {
  "": "A", services: "B", about: "C", team: "D", clients: "E", faq: "F", gallery: "G", careers: "H", insights: "I", contact: "K", privacy: "P", terms: "T",
};
export const letterFor = (slug: string) => PAGE_LETTER[slug] ?? "X";
