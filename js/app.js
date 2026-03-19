// app.js - Gestión del Tema y la Navegación General
document.addEventListener("DOMContentLoaded", function () {
    const themeToggleButton = document.getElementById("theme-toggle-button");
    const tareasView = document.getElementById("tareas-view");
    const notasView = document.getElementById("notas-view");
    const subNavButtons = document.querySelectorAll(".sub-nav-btn");
  
    const THEME_STORAGE_KEY = "mi_tema_preferido";
  
    // --- Lógica del Tema ---
    function applyTheme(theme) {
      if (theme === "dark") document.body.classList.add("dark-mode");
      else document.body.classList.remove("dark-mode");
    }
  
    function loadTheme() {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
      applyTheme(savedTheme);
    }
  
    themeToggleButton.addEventListener("click", function () {
      const isDarkMode = document.body.classList.contains("dark-mode");
      const newTheme = isDarkMode ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    });
  
    // --- Lógica de Navegación SPA ---
    function showView(viewName) {
      if (viewName === "tareas") {
        tareasView.classList.remove("hidden");
        notasView.classList.add("hidden");
      } else if (viewName === "notas") {
        tareasView.classList.add("hidden");
        notasView.classList.remove("hidden");
      }
  
      subNavButtons.forEach(btn => {
        if (btn.getAttribute("data-tab") === viewName) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    }
  
    subNavButtons.forEach(btn => {
      btn.addEventListener("click", () => showView(btn.getAttribute("data-tab")));
    });
  
    // Inicialización
    loadTheme();
    showView("tareas");
  });