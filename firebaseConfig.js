// === firebaseConfig.js ===
// Questo file gestisce la connessione al database dove salvi prodotti e cucine.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js"; // Decommenta se usi Analytics

// --- INCOLLA QUI LA TUA CONFIGURAZIONE ---
const firebaseConfig = {
    apiKey: "AIzaSyC9mgJNcq1tWc8GEbkRNaVBcAKwZmibDJM",
    authDomain: "appcocina-ca80f.firebaseapp.com",
    projectId: "appcocina-ca80f",
    storageBucket: "appcocina-ca80f.firebasestorage.app",
    messagingSenderId: "177298774552",
    appId: "1:177298774552:web:6273236e5f295810b5416d",
};

// Inizializzazione
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

// Riferimento al documento principale
const docRef = doc(db, "inventory", "main_data");

export { db, docRef, setDoc, onSnapshot };