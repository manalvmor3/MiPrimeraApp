// auth.js - Conexión real con Firebase Authentication y Firestore (Base de Datos)

// 1. Importamos las herramientas de Firebase (Usando la versión 12.11.0 que detectaste)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// NUEVO: Importamos el motor de la base de datos (Firestore)
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// 2. Las "Llaves" de tu proyecto (Tus credenciales reales)
const firebaseConfig = {
  apiKey: "AIzaSyCglhvRsl4hejLV434-ezz7do6TvOzUHgI",
  authDomain: "miprimeraapp-8394e.firebaseapp.com",
  projectId: "miprimeraapp-8394e",
  storageBucket: "miprimeraapp-8394e.firebasestorage.app",
  messagingSenderId: "490316998690",
  appId: "1:490316998690:web:8300af90b58f414324427b"
};

// 3. Inicializamos los servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// NUEVO: Inicializamos la base de datos y la compartimos globalmente
const db = getFirestore(app);
window.db = db; // Esto permite que tareas.js y notas.js vean la base de datos

// 4. Lógica de la interfaz (Cuando la página cargue)
document.addEventListener("DOMContentLoaded", function () {
    
    // Capturamos los elementos del DOM (Tu estructura original)
    const authView = document.getElementById("auth-view");
    const mainAppView = document.getElementById("main-app-view");
    const mainNav = document.getElementById("main-nav");
    const logoutBtn = document.getElementById("logout-button");
  
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const showRegisterLink = document.getElementById("show-register");
    const showLoginLink = document.getElementById("show-login");
  
    // --- Cambiar entre vistas de Login y Registro ---
    showRegisterLink.addEventListener("click", function (e) {
      e.preventDefault();
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    });
  
    showLoginLink.addEventListener("click", function (e) {
      e.preventDefault();
      registerForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    });
  
    // --- CREAR CUENTA (Registro) ---
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          alert("¡Cuenta creada con éxito! Bienvenido.");
        })
        .catch((error) => {
          alert("Error al registrarse: " + error.message);
        });
    });

    // --- INICIAR SESIÓN (Login) ---
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log("Sesión iniciada correctamente");
        })
        .catch((error) => {
          alert("Error al iniciar sesión. Comprueba tu email y contraseña.");
        });
    });

    // --- CERRAR SESIÓN (Logout) ---
    logoutBtn.addEventListener("click", function () {
      signOut(auth).then(() => {
        console.log("Sesión cerrada");
      }).catch((error) => {
        console.log("Error al cerrar sesión", error);
      });
    });

    // --- EL PORTERO VIGILANTE (El Observador de Firebase) ---
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // SI EL USUARIO ESTÁ DENTRO:
        
        // NUEVO: Guardamos el ID del usuario globalmente para que las notas sepan de quién son
        window.currentUser = user.uid;

        authView.classList.add("hidden");
        mainAppView.classList.remove("hidden");
        mainNav.classList.remove("hidden");
        logoutBtn.classList.remove("hidden");

        // NUEVO: Avisamos al resto de archivos (notas.js y tareas.js) que el usuario ya entró
        window.dispatchEvent(new Event('usuarioLogueado'));
        
      } else {
        // SI EL USUARIO ESTÁ FUERA:
        
        // NUEVO: Limpiamos el ID del usuario
        window.currentUser = null;

        mainAppView.classList.add("hidden");
        mainNav.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        authView.classList.remove("hidden");
        
        // Limpiamos los campos por seguridad
        document.getElementById("login-email").value = "";
        document.getElementById("login-password").value = "";
        document.getElementById("register-email").value = "";
        document.getElementById("register-password").value = "";
      }
    });
});