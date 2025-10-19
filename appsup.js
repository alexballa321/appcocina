// === SELETTORI ===
const kitchenSelect = document.getElementById("kitchenSelect");
const productSelect = document.getElementById("productSelect");
const levelButtons = document.querySelectorAll(".level-btn");
const saveBtn = document.getElementById("saveBtn");
const hostBtn = document.getElementById("hostBtn");
const showTreeBtn = document.getElementById("showTreeBtn");
const hostOnlyElements = document.querySelectorAll(".host-only");

let kitchensArray = [];
let productsArray = [];
let data = {};
let selectedColor = "red";
let isHost = false;
const colorMap = { red: "#e74c3c", orange: "#f39c12", yellow: "#f1c40f", green: "#2ecc71" };

// === CONFIGURAZIONE SUPABASE ===
// Assicurati che window.supabase sia disponibile dal file supabase-config.js
const supabase = window.supabase;
const TABLE_NAME = "inventory_data"; // Nome della tabella nel DB Supabase
const DATA_ROW_ID = 1; // ID della riga dove salvare i dati

// === FUNZIONE SCRITTURA (Scrive lo stato COMPLETO nel DB) ===
async function writeAllToDB() {
    console.log("Tentativo di salvataggio su Supabase...");
    try {
        const payload = {
            kitchensArray,
            productsArray,
            data
        };

        // 1. Tenta di AGGIORNARE (update) la riga con id=1.
        const { error: updateError, count } = await supabase
            .from(TABLE_NAME)
            .update({ data_json: payload }, { count: 'exact' }) // Aggiorna la colonna JSONB con il nuovo stato
            .eq('id', DATA_ROW_ID);

        // Se l'update ha successo (count > 0) o l'errore è 'non trovato', proviamo l'insert (prima esecuzione)
        if (updateError && updateError.code !== 'PGRST116') { // PGRST116 è spesso 'no rows found'
            // Se c'è un errore significativo, proviamo l'insert
            console.warn("Update fallito, tentativo di Insert (forse prima esecuzione):", updateError.message);

            const { error: insertError } = await supabase
                .from(TABLE_NAME)
                .insert([{ id: DATA_ROW_ID, data_json: payload }]);

            if (insertError) {
                throw new Error(insertError.message);
            }
        }

        // Se updateError è null (aggiornamento riuscito o insert riuscito), il salvataggio è ok.
        console.log("Dati salvati con successo su Supabase.");

    } catch (err) {
        console.error("Errore durante il salvataggio su Supabase:", err);
    }
}

// === AGGIORNA LIVELLO SELEZIONATO IN BASE AI DATI DB ===
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


