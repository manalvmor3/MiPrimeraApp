// auth.js - Lógica visual de Autenticación (Simulada por ahora)
document.addEventListener("DOMContentLoaded", function () {
    // 1. Capturamos las "pantallas" principales
    const authView = document.getElementById("auth-view");
    const mainAppView = document.getElementById("main-app-view");
    const mainNav = document.getElementById("main-nav");
    const logoutBtn = document.getElementById("logout-button");
  
    // 2. Capturamos los elementos dentro del Login/Registro
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const showRegisterLink = document.getElementById("show-register");
    const showLoginLink = document.getElementById("show-login");
  
    // --- Lógica para alternar entre "Iniciar Sesión" y "Registrarse" ---
    
    showRegisterLink.addEventListener("click", function (e) {
      e.preventDefault(); // Evita que el enlace recargue la página
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    });
  
    showLoginLink.addEventListener("click", function (e) {
      e.preventDefault();
      registerForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    });
  
    // --- Lógica de Simulación de Login/Registro ---
  
    // Función que se ejecuta cuando el login es "exitoso"
    function loginSuccess() {
      // Ocultamos la pantalla de login
      authView.classList.add("hidden");
      
      // Mostramos la app, el menú y el botón de cerrar sesión
      mainAppView.classList.remove("hidden");
      mainNav.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
    }
  
    // Al intentar Iniciar Sesión (Simulacro)
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault(); // Evita que el formulario recargue la página al enviarse
      // NOTA: Aquí en la Misión 2 conectaremos con Firebase
      console.log("Simulando inicio de sesión...");
      loginSuccess();
    });
  
    // Al intentar Registrarse (Simulacro)
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // NOTA: Aquí en la Misión 2 conectaremos con Firebase
      console.log("Simulando registro...");
      loginSuccess();
    });
  
    // --- Lógica para Cerrar Sesión ---
    logoutBtn.addEventListener("click", function () {
      // Volvemos a ocultar la app y el botón
      mainAppView.classList.add("hidden");
      mainNav.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      
      // Volvemos a mostrar la pantalla de login
      authView.classList.remove("hidden");
      
      // Limpiamos los campos de texto por seguridad
      document.getElementById("login-email").value = "";
      document.getElementById("login-password").value = "";
      document.getElementById("register-email").value = "";
      document.getElementById("register-password").value = "";
    });
  });