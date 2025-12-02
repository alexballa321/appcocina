// === IMPORTAZIONI FIREBASE (V9 Modular) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === CONFIGURAZIONE FIREBASE ===
// ⚠️ COPIA E INCOLLA QUI LA TUA CONFIGURAZIONE DALLA CONSOLE FIREBASE
const firebaseConfig = {
        apiKey: "AIzaSyC9mgJNcq1tWc8GEbkRNaVBcAKwZmibDJM",
        authDomain: "appcocina-ca80f.firebaseapp.com",
        projectId: "appcocina-ca80f",
        storageBucket: "appcocina-ca80f.firebasestorage.app",
        messagingSenderId: "177298774552",
        appId: "1:177298774552:web:6273236e5f295810b5416d",
    }
;

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Riferimento al documento unico dove salveremo tutto
// Collezione: "inventory", Documento: "main_data"
const docRef = doc(db, "inventory", "main_data");

// === SELETTORI DOM ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productSelect = document.getElementById("productSelect");
const levelButtons = document.querySelectorAll(".level-btn");
const saveBtn = document.getElementById("saveBtn");
const hostBtn = document.getElementById("hostBtn");
const showTreeBtn = document.getElementById("showTreeBtn");
const hostOnlyElements = document.querySelectorAll(".host-only");

// === VARIABILI STATO ===
let kitchensArray = [];
let productsArray = [];
let data = {}; // Struttura { cucina: { prodotto: livello } }
let selectedColor = "red";
let isHost = false;
const colorMap = { red: "#e74c3c", orange: "#f39c12", yellow: "#f1c40f", green: "#2ecc71" };

// === FUNZIONE SCRITTURA SU FIREBASE ===
// Salva l'intero stato nel documento. Se non esiste, lo crea.
async function writeAllToDB() {
    console.log("Salvataggio su Firebase...");
    try {
        const payload = {
            kitchensArray,
            productsArray,
            data
        };
        // setDoc con {merge: true} aggiorna i campi esistenti o crea il documento se manca
        await setDoc(docRef, payload, { merge: true });
        console.log("Dati salvati con successo.");
    } catch (err) {
        console.error("Errore salvataggio Firebase:", err);
        alert("Errore nel salvataggio! Controlla la console.");
    }
}

// === LETTURA E REALTIME (onSnapshot) ===
// Questa funzione sostituisce sia initialLoad che il setupRealtimeListener di Supabase
function setupRealtimeListener() {
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log("Dati ricevuti da Firebase (Realtime)");
            const remoteData = docSnap.data();

            // Aggiorna le variabili locali
            kitchensArray = remoteData.kitchensArray || [];
            productsArray = remoteData.productsArray || [];
            data = remoteData.data || {};

            // Aggiorna UI
            renderSelects();
            updateSelectedLevel();
        } else {
            console.log("Nessun dato trovato. Creazione DB iniziale...");
            // Se il DB è vuoto, inizializza scrivendo array vuoti
            writeAllToDB();
        }
    }, (error) => {
        console.error("Errore ascolto Realtime:", error);
    });
}

// === LOGICA UI (Identica a prima) ===

function updateSelectedLevel() {
    const kitchen = kitchenSelect.value;
    const product = productSelect.value;
    let currentLevel = "red";

    if (kitchen && product && data[kitchen] && data[kitchen][product]) {
        currentLevel = data[kitchen][product];
    }

    levelButtons.forEach((b) => {
        b.classList.remove("selected");
        if (b.dataset.color === currentLevel) {
            b.classList.add("selected");
            selectedColor = currentLevel;
        }
    });
}

function renderSelects() {
    const currentKitchen = kitchenSelect.value;
    const currentProduct = productSelect.value;

    kitchenSelect.innerHTML = kitchensArray.map((k) => `<option value="${k}">${k}</option>`).join("");
    productSelect.innerHTML = productsArray.map((p) => `<option value="${p}">${p}</option>`).join("");

    // Tenta di mantenere la selezione corrente se esiste ancora
    if (currentKitchen && kitchensArray.includes(currentKitchen)) {
        kitchenSelect.value = currentKitchen;
    } else if (kitchensArray.length) {
        kitchenSelect.value = kitchensArray[0];
    }

    if (currentProduct && productsArray.includes(currentProduct)) {
        productSelect.value = currentProduct;
    } else if (productsArray.length) {
        productSelect.value = productsArray[0];
    }

    updateSelectedLevel();
}