// === RENDER SELECT ===
function renderSelects() {
    const currentKitchen = kitchenSelect.value;
    const currentProduct = productSelect.value;

    kitchenSelect.innerHTML = kitchensArray.map((k) => `<option value="${k}">${k}</option>`).join("");
    productSelect.innerHTML = productsArray.map((p) => `<option value="${p}">${p}</option>`).join("");

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

// === LETTURA E SINCRONIZZAZIONE DB (ON-SNAPSHOT in Supabase Realtime) ===

// 1. Funzione per applicare i dati letti
function applyData(val) {
    // Usa i dati ricevuti, altrimenti fallback a array/oggetti vuoti
    const payload = val ? val.data_json || {} : {};

    kitchensArray = payload.kitchensArray || [];
    productsArray = payload.productsArray || [];
    data = payload.data || {};

    // Se la riga è stata creata ma data_json è vuoto, inizializziamo la struttura e salviamo.
    if (Object.keys(payload).length === 0 && val && val.data_json === null) {
        // Questa condizione può avvenire se l'insert manuale iniziale aveva data_json=null
        writeAllToDB();
    }

    renderSelects();
    updateSelectedLevel();
    console.log("Dati sincronizzati da Supabase.");
}

// 2. Lettura Iniziale
async function initialLoad() {
    const { data: records, error } = await supabase
        .from(TABLE_NAME)
        .select('data_json')
        .eq('id', DATA_ROW_ID);

    if (error) {
        console.error("Errore nel caricamento iniziale:", error);
        return;
    }

    if (records.length > 0) {
        applyData(records[0]);
    } else {
        // Nessuna riga con DATA_ROW_ID trovata, inizializza a vuoto e salverà
        applyData(null);
    }
}


// 3. Setup della Sincronizzazione in Tempo Reale
function setupRealtimeListener() {
    supabase
        .channel('inventory_changes') // Nome del canale
        .on(
            'postgres_changes',
            {
                event: 'UPDATE', // Ascolta solo gli UPDATE sulla riga specifica
                schema: 'public',
                table: TABLE_NAME,
                filter: `id=eq.${DATA_ROW_ID}`
            },
            (payload) => {
                // payload.new contiene i dati aggiornati
                console.log("Evento Realtime ricevuto, aggiornamento...");
                applyData(payload.new);
            }
        )
        .subscribe(); // Avvia l'ascolto
}

// --- AVVIO DELL'APP ---
window.onload = () => {
    isHost = false;
    hostBtn.textContent = "🔒 Modo Host";
    showTreeBtn.style.display = "none";
    toggleHostButtons(false);

    initialLoad(); // Carica i dati una prima volta
    setupRealtimeListener(); // Avvia il listener in tempo reale
};

// Quando l'utente cambia cucina o prodotto, aggiorna il livello visualizzato
kitchenSelect.onchange = updateSelectedLevel;
productSelect.onchange = updateSelectedLevel;


// === SELEZIONE LIVELLO VISUALE ===
levelButtons.forEach((btn) => {
    btn.onclick = () => {
        selectedColor = btn.dataset.color;
        levelButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
    };
});

// === SALVA LIVELLO SU DB (MODIFICATO: RIMOSSO BLOCCO HOST) ===
saveBtn.onclick = () => {
    // *** MODIFICA: La restrizione è stata rimossa, quindi gli utenti Guest (anon) possono salvare ***
    // if (!isHost) return console.log("Permesso negato: Solo la Modalità Host può salvare i livelli.");

    const kitchen = kitchenSelect.value;
    const product = productSelect.value;

    if (!kitchen || !product) return console.log("Errore: Seleziona cucina e prodotto.");

    if (!data[kitchen]) data[kitchen] = {};
    data[kitchen][product] = selectedColor;
    writeAllToDB(); // SALVATAGGIO PERMANENTE
    console.log(`Livello salvato: ${product} in ${kitchen} impostato su ${selectedColor}`);
};

// === MOSTRA/NASCONDI PULSANTI HOST ===
function toggleHostButtons(enable) {
    hostOnlyElements.forEach((btn) => {
        if (enable) {
            btn.classList.remove("host-only");
        } else {
            btn.classList.add("host-only");
        }
    });
}

// === FUNZIONE HOST ON/OFF ===
hostBtn.onclick = () => {
    if (!isHost) {
        const pass = prompt("Ingrese contraseña para Host:");
        if (pass === "2539") { // PASSWORD FISSA
            isHost = true;
            hostBtn.textContent = "❌ Salir Modo Host";
            showTreeBtn.style.display = "block";
            toggleHostButtons(true);
            console.log("Modalità Host attivata con successo.");
        } else {
            console.log("Password errata. Accesso Host negato.");
        }
    } else {
        isHost = false;
        hostBtn.textContent = "🔒 Modo Host";
        showTreeBtn.style.display = "none";
        toggleHostButtons(false);
        console.log("Modalità Host disattivata. Torna in modalità Guest.");
    }
};

// === BOTTONI HOST: AGGIUNTA CUCINA ===
document.getElementById("addKitchenBtn").onclick = () => {
    if (!isHost) return console.log("Permesso negato: Solo la Modalità Host può aggiungere cucine.");
    const name = prompt("Nombre nueva cocina:");
    if (name && !kitchensArray.includes(name)) {
        kitchensArray.push(name);
        data[name] = {};
        writeAllToDB();
    }
};

// === BOTTONI HOST: ELIMINA CUCINA ===
document.getElementById("delKitchenBtn").onclick = () => {
    if (!isHost) return console.log("Permesso negato: Solo la Modalità Host può eliminare cucine.");
    const k = kitchenSelect.value;
    if (!k) return;

    console.log(`Richiesta eliminazione: ${k}. Esecuzione immediata.`);

    kitchensArray = kitchensArray.filter((x) => x !== k);
    delete data[k];

    if (kitchensArray.length > 0) kitchenSelect.value = kitchensArray[0];
    else kitchenSelect.value = "";

    writeAllToDB();
    console.log(`Cucina '${k}' eliminata permanentemente.`);
};

// === BOTTONI HOST: AGGIUNTA PRODOTTO ===
document.getElementById("addProductBtn").onclick = () => {
    if (!isHost) return console.log("Permesso negato: Solo la Modalità Host può aggiungere prodotti.");
    const name = prompt("Nombre nuevo producto:");
    if (name && !productsArray.includes(name)) {
        productsArray.push(name);
        kitchensArray.forEach((k) => {
            if (!data[k]) data[k] = {};
            data[k][name] = "red";
        });
        writeAllToDB();
    }
};

// === BOTTONI HOST: ELIMINA PRODOTTO ===
document.getElementById("delProductBtn").onclick = () => {
    if (!isHost) return console.log("Permesso negato: Solo la Modalità Host può eliminare prodotti.");
    const p = productSelect.value;
    if (!p) return;

    console.log(`Richiesta eliminazione: ${p}. Esecuzione immediata.`);

    productsArray = productsArray.filter((x) => x !== p);

    kitchensArray.forEach((k) => {
        if (data[k]) delete data[k][p];
    });

    if (productsArray.length > 0) productSelect.value = productsArray[0];
    else productSelect.value = "";

    writeAllToDB();
    console.log(`Prodotto '${p}' eliminato permanentemente.`);
};

// === LISTA VISIVA ===
showTreeBtn.onclick = () => {
    const newWin = window.open("", "_blank", "width=500,height=700,scrollbars=yes");
    newWin.document.write(`
    <h2 style="text-align:center;">Lista de Cocinas</h2>
    <div id="treeContent" style="padding:15px;"></div>
    <button id="backBtn" style="margin-top:20px;padding:10px;border-radius:6px;border:none;background:#3498db;color:white;cursor:pointer;">🔙 Volver</button>
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
            liProduct.innerHTML = `
        <div style="width:90px;height:22px;background:${color};
        border-radius:6px;color:white;display:flex;
        align-items:center;justify-content:center;font-weight:600;">
        ${p}</div>`;
            ulProducts.appendChild(liProduct);
        });
        liKitchen.appendChild(ulProducts);
        ul.appendChild(liKitchen);
        treeContent.appendChild(ul);
    });
    newWin.document.getElementById("backBtn").onclick = () => newWin.close();
};