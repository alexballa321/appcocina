// === structure.js ===
// Modifica questo file per aggiungere o togliere Cucine e Prodotti.
// ATTENZIONE: Usa le virgolette "" e metti una virgola alla fine di ogni riga tranne l'ultima.

export const staticKitchens = [
    "Melrose",
    "Mamma mia",
    "Golden CLover",
    "La Martina",
    "Corner",
    "Prime Safari",
    "Roma",
    "Hacienda Miranda",
    "Taurus 1",
    "Taurus 2",
    "Yum yum",
    "Miranda MX/Prime 400",
    "Marietta",
    "Asador La Camella",
    "Marina Beach",
    "Marylebone",
    "Forno d'oro",
    "The Brasserie Steak",
    "La Brasserie Fañabe",

];

// Qui definisci il NOME e il TIPO ("percent" o "boolean")
export const staticProducts = [
    // Esempi a Percentuale (0-25-50-100)
    { name: "Vinagre",     type: "percent" },
    { name: "Quitagrasa",    type: "percent" },
    { name: "Jabon",         type: "percent" },
    { name: "Fregasuelo",         type: "percent" },

    // Esempi Si/No (C'è o non c'è?)
    { name: "Brillo", type: "boolean" },
    { name: "Esponga",     type: "boolean" },
    { name: "Guantes",  type: "boolean" },

    // NUOVO TIPO: "count" (1, 2, 3, 4+)
    { name: "Espuma",       type: "count" },

];