// --- AVVIO APP ---
// Non serve window.onload complesso perché type="module" è deferito automaticamente
isHost = false;
hostBtn.textContent = "🔒 Modo Host";
showTreeBtn.style.display = "none";
toggleHostButtons(false);
setupRealtimeListener(); // Avvia la connessione


// === LISTENER INTERFACCIA ===

kitchenSelect.onchange = updateSelectedLevel;
productSelect.onchange = updateSelectedLevel;

levelButtons.forEach((btn) => {
    btn.onclick = () => {
        selectedColor = btn.dataset.color;
        levelButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
    };
});

saveBtn.onclick = () => {
    // Guest può salvare i livelli (come richiesto)
    const kitchen = kitchenSelect.value;
    const product = productSelect.value;

    if (!kitchen || !product) return console.log("Seleziona cucina e prodotto.");

    if (!data[kitchen]) data[kitchen] = {};
    data[kitchen][product] = selectedColor;
    writeAllToDB();
};

function toggleHostButtons(enable) {
    hostOnlyElements.forEach((btn) => {
        if (enable) btn.classList.remove("host-only");
        else btn.classList.add("host-only");
    });
}

hostBtn.onclick = () => {
    if (!isHost) {
        const pass = prompt("Ingrese contraseña para Host:");
        if (pass === "2539") {
            isHost = true;
            hostBtn.textContent = "❌ Salir Modo Host";
            showTreeBtn.style.display = "block";
            toggleHostButtons(true);
        } else {
            alert("Password errata.");
        }
    } else {
        isHost = false;
        hostBtn.textContent = "🔒 Modo Host";
        showTreeBtn.style.display = "none";
        toggleHostButtons(false);
    }
};

// Funzioni Host
document.getElementById("addKitchenBtn").onclick = () => {
    if (!isHost) return;
    const name = prompt("Nombre nueva cocina:");
    if (name && !kitchensArray.includes(name)) {
        kitchensArray.push(name);
        data[name] = {};
        writeAllToDB();
    }
};

document.getElementById("delKitchenBtn").onclick = () => {
    if (!isHost) return;
    const k = kitchenSelect.value;
    if (!k) return;
    if(!confirm(`Eliminare cucina ${k}?`)) return;

    kitchensArray = kitchensArray.filter((x) => x !== k);
    delete data[k];
    writeAllToDB();
};

document.getElementById("addProductBtn").onclick = () => {
    if (!isHost) return;
    const name = prompt("Nombre nuevo producto:");
    if (name && !productsArray.includes(name)) {
        productsArray.push(name);
        kitchensArray.forEach((k) => {
            if (!data[k]) data[k] = {};
            data[k][name] = "red"; // Default level
        });
        writeAllToDB();
    }
};

document.getElementById("delProductBtn").onclick = () => {
    if (!isHost) return;
    const p = productSelect.value;
    if (!p) return;
    if(!confirm(`Eliminare prodotto ${p}?`)) return;

    productsArray = productsArray.filter((x) => x !== p);
    kitchensArray.forEach((k) => {
        if (data[k]) delete data[k][p];
    });
    writeAllToDB();
};

// Report albero (invariato)
showTreeBtn.onclick = () => {
    const newWin = window.open("", "_blank", "width=500,height=700,scrollbars=yes");
    newWin.document.write(`
    <html><head><title>Lista</title><style>body{font-family:sans-serif;}</style></head><body>
    <h2 style="text-align:center;">Lista de Cocinas</h2>
    <div id="treeContent" style="padding:15px;"></div>
    <button id="backBtn" style="margin-top:20px;padding:10px;width:100%;">🔙 Volver</button>
    </body></html>
  `);
    const treeContent = newWin.document.getElementById("treeContent");
    kitchensArray.forEach((k) => {
        const ul = document.createElement("ul");
        const liKitchen = document.createElement("li");
        liKitchen.innerHTML = `<strong>${k}</strong>`;
        const ulProducts = document.createElement("ul");
        productsArray.forEach((p) => {
            const lvl = (data[k] && data[k][p]) ? data[k][p] : "red";
            const color = colorMap[lvl] || "#ccc";
            const liProduct = document.createElement("li");
            liProduct.innerHTML = `<span style="display:inline-block;width:100px;background:${color};color:white;text-align:center;border-radius:4px;margin:2px;">${p}</span>`;
            ulProducts.appendChild(liProduct);
        });
        liKitchen.appendChild(ulProducts);
        ul.appendChild(liKitchen);
        treeContent.appendChild(ul);
    });
    newWin.document.getElementById("backBtn").onclick = () => newWin.close();
};