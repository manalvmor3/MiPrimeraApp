// tareas.js - Lógica exclusiva de Tareas
document.addEventListener("DOMContentLoaded", function () {
  // Referencias a los elementos del DOM de la vista de tareas
  const taskInput = document.getElementById("task-input");
  const addButton = document.getElementById("add-button");
  const taskList = document.getElementById("task-list");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Constantes de almacenamiento local
  const STORAGE_KEY = "mi_lista_tareas";
  const FILTER_STORAGE_KEY = "mi_filtro_tareas";

  // Variables para controlar el arrastrar y soltar
  let draggedItem = null;
  let dragPlaceholder = null;
  let dragInitialIndex = null;

  // Función para serializar y guardar las tareas en LocalStorage
  function saveTasks() {
    const tasks = [];
    taskList.querySelectorAll(".task-item").forEach(item => {
      const textSpan = item.querySelector(".task-text");
      tasks.push({
        text: textSpan.textContent,
        completed: textSpan.classList.contains("completed"),
      });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // Función para refrescar los contadores en los botones de filtro
  function updateFilterCounts() {
    const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
    let pendingCount = 0, completedCount = 0;
    
    items.forEach(item => {
      if (item.classList.contains("task-item--completed")) completedCount++;
      else pendingCount++;
    });

    filterButtons.forEach(btn => {
      const filter = btn.getAttribute("data-filter");
      if (filter === "all") btn.textContent = "Todas (" + items.length + ")";
      else if (filter === "pending") btn.textContent = "Pendientes (" + pendingCount + ")";
      else if (filter === "completed") btn.textContent = "Completadas (" + completedCount + ")";
    });
  }

  // Cambia la clase CSS del padre para filtrar visualmente las tareas
  function applyFilter(filterValue) {
    taskList.classList.remove("filter-all", "filter-pending", "filter-completed");
    taskList.classList.add("filter-" + filterValue);
    filterButtons.forEach(btn => {
      if (btn.getAttribute("data-filter") === filterValue) btn.classList.add("active");
      else btn.classList.remove("active");
    });
    localStorage.setItem(FILTER_STORAGE_KEY, filterValue);
  }

  // Crea dinámicamente un elemento de lista (li) para cada tarea
  function createTaskElement(text, completed) {
    const listItem = document.createElement("li");
    listItem.classList.add("task-item");
    if (completed) listItem.classList.add("task-item--completed");
    listItem.draggable = true;

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = text;
    taskTextSpan.classList.add("task-text");
    if (completed) taskTextSpan.classList.add("completed");

    // Evento: Clic para marcar/desmarcar tarea
    taskTextSpan.addEventListener("click", function () {
      taskTextSpan.classList.toggle("completed");
      listItem.classList.toggle("task-item--completed");
      saveTasks();
      updateFilterCounts();
    });

    // Evento: Doble clic para editar el texto
    taskTextSpan.addEventListener("dblclick", function () {
      const originalText = taskTextSpan.textContent;
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = originalText;
      editInput.classList.add("task-edit-input");

      listItem.replaceChild(editInput, taskTextSpan);
      editInput.focus();
      editInput.select();

      // Función interna para cerrar la edición
      function finishEdit(saveChanges) {
        let newText = editInput.value.trim();
        if (!saveChanges || newText === "") newText = originalText;
        taskTextSpan.textContent = newText;
        listItem.replaceChild(taskTextSpan, editInput);
        saveTasks();
      }

      editInput.addEventListener("keydown", e => {
        if (e.key === "Enter") finishEdit(true);
        else if (e.key === "Escape") finishEdit(false);
      });
      editInput.addEventListener("blur", () => finishEdit(true));
    });

    // Botón de borrar tarea
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.classList.add("delete-button");
    deleteButton.addEventListener("click", function () {
      taskList.removeChild(listItem);
      saveTasks();
      updateFilterCounts();
    });

    // --- Lógica de Drag & Drop (Inicio) ---
    listItem.addEventListener("dragstart", function (e) {
      draggedItem = listItem;
      listItem.classList.add("dragging");
      const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      dragInitialIndex = Array.from(items).indexOf(listItem);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });

    // --- Lógica de Drag & Drop (Fin) ---
    listItem.addEventListener("dragend", function () {
      listItem.classList.remove("dragging");
      if (dragPlaceholder && dragPlaceholder.parentNode) {
        dragPlaceholder.parentNode.removeChild(dragPlaceholder);
      }
      dragPlaceholder = null; draggedItem = null; dragInitialIndex = null;
    });

    // --- Lógica de Drag & Drop (Movimiento) ---
    listItem.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (!draggedItem || draggedItem === listItem || listItem.classList.contains("task-placeholder")) return;

      const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      const currentIndex = Array.from(items).indexOf(listItem);
      const rect = listItem.getBoundingClientRect();
      const dropIndex = (e.clientY - rect.top) < (rect.height / 2) ? currentIndex : currentIndex + 1;

      if (dropIndex === dragInitialIndex || (dropIndex === dragInitialIndex + 1 && (e.clientY - rect.top) < (rect.height / 2))) {
        if (dragPlaceholder && dragPlaceholder.parentNode) {
          dragPlaceholder.parentNode.removeChild(dragPlaceholder);
          dragPlaceholder = null;
        }
        return;
      }

      if (!dragPlaceholder) {
        dragPlaceholder = document.createElement("li");
        dragPlaceholder.classList.add("task-item", "task-placeholder");
      }
      
      const insertBefore = items[dropIndex];
      if (insertBefore) taskList.insertBefore(dragPlaceholder, insertBefore);
      else taskList.appendChild(dragPlaceholder);
    });

    listItem.appendChild(taskTextSpan);
    listItem.appendChild(deleteButton);
    return listItem;
  }

  // Función para añadir una nueva tarea desde el input
  function addTask() {
    const text = taskInput.value.trim();
    if (text === "") return;
    taskList.appendChild(createTaskElement(text, false));
    saveTasks();
    updateFilterCounts();
    taskInput.value = "";
    taskInput.focus();
  }

  // Eventos principales del formulario de tareas
  addButton.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });

  // Eventos de los filtros
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.getAttribute("data-filter")));
  });

  // Evento de soltar (drop) del Drag & Drop
  taskList.addEventListener("drop", function (e) {
    e.preventDefault();
    if (!draggedItem || !dragPlaceholder) return;
    taskList.insertBefore(draggedItem, dragPlaceholder);
    dragPlaceholder.parentNode.removeChild(dragPlaceholder);
    dragPlaceholder = null;
    draggedItem.classList.remove("dragging");
    draggedItem = null;
    saveTasks();
    updateFilterCounts();
  });

  taskList.addEventListener("dragover", e => {
    if (draggedItem && dragPlaceholder) e.preventDefault();
  });

  // --- Inicialización al cargar la página ---
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    JSON.parse(saved).forEach(task => taskList.appendChild(createTaskElement(task.text, task.completed)));
  }
  updateFilterCounts();
  applyFilter(localStorage.getItem(FILTER_STORAGE_KEY) || "all");
});