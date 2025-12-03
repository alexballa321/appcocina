// === script.js ===
import { docRef, setDoc, onSnapshot } from "./firebaseConfig.js";
// Importiamo la struttura fissa
import { staticKitchens, staticProducts } from "./structure.js";

// === ELEMENTI DOM ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productsList = document.getElementById("productsList");
const saveBtn = document.getElementById("saveBtn");

// === STATO ===
let kitchensArray = staticKitchens;
let productsArray = staticProducts;
let data = {};

const levels = [
    { value: "red", label: "0-25%", class: "lvl-0" },
    { value: "orange", label: "25-50%", class: "lvl-25" },
    { value: "yellow", label: "50-75%", class: "lvl-50" },
    { value: "green", label: "75-100%", class: "lvl-75" }
];

// === INTERFACCIA UTENTE (RENDER) ===
function refreshUI() {
    renderKitchenSelect();
    renderProductsList();
}

function renderKitchenSelect() {
    // Se l'elemento non esiste ancora nel DOM, ferma tutto
    if (!kitchenSelect) return;

    const current = kitchenSelect.value;
    kitchenSelect.innerHTML = kitchensArray.map(k => `<option value="${k}">${k}</option>`).join("");

    if (current && kitchensArray.includes(current)) {
        kitchenSelect.value = current;
    } else if (kitchensArray.length > 0) {
        kitchenSelect.value = kitchensArray[0];
    }
}

function renderProductsList() {
    if (!productsList) return;

    productsList.innerHTML = "";
    const currentKitchen = kitchenSelect.value;

    if (!currentKitchen) {
        productsList.innerHTML = "<p style='text-align:center; padding:20px;'>Nessuna cucina selezionata.</p>";
        return;
    }

    if (!data[currentKitchen]) data[currentKitchen] = {};

    productsArray.forEach(prod => {
        // Prende il colore salvato o usa 'red' come default
        const currentLevel = data[currentKitchen][prod] || "red";

        const row = document.createElement("div");
        row.className = "product-row";

        let html = `<span class="product-name">${prod}</span>`;
        html += `<div class="level-group">`;
        levels.forEach(lvl => {
            const isActive = (currentLevel === lvl.value) ? "active" : "";
            html += `<button class="lvl-btn ${lvl.class} ${isActive}" 
                     data-prod="${prod}" data-val="${lvl.value}">
                     ${lvl.label}
                     </button>`;
        });
        html += `</div>`;

        row.innerHTML = html;
        productsList.appendChild(row);
    });

    attachRowListeners();
}

function attachRowListeners() {
    const currentKitchen = kitchenSelect.value;

    document.querySelectorAll(".lvl-btn").forEach(btn => {
        btn.onclick = (e) => {
            const prod = e.target.dataset.prod;
            const val = e.target.dataset.val;

            // Aggiorna dato locale
            if (!data[currentKitchen]) data[currentKitchen] = {};
            data[currentKitchen][prod] = val;

            // Aggiorna UI locale subito (feedback visivo istantaneo)
            const parent = e.target.closest(".level-group");
            parent.querySelectorAll(".lvl-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
        };
    });
}

// === FIREBASE: LOGICA ===
function setupRealtimeListener() {
    console.log("In attesa di Firebase...");
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log("Dati ricevuti!");
            const remote = docSnap.data();
            // Aggiorniamo SOLO i colori, la struttura è fissa
            data = remote.data || {};
            // Ridisegniamo l'interfaccia con i nuovi colori
            refreshUI();
        }
    }, (error) => {
        console.error("Errore connessione:", error);
    });
}

async function writeAllToDB() {
    saveBtn.textContent = "⏳ Guardando...";
    try {
        await setDoc(docRef, {
            kitchensArray: staticKitchens,
            productsArray: staticProducts,
            data: data // Salviamo i colori correnti
        }, { merge: true });

        saveBtn.textContent = "✅ Guardado";
        setTimeout(() => saveBtn.textContent = "💾 GUARDAR CAMBIOS", 2000);
    } catch (err) {
        console.error(err);
        alert("Error al guardar: " + err.message);
        saveBtn.textContent = "❌ Error";
    }
}

// === EVENTI ===
if (kitchenSelect) kitchenSelect.onchange = renderProductsList;
if (saveBtn) saveBtn.onclick = writeAllToDB;
// Listener per il bottone lista (se presente nell'HTML)
const showListBtn = document.getElementById("showListBtn");
if (showListBtn) {
    showListBtn.onclick = () => {
        const newWin = window.open("", "_blank", "width=600,height=800,scrollbars=yes");
        // ... (Logica report invariata, se vuoi te la rimetto)
        newWin.document.write("<h1>Lista Completa...</h1>"); // Semplificato per test
    };
}

// === AVVIO ===
// 1. Disegna SUBITO la struttura (Cucine e Prodotti) senza aspettare internet
console.log("Render iniziale...");
refreshUI();

