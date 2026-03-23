// app.js - Gestión del Tema y la Navegación General
// Esperamos a que el HTML esté completamente cargado para evitar errores de referencia
document.addEventListener("DOMContentLoaded", function () {
  // 1. Captura de elementos del DOM (El "tablero de control")
  const themeToggleButton = document.getElementById("theme-toggle-button");
  const tareasView = document.getElementById("tareas-view");
  const notasView = document.getElementById("notas-view");
  const subNavButtons = document.querySelectorAll(".sub-nav-btn");

  // 2. Constantes de configuración
  const THEME_STORAGE_KEY = "mi_tema_preferido"; // Llave para guardar el estado en LocalStorage

  // --- Lógica del Tema (Claro / Oscuro) ---
  
  // Cambia el aspecto visual añadiendo o quitando la clase CSS 'dark-mode' del body
  function applyTheme(theme) {
    if (theme === "dark") document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }

  // Recupera la preferencia guardada por el usuario (o por defecto 'light')
  function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
    applyTheme(savedTheme);
  }

  // Evento para el botón de cambio de tema
  themeToggleButton.addEventListener("click", function () {
    const isDarkMode = document.body.classList.contains("dark-mode");
    const newTheme = isDarkMode ? "light" : "dark"; // Invertimos el estado
    applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme); // Persistimos el cambio
  });

  // --- Lógica de Navegación SPA (Single Page Application) ---
  
  // Alterna qué sección (view) se muestra ocultando la otra
  function showView(viewName) {
    if (viewName === "tareas") {
      tareasView.classList.remove("hidden"); // Mostramos Tareas
      notasView.classList.add("hidden");    // Ocultamos Notas
    } else if (viewName === "notas") {
      tareasView.classList.add("hidden");   // Ocultamos Tareas
      notasView.classList.remove("hidden"); // Mostramos Notas
    }

    // Actualizamos los botones de navegación para marcar cuál está activo
    subNavButtons.forEach(btn => {
      if (btn.getAttribute("data-tab") === viewName) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  }

  // Asignamos el evento de clic a cada botón del sub-menú
  subNavButtons.forEach(btn => {
    btn.addEventListener("click", () => showView(btn.getAttribute("data-tab")));
  });

  // --- Inicialización: Estado al abrir la app ---
  loadTheme();        // Aplicamos el tema guardado
  showView("tareas"); // Por defecto empezamos siempre en la vista de Tareas

  // --- REGISTRO DEL SERVICE WORKER (Para PWA) ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('ServiceWorker registrado con éxito:', registration.scope);
        })
        .catch(error => {
          console.log('Error al registrar el ServiceWorker:', error);
        });
    });
  }

});