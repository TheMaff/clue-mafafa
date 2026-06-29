// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// REEMPLAZA ESTE OBJETO CON EL TUYO
// const firebaseConfig = {
//     apiKey: "AIzaSyB-XXXXXXXXXXXXXXXXXXXXXXX",
//     authDomain: "clue-coquimbo.firebaseapp.com",
//     projectId: "clue-coquimbo",
//     storageBucket: "clue-coquimbo.appspot.com",
//     messagingSenderId: "1234567890",
//     appId: "1:1234567890:web:abcdef123456",
//     databaseURL: "https://clue-coquimbo-default-rtdb.firebaseio.com" // Asegúrate de que esta línea exista
// };

const firebaseConfig = {
    apiKey: "AIzaSyAzwBp3oT6ZascP2znzQBkzR7BVDUkOYxk",
    authDomain: "clue-mafafa.firebaseapp.com",
    projectId: "clue-mafafa",
    storageBucket: "clue-mafafa.firebasestorage.app",
    messagingSenderId: "300769757011",
    appId: "1:300769757011:web:e642adc1738e7a526803a6",
    measurementId: "G-RZBCEZ2H60",
    databaseURL: "https://clue-mafafa-default-rtdb.firebaseio.com"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la base de datos en tiempo real para usarla en nuestro motor
export const db = getDatabase(app);