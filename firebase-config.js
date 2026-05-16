// Configuracao do Firebase - M.M System
const firebaseConfig = {
    apiKey: "AIzaSyD-8V8aUcCj9mL4n8mP2qR5tY7wQ1eT3uI",
    authDomain: "mm-system-estoque.firebaseapp.com",
    projectId: "mm-system-estoque",
    storageBucket: "mm-system-estoque.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