// 2. Poi connettiti a Firebase per scaricare i colori
setupRealtimeListener();// === script.js ===
import { docRef, setDoc, onSnapshot } from "./firebaseConfig.js";
// Importiamo la struttura fissa
import { staticKitchens, staticProducts } from "./structure.js";

// === ELEMENTI DOM ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productsList = document.getElementById("productsList");
const saveBtn = document.getElementById("saveBtn");

// === STATO ===
let kitchensArray = staticKitchens;
let productsArray = staticProducts;
let data = {};

const levels = [
    { value: "red", label: "0-25%", class: "lvl-0" },
    { value: "orange", label: "25-50%", class: "lvl-25" },
    { value: "yellow", label: "50-75%", class: "lvl-50" },
    { value: "green", label: "75-100%", class: "lvl-75" }
];

// === INTERFACCIA UTENTE (RENDER) ===
function refreshUI() {
    renderKitchenSelect();
    renderProductsList();
}

function renderKitchenSelect() {
    // Se l'elemento non esiste ancora nel DOM, ferma tutto
    if (!kitchenSelect) return;

    const current = kitchenSelect.value;
    kitchenSelect.innerHTML = kitchensArray.map(k => `<option value="${k}">${k}</option>`).join("");

    if (current && kitchensArray.includes(current)) {
        kitchenSelect.value = current;
    } else if (kitchensArray.length > 0) {
        kitchenSelect.value = kitchensArray[0];
    }
}

function renderProductsList() {
    if (!productsList) return;

    productsList.innerHTML = "";
    const currentKitchen = kitchenSelect.value;

    if (!currentKitchen) {
        productsList.innerHTML = "<p style='text-align:center; padding:20px;'>Nessuna cucina selezionata.</p>";
        return;
    }

    if (!data[currentKitchen]) data[currentKitchen] = {};

    productsArray.forEach(prod => {
        // Prende il colore salvato o usa 'red' come default
        const currentLevel = data[currentKitchen][prod] || "red";

        const row = document.createElement("div");
        row.className = "product-row";

        let html = `<span class="product-name">${prod}</span>`;
        html += `<div class="level-group">`;
        levels.forEach(lvl => {
            const isActive = (currentLevel === lvl.value) ? "active" : "";
            html += `<button class="lvl-btn ${lvl.class} ${isActive}" 
                     data-prod="${prod}" data-val="${lvl.value}">
                     ${lvl.label}
                     </button>`;
        });
        html += `</div>`;

        row.innerHTML = html;
        productsList.appendChild(row);
    });

    attachRowListeners();
}

function attachRowListeners() {
    const currentKitchen = kitchenSelect.value;

    document.querySelectorAll(".lvl-btn").forEach(btn => {
        btn.onclick = (e) => {
            const prod = e.target.dataset.prod;
            const val = e.target.dataset.val;

            // Aggiorna dato locale
            if (!data[currentKitchen]) data[currentKitchen] = {};
            data[currentKitchen][prod] = val;

            // Aggiorna UI locale subito (feedback visivo istantaneo)
            const parent = e.target.closest(".level-group");
            parent.querySelectorAll(".lvl-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
        };
    });
}

// === FIREBASE: LOGICA ===
function setupRealtimeListener() {
    console.log("In attesa di Firebase...");
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log("Dati ricevuti!");
            const remote = docSnap.data();
            // Aggiorniamo SOLO i colori, la struttura è fissa
            data = remote.data || {};
            // Ridisegniamo l'interfaccia con i nuovi colori
            refreshUI();
        }
    }, (error) => {
        console.error("Errore connessione:", error);
    });
}

async function writeAllToDB() {
    saveBtn.textContent = "⏳ Guardando...";
    try {
        await setDoc(docRef, {
            kitchensArray: staticKitchens,
            productsArray: staticProducts,
            data: data // Salviamo i colori correnti
        }, { merge: true });

        saveBtn.textContent = "✅ Guardado";
        setTimeout(() => saveBtn.textContent = "💾 GUARDAR CAMBIOS", 2000);
    } catch (err) {
        console.error(err);
        alert("Error al guardar: " + err.message);
        saveBtn.textContent = "❌ Error";
    }
}

// === EVENTI ===
if (kitchenSelect) kitchenSelect.onchange = renderProductsList;
if (saveBtn) saveBtn.onclick = writeAllToDB;
// Listener per il bottone lista (se presente nell'HTML)
const showListBtn = document.getElementById("showListBtn");
if (showListBtn) {
    showListBtn.onclick = () => {
        const newWin = window.open("", "_blank", "width=600,height=800,scrollbars=yes");
        // ... (Logica report invariata, se vuoi te la rimetto)
        newWin.document.write("<h1>Lista Completa...</h1>"); // Semplificato per test
    };
}

// === AVVIO ===
// 1. Disegna SUBITO la struttura (Cucine e Prodotti) senza aspettare internet
console.log("Render iniziale...");
refreshUI();

// 2. Poi connettiti a Firebase per scaricare i colori
setupRealtimeListener();