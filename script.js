// === script.js ===
import { docRef, setDoc, onSnapshot } from "./firebaseConfig.js";
import { staticKitchens, staticProducts } from "./structure.js";

// === ELEMENTI DOM ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productsList = document.getElementById("productsList");
const saveBtn = document.getElementById("saveBtn");
const showListBtn = document.getElementById("showListBtn");

// Modale
const modal = document.getElementById("reportModal");
const backArrow = document.getElementById("backArrow");
const closeBtnBottom = document.getElementById("closeBtnBottom");
const modalBody = document.getElementById("modalBody");

// === STATO ===
let data = {};

// === CONFIGURAZIONE TIPI ===

// 1. Percentuale
const percentLevels = [
    { value: "red",    label: "0-25%",   class: "lvl-0" },
    { value: "orange", label: "25-50%",  class: "lvl-25" },
    { value: "yellow", label: "50-75%",  class: "lvl-50" },
    { value: "green",  label: "75-100%", class: "lvl-75" }
];

// 2. Booleano (Si/No)
const booleanLevels = [
    { value: "no",  label: "NO", class: "lvl-0" },
    { value: "yes", label: "SI", class: "lvl-75" }
];

// 3. Conteggio (NUOVO)
const countLevels = [
    { value: "c1", label: "1",  class: "lvl-0" },  // Rosso
    { value: "c2", label: "2",  class: "lvl-25" }, // Arancione
    { value: "c3", label: "3",  class: "lvl-50" }, // Giallo
    { value: "c4", label: "4+", class: "lvl-75" }  // Verde
];

// === INTERFACCIA UTENTE ===
function refreshUI() {
    renderKitchenSelect();
    renderProductsList();
}

function renderKitchenSelect() {
    if (!kitchenSelect) return;
    const current = kitchenSelect.value;
    kitchenSelect.innerHTML = staticKitchens.map(k => `<option value="${k}">${k}</option>`).join("");

    if (current && staticKitchens.includes(current)) {
        kitchenSelect.value = current;
    } else if (staticKitchens.length > 0) {
        kitchenSelect.value = staticKitchens[0];
    }
}

function renderProductsList() {
    if (!productsList) return;
    productsList.innerHTML = "";
    const currentKitchen = kitchenSelect.value;
    if (!currentKitchen) return;

    if (!data[currentKitchen]) data[currentKitchen] = {};

    staticProducts.forEach(prodObj => {
        const prodName = prodObj.name;
        const prodType = prodObj.type; // 'percent', 'boolean', o 'count'

        // Determina il valore di default in base al tipo
        let currentVal = data[currentKitchen][prodName];
        if (!currentVal) {
            if (prodType === 'boolean') currentVal = 'no';
            else if (prodType === 'count') currentVal = 'c1'; // Default 1
            else currentVal = 'red'; // Default 0-25%
        }

        const row = document.createElement("div");
        row.className = "product-row";

        let html = `<span class="product-name">${prodName}</span>`;
        html += `<div class="level-group">`;

        // SELEZIONE ARRAY GIUSTO
        let levelsToRender = percentLevels; // Default
        if (prodType === 'boolean') levelsToRender = booleanLevels;
        if (prodType === 'count') levelsToRender = countLevels;

        levelsToRender.forEach(lvl => {
            const isActive = (currentVal === lvl.value) ? "active" : "";

            // Classi CSS extra per stile specifico
            let extraClass = "";
            if (prodType === 'boolean') extraClass = "btn-bool";
            if (prodType === 'count') extraClass = "btn-count"; // Nuova classe

            html += `<button class="lvl-btn ${lvl.class} ${extraClass} ${isActive}" 
                     data-prod="${prodName}" data-val="${lvl.value}">
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

            if (!data[currentKitchen]) data[currentKitchen] = {};
            data[currentKitchen][prod] = val;

            // Feedback visivo immediato
            const parent = e.target.closest(".level-group");
            parent.querySelectorAll(".lvl-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
        };
    });
}

// === FIREBASE ===
function setupRealtimeListener() {
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const remote = docSnap.data();
            data = remote.data || {};
            refreshUI();
        }
    });
}

async function writeAllToDB() {
    saveBtn.textContent = "⏳...";
    try {
        await setDoc(docRef, {
            kitchensArray: staticKitchens,
            productsArray: staticProducts,
            data: data
        }, { merge: true });

        saveBtn.textContent = "✅ Guardado";
        setTimeout(() => saveBtn.textContent = "💾 GUARDAR", 2000);
    } catch (err) {
        console.error(err);
        saveBtn.textContent = "❌ Error";
    }
}

// === LISTA MODALE (Report) ===
function openModal() {
    modalBody.innerHTML = "";

    staticKitchens.forEach(k => {
        const kDiv = document.createElement("div");
        kDiv.className = "report-kitchen";
        kDiv.textContent = `🍳 ${k}`;
        modalBody.appendChild(kDiv);

        staticProducts.forEach(prodObj => {
            const p = prodObj.name;
            const type = prodObj.type;

            let val = data[k] && data[k][p];

            // Gestione Default per il report
            if (!val) {
                if (type === 'boolean') val = 'no';
                else if (type === 'count') val = 'c1';
                else val = 'red';
            }

            let label = val;
            let bgClass = "#ccc";
            let textColor = "#fff";

            // Trova etichetta e colore in base al tipo
            let levelConfig = percentLevels;
            if (type === 'boolean') levelConfig = booleanLevels;
            if (type === 'count') levelConfig = countLevels;

            const foundLvl = levelConfig.find(l => l.value === val);
            if (foundLvl) {
                label = foundLvl.label;

                // Mappa colori CSS manuale per il report (il modale non vede le classi esterne a volte)
                if (foundLvl.class.includes("lvl-0")) bgClass = "#e74c3c"; // Rosso
                if (foundLvl.class.includes("lvl-25")) bgClass = "#f39c12"; // Arancione
                if (foundLvl.class.includes("lvl-50")) { bgClass = "#f1c40f"; textColor = "#333"; } // Giallo
                if (foundLvl.class.includes("lvl-75")) bgClass = "#2ecc71"; // Verde
            }

            const itemDiv = document.createElement("div");
            itemDiv.className = "report-item";
            itemDiv.innerHTML = `
                <span>${p}</span>
                <span class="report-badge" style="background:${bgClass}; color:${textColor}">${label}</span>
            `;
            modalBody.appendChild(itemDiv);
        });
    });

    modal.style.display = "block";
}

function closeModal() { modal.style.display = "none"; }

if(kitchenSelect) kitchenSelect.onchange = renderProductsList;
if(saveBtn) saveBtn.onclick = writeAllToDB;
if(showListBtn) showListBtn.onclick = openModal;
if(backArrow) backArrow.onclick = closeModal;
if(closeBtnBottom) closeBtnBottom.onclick = closeModal;

refreshUI();
setupRealtimeListener();