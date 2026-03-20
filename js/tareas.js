// tareas.js - Lógica exclusiva de Tareas CONECTADA A FIRESTORE

// NUEVO: Importamos las herramientas de Firestore
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy // Para ordenar las tareas
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  // 1. Selección de elementos del DOM
  const taskInput = document.getElementById("task-input");
  const addButton = document.getElementById("add-button");
  const taskList = document.getElementById("task-list");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let usuarioActualId = null; // Guardará el DNI del usuario logueado

  // --- Funcionalidad del Drag & Drop (esto no cambia) ---
  let draggedItem = null;
  let dragPlaceholder = null;
  let dragInitialIndex = null;
  
  // --- NUEVO: FUNCIONES DE FIRESTORE ---

  // 2. Cargar tareas desde la nube, ordenadas por su timestamp
  async function loadTasksFromFirestore() {
    if (!usuarioActualId) return;

    taskList.innerHTML = "";
    const q = query(collection(window.db, "tareas"), where("userId", "==", usuarioActualId), orderBy("createdAt"));
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      createTaskElement({ id: doc.id, ...doc.data() });
    });

    updateFilterCounts();
  }

  // 3. Crear una tarea (li) a partir de los datos de la nube
  function createTaskElement(task) {
    const listItem = document.createElement("li");
    listItem.classList.add("task-item");
    listItem.dataset.id = task.id; // Guardamos el ID de la nube en el elemento

    if (task.completed) listItem.classList.add("task-item--completed");
    listItem.draggable = true;

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = task.text;
    taskTextSpan.classList.add("task-text");
    if (task.completed) taskTextSpan.classList.add("completed");

    // NUEVO: Clic para completar/descompletar (actualiza en la nube)
    taskTextSpan.addEventListener("click", async function () {
      const newCompletedState = !listItem.classList.contains("task-item--completed");
      const taskDocRef = doc(window.db, "tareas", task.id);
      await updateDoc(taskDocRef, { completed: newCompletedState });
      loadTasksFromFirestore(); // Recargamos para ver los cambios
    });

    // NUEVO: Doble clic para editar (actualiza en la nube)
    taskTextSpan.addEventListener("dblclick", function () {
      const originalText = taskTextSpan.textContent;
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = originalText;
      editInput.classList.add("task-edit-input");
      listItem.replaceChild(editInput, taskTextSpan);
      editInput.focus();
      editInput.select();

      async function finishEdit(saveChanges) {
        let newText = editInput.value.trim();
        if (!saveChanges || newText === "") {
          newText = originalText;
        } else if (newText !== originalText) {
          const taskDocRef = doc(window.db, "tareas", task.id);
          await updateDoc(taskDocRef, { text: newText });
        }
        taskTextSpan.textContent = newText;
        listItem.replaceChild(taskTextSpan, editInput);
      }
      
      editInput.addEventListener("keydown", e => {
        if (e.key === "Enter") finishEdit(true);
        else if (e.key === "Escape") finishEdit(false);
      });
      editInput.addEventListener("blur", () => finishEdit(true));
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.classList.add("delete-button");
    // NUEVO: Clic para borrar de la nube
    deleteButton.addEventListener("click", async function () {
      await deleteDoc(doc(window.db, "tareas", task.id));
      loadTasksFromFirestore();
    });

    // --- El Drag & Drop se queda igual que antes ---
    listItem.addEventListener("dragstart", function (e) {
      draggedItem = listItem;
      listItem.classList.add("dragging");
      const items = Array.from(taskList.querySelectorAll(".task-item:not(.task-placeholder)"));
      dragInitialIndex = items.indexOf(listItem);
    });
    listItem.addEventListener("dragend", function () {
      listItem.classList.remove("dragging");
      if (dragPlaceholder && dragPlaceholder.parentNode) {
          dragPlaceholder.parentNode.removeChild(dragPlaceholder);
      }
      dragPlaceholder = null; draggedItem = null;
    });
    listItem.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (!draggedItem || draggedItem === listItem || listItem.classList.contains("task-placeholder")) return;
      
      const rect = listItem.getBoundingClientRect();
      const afterElement = e.clientY > rect.top + rect.height / 2 ? listItem.nextSibling : listItem;

      if (!dragPlaceholder) {
          dragPlaceholder = document.createElement("li");
          dragPlaceholder.classList.add("task-item", "task-placeholder");
      }
      taskList.insertBefore(dragPlaceholder, afterElement);
    });

    listItem.appendChild(taskTextSpan);
    listItem.appendChild(deleteButton);
    taskList.appendChild(listItem);
  }

  // --- FUNCIONES DE CONTROL ---

  // NUEVO: Añadir una tarea a la nube
  async function addTask() {
    const text = taskInput.value.trim();
    if (text === "") return;

    const newTask = {
      text: text,
      completed: false,
      userId: usuarioActualId,
      createdAt: new Date() // Usamos la fecha para ordenar
    };

    try {
      await addDoc(collection(window.db, "tareas"), newTask);
      loadTasksFromFirestore();
    } catch (e) {
      console.error("Error al añadir tarea:", e);
      alert("No se pudo guardar la tarea.");
    }

    taskInput.value = "";
    taskInput.focus();
  }

  // Los filtros ahora no guardan en localStorage, solo cambian la vista
  function applyFilter(filterValue) {
    taskList.className = "filter-" + filterValue;
    filterButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filterValue);
    });
  }

  // El contador de tareas no necesita cambios
  function updateFilterCounts() {
      const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      let pendingCount = 0, completedCount = 0;
      
      items.forEach(item => {
          if (item.classList.contains("task-item--completed")) completedCount++;
          else pendingCount++;
      });

      filterButtons.forEach(btn => {
          const filter = btn.dataset.filter;
          if (filter === "all") btn.textContent = `Todas (${items.length})`;
          else if (filter === "pending") btn.textContent = `Pendientes (${pendingCount})`;
          else if (filter === "completed") btn.textContent = `Completadas (${completedCount})`;
      });
  }

  // --- EVENTOS Y CARGA INICIAL ---

  addButton.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  // NUEVO: Reordenar en la nube al soltar una tarea
  taskList.addEventListener("drop", async function (e) {
    e.preventDefault();
    if (!draggedItem || !dragPlaceholder) return;
    
    const draggedId = draggedItem.dataset.id;
    taskList.insertBefore(draggedItem, dragPlaceholder);
    dragPlaceholder.parentNode.removeChild(dragPlaceholder);
    
    const allTasks = Array.from(taskList.querySelectorAll(".task-item"));
    for(let i = 0; i < allTasks.length; i++){
        const taskDocRef = doc(window.db, "tareas", allTasks[i].dataset.id);
        // Actualizamos su 'createdAt' para que coincida con el nuevo orden
        await updateDoc(taskDocRef, { createdAt: new Date(Date.now() + i) }); 
    }
    
    draggedItem.classList.remove("dragging");
    draggedItem = null;
    // No hace falta recargar, el orden visual ya es correcto.
  });

  taskList.addEventListener("dragover", e => { if (draggedItem) e.preventDefault(); });

  // NUEVO: Cargamos las tareas solo cuando el usuario se ha logueado
  window.addEventListener('usuarioLogueado', () => {
      usuarioActualId = window.currentUser;
      loadTasksFromFirestore();
  });
});