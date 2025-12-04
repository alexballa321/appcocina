// === script.js ===
import { docRef, setDoc, onSnapshot } from "./firebaseConfig.js";

// === ELEMENTI DOM ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productsList = document.getElementById("productsList");
const saveBtn = document.getElementById("saveBtn");
const showListBtn = document.getElementById("showListBtn");

// Elementi Modale
const modal = document.getElementById("reportModal");
const backArrow = document.getElementById("backArrow"); // <--- NUOVA FRECCIA
const closeBtnBottom = document.getElementById("closeBtnBottom");
const modalBody = document.getElementById("modalBody");

// === LA TUA STRUTTURA ===
const staticKitchens = [
    "Cocina Principal",
    "Barra",
    "Parrilla",
    "Postres"
];

const staticProducts = [
    "Hamburguesa",
    "Papas Fritas",
    "Ensalada Caesar",
    "Gaseosa",
    "Cerveza",
    "Helado",
    "Café",
    "Agua Mineral"
];

// === STATO ===
let data = {};

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
        await setDoc(docRef, { kitchensArray: staticKitchens, productsArray: staticProducts, data: data }, { merge: true });
        saveBtn.textContent = "✅ Guardado";
        setTimeout(() => saveBtn.textContent = "💾 GUARDAR", 2000);
    } catch (err) {
        console.error(err);
        saveBtn.textContent = "❌ Error";
    }
}

// === LOGICA LISTA (MODALE) ===
function openModal() {
    modalBody.innerHTML = "";

    staticKitchens.forEach(k => {
        const kDiv = document.createElement("div");
        kDiv.className = "report-kitchen";
        kDiv.textContent = `🍳 ${k}`;
        modalBody.appendChild(kDiv);

        staticProducts.forEach(p => {
            const lvlValue = (data[k] && data[k][p]) ? data[k][p] : "red";
            const lvlObj = levels.find(l => l.value === lvlValue);
            const label = lvlObj ? lvlObj.label : "0-25%";

            const itemDiv = document.createElement("div");
            itemDiv.className = "report-item";

            let bgClass = "";
            if(lvlValue === "red") bgClass = "#e74c3c";
            if(lvlValue === "orange") bgClass = "#f39c12";
            if(lvlValue === "yellow") bgClass = "#f1c40f";
            if(lvlValue === "green") bgClass = "#2ecc71";
            let textColor = (lvlValue === "yellow") ? "#333" : "#fff";

            itemDiv.innerHTML = `
                <span>${p}</span>
                <span class="report-badge" style="background:${bgClass}; color:${textColor}">${label}</span>
            `;
            modalBody.appendChild(itemDiv);
        });
    });

    modal.style.display = "block"; // Usa block per coprire tutto
}

function closeModal() {
    modal.style.display = "none";
}

// Eventi
if(kitchenSelect) kitchenSelect.onchange = renderProductsList;
if(saveBtn) saveBtn.onclick = writeAllToDB;
if(showListBtn) showListBtn.onclick = openModal;
if(backArrow) backArrow.onclick = closeModal; // <--- CLICK SULLA FRECCIA
if(closeBtnBottom) closeBtnBottom.onclick = closeModal;

// Avvio
refreshUI();
setupRealtimeListener();