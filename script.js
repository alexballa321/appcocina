// === script.js ===
import { docRef, setDoc, onSnapshot } from "./firebaseConfig.js";
// Importiamo la struttura fissa
import { staticKitchens, staticProducts } from "./structure.js";

// === ELEMENTI DOM ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productsList = document.getElementById("productsList");
const saveBtn = document.getElementById("saveBtn");

// === STATO ===
let data = {};

// *** QUESTA È LA PARTE MODIFICATA ***
// "label" è quello che appare scritto sul bottone.
const levels = [
    { value: "red",    label: "0-25%",   class: "lvl-0" },
    { value: "orange", label: "25-50%",  class: "lvl-25" },
    { value: "yellow", label: "50-75%",  class: "lvl-50" },
    { value: "green",  label: "75-100%", class: "lvl-75" }
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

    staticProducts.forEach(prod => {
        // Default rosso (0-25%)
        const currentLevel = data[currentKitchen][prod] || "red";

        const row = document.createElement("div");
        row.className = "product-row";

        let html = `<span class="product-name">${prod}</span>`;
        html += `<div class="level-group">`;

        // Genera i 4 pulsanti con le etichette percentuali
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

            if (!data[currentKitchen]) data[currentKitchen] = {};
            data[currentKitchen][prod] = val;

            const parent = e.target.closest(".level-group");
            parent.querySelectorAll(".lvl-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
        };
    });
}

// === FIREBASE ===
function setupRealtimeListener() {
    console.log("Connessione...");
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const remote = docSnap.data();
            data = remote.data || {};
            refreshUI();
        }
    });
}

async function writeAllToDB() {
    saveBtn.textContent = "⏳ Guardando...";
    try {
        await setDoc(docRef, {
            kitchensArray: staticKitchens,
            productsArray: staticProducts,
            data: data
        }, { merge: true });

        saveBtn.textContent = "✅ Guardado";
        setTimeout(() => saveBtn.textContent = "💾 GUARDAR CAMBIOS", 2000);
    } catch (err) {
        console.error(err);
        saveBtn.textContent = "❌ Error";
    }
}

// === EVENTI ===
kitchenSelect.onchange = renderProductsList;
saveBtn.onclick = writeAllToDB;

// === REPORT LISTA COMPLETA (Aggiornato con percentuali) ===
const showListBtn = document.getElementById("showListBtn");
if (showListBtn) {
    showListBtn.onclick = () => {
        const newWin = window.open("", "_blank", "width=600,height=800,scrollbars=yes");
        const style = `body{font-family:'Inter',sans-serif;padding:20px;background:#f9f9f9} h2{text-align:center;color:#333} .k-block{background:white;margin-bottom:20px;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)} .k-title{font-size:1.3em;font-weight:bold;margin-bottom:10px;border-bottom:2px solid #eee;padding-bottom:5px;color:#2c3e50} .p-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0} .badge{padding:4px 8px;border-radius:4px;color:#fff;font-weight:bold;font-size:0.9em;min-width:70px;text-align:center} .bg-red{background:#e74c3c} .bg-orange{background:#f39c12} .bg-yellow{background:#f1c40f;color:#333} .bg-green{background:#2ecc71}`;

        let content = `<html><head><title>Reporte Completo</title><style>${style}</style></head><body><h2>Reporte de Niveles</h2>`;

        staticKitchens.forEach(k => {
            content += `<div class="k-block"><div class="k-title">🍳 ${k}</div>`;
            staticProducts.forEach(p => {
                const lvlValue = (data[k] && data[k][p]) ? data[k][p] : "red";

                // Trova l'etichetta corrispondente (es. "0-25%")
                const lvlObj = levels.find(l => l.value === lvlValue);
                const label = lvlObj ? lvlObj.label : "0-25%";

                content += `<div class="p-item"><span>${p}</span><span class="badge bg-${lvlValue}">${label}</span></div>`;
            });
            content += `</div>`;
        });
        content += `</body></html>`;
        newWin.document.write(content);
    };
}

refreshUI();
setupRealtimeListener();