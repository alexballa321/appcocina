// === firebaseConfig.js ===
// Questo file gestisce la connessione al database dove salvi prodotti e cucine.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js"; // Decommenta se usi Analytics

// --- INCOLLA QUI LA TUA CONFIGURAZIONE ---
const firebaseConfig = {
    apiKey: "AIzaSyDjwQuthV3H3ia_cg1VH8pdcaae-Al8pb0",
    authDomain: "app-cocina-pro.firebaseapp.com",
    projectId: "app-cocina-pro",
    storageBucket: "app-cocina-pro.firebasestorage.app",
    messagingSenderId: "611371752076",
    appId: "1:611371752076:web:6221dadaf15752ca5cf9a9"
};;

// Inizializzazione
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

// Riferimento al documento principale
const docRef = doc(db, "inventory", "main_data");

export { db, docRef, setDoc, onSnapshot };