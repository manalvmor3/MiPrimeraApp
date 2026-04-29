// tareas.js - Lógica exclusiva de Tareas (ACTUALIZACIONES QUIRÚRGICAS Y DRAG & DROP)

import { 
  collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  // 1. Referencias a los elementos del DOM
  const taskInput = document.getElementById("task-input");
  const addButton = document.getElementById("add-button");
  const taskList = document.getElementById("task-list");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Variables globales del módulo
  let usuarioActualId = null;
  
  // Variables para controlar el arrastrar y soltar (Drag & Drop)
  let draggedItem = null;
  let dragPlaceholder = null;
  let dragInitialIndex = null;

  // 2. Cargar tareas desde la nube (Solo se ejecuta al inicio)
  async function loadTasksFromFirestore() {
    if (!usuarioActualId) return;
    taskList.innerHTML = "";
    
    // Pedimos las tareas ordenadas por fecha de creación (para mantener el orden)
    const q = query(collection(window.db, "tareas"), where("userId", "==", usuarioActualId), orderBy("createdAt"));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => createTaskElement({ id: doc.id, ...doc.data() }));
    updateFilterCounts();
  }

  // 3. Crear una tarea visual (li)
  function createTaskElement(task) {
    const listItem = document.createElement("li");
    listItem.className = "task-item";
    listItem.dataset.id = task.id; // Guardamos el ID de la nube en el HTML
    if (task.completed) listItem.classList.add("task-item--completed");
    
    // Hacemos que la tarea se pueda arrastrar
    listItem.draggable = true;

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = task.text;
    taskTextSpan.className = "task-text " + (task.completed ? "completed" : "");

    // --- EVENTO: COMPLETAR TAREA (Sin parpadeo) ---
    taskTextSpan.addEventListener("click", async function () {
      const newState = !listItem.classList.contains("task-item--completed");
      
      // ACTUALIZACIÓN QUIRÚRGICA: Cambiamos la vista al instante
      listItem.classList.toggle("task-item--completed");
      taskTextSpan.classList.toggle("completed");
      updateFilterCounts();

      // Sincronizamos en segundo plano
      try {
        await updateDoc(doc(window.db, "tareas", task.id), { completed: newState });
      } catch (error) {
        console.error("Error al actualizar estado:", error);
        // Si falla, revertimos el cambio visual
        listItem.classList.toggle("task-item--completed");
        taskTextSpan.classList.toggle("completed");
        updateFilterCounts();
      }
    });

    // --- EVENTO: EDITAR TAREA (Doble clic) ---
    taskTextSpan.addEventListener("dblclick", function () {
      const originalText = taskTextSpan.textContent;
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = originalText;
      editInput.className = "task-edit-input";
      
      listItem.replaceChild(editInput, taskTextSpan);
      editInput.focus();

      // Función para finalizar la edición
      async function finishEdit(save) {
        let newText = editInput.value.trim();
        if (!save || newText === "") newText = originalText;
        
        // ACTUALIZACIÓN QUIRÚRGICA: Mostramos el texto nuevo al instante
        taskTextSpan.textContent = newText;
        listItem.replaceChild(taskTextSpan, editInput);

        // Si el texto ha cambiado, lo subimos a la nube
        if (newText !== originalText) {
          try {
            await updateDoc(doc(window.db, "tareas", task.id), { text: newText });
          } catch (error) {
            console.error("Error al editar:", error);
            taskTextSpan.textContent = originalText; // Revertimos si falla
          }
        }
      }
      
      editInput.addEventListener("keydown", e => {
        if (e.key === "Enter") finishEdit(true);
        else if (e.key === "Escape") finishEdit(false);
      });
      editInput.addEventListener("blur", () => finishEdit(true));
    });

    // --- EVENTO: BORRAR TAREA (Sin parpadeo) ---
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.className = "delete-button";
    
    deleteButton.addEventListener("click", async function () {
      // ACTUALIZACIÓN QUIRÚRGICA: Borramos del HTML al instante
      listItem.remove(); 
      updateFilterCounts();
      
      // Sincronizamos en segundo plano
      try {
        await deleteDoc(doc(window.db, "tareas", task.id));
      } catch (error) {
        console.error("Error al borrar:", error);
        loadTasksFromFirestore(); // Recargamos si hubo un error de red
      }
    });

    // ==========================================
    // LÓGICA DE DRAG & DROP (RECUPERADA Y PULIDA)
    // ==========================================
    
    // 1. Al coger la tarea
    listItem.addEventListener("dragstart", function (e) {
      draggedItem = listItem;
      listItem.classList.add("dragging");
      const items = Array.from(taskList.querySelectorAll(".task-item:not(.task-placeholder)"));
      dragInitialIndex = items.indexOf(listItem);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });

    // 2. Al soltar la tarea (fuera de sitio válido)
    listItem.addEventListener("dragend", function () {
      listItem.classList.remove("dragging");
      if (dragPlaceholder && dragPlaceholder.parentNode) {
        dragPlaceholder.parentNode.removeChild(dragPlaceholder);
      }
      dragPlaceholder = null; 
      draggedItem = null; 
      dragInitialIndex = null;
    });

    // 3. Mientras movemos la tarea por encima de otras
    listItem.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (!draggedItem || draggedItem === listItem || listItem.classList.contains("task-placeholder")) return;

      const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      const currentIndex = Array.from(items).indexOf(listItem);
      const rect = listItem.getBoundingClientRect();
      const dropIndex = (e.clientY - rect.top) < (rect.height / 2) ? currentIndex : currentIndex + 1;

      // MEJORA VISUAL: No mostramos el placeholder si la posición es la misma que la original
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

    // Ensamblamos la tarea y la añadimos a la lista
    listItem.appendChild(taskTextSpan);
    listItem.appendChild(deleteButton);
    taskList.appendChild(listItem);
  }

  // --- EVENTO: AÑADIR NUEVA TAREA (Sin parpadeo) ---
  async function addTask() {
    const text = taskInput.value.trim();
    if (text === "") return;
    
    // Vaciamos el input al instante
    taskInput.value = "";
    taskInput.focus();

    const newTask = { text, completed: false, userId: usuarioActualId, createdAt: new Date() };
    
    try {
      const docRef = await addDoc(collection(window.db, "tareas"), newTask);
      // INSERCIÓN QUIRÚRGICA: Añadimos solo la nueva tarea al final de la lista
      createTaskElement({ id: docRef.id, ...newTask }); 
      updateFilterCounts();
    } catch (e) {
      console.error("Error al añadir:", e);
      alert("Error de conexión. No se guardó la tarea.");
    }
  }

  // --- FUNCIONES DE FILTROS VISUALES ---
  function applyFilter(filterValue) {
    taskList.className = "filter-" + filterValue;
    filterButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.filter === filterValue));
  }

  function updateFilterCounts() {
      const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      let pending = 0;
      items.forEach(item => { if(!item.classList.contains("task-item--completed")) pending++; });
      
      filterButtons.forEach(btn => {
          const f = btn.dataset.filter;
          if (f === "all") btn.textContent = `Todas (${items.length})`;
          if (f === "pending") btn.textContent = `Pendientes (${pending})`;
          if (f === "completed") btn.textContent = `Completadas (${items.length - pending})`;
      });
  }

  // Asignamos los eventos principales
  addButton.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", e => { if(e.key === "Enter") addTask(); });
  filterButtons.forEach(btn => btn.addEventListener("click", () => applyFilter(btn.dataset.filter)));

  // --- EVENTO: DROP (Soltar la tarea y guardar el nuevo orden) ---
  taskList.addEventListener("drop", async (e) => {
    e.preventDefault();
    if (!draggedItem || !dragPlaceholder) return;
    
    // 1. Movemos el elemento visualmente al instante
    taskList.insertBefore(draggedItem, dragPlaceholder);
    if(dragPlaceholder.parentNode) dragPlaceholder.remove();
    
    draggedItem.classList.remove("dragging");
    dragPlaceholder = null;
    draggedItem = null;

    // 2. Sincronizamos el nuevo orden en Firebase actualizando el 'createdAt' en un solo lote (batch)
    const tasks = Array.from(taskList.querySelectorAll(".task-item"));
    try {
      const batch = writeBatch(window.db);
      for(let i = 0; i < tasks.length; i++){
          // Preparamos la actualización de cada documento en el lote
          const taskRef = doc(window.db, "tareas", tasks[i].dataset.id);
          batch.update(taskRef, { createdAt: new Date(Date.now() + i) });
      }
      // Enviamos todas las actualizaciones en una sola petición atómica
      await batch.commit();
    } catch (error) {
      console.error("Error al reordenar:", error);
    }
  });

  taskList.addEventListener("dragover", e => e.preventDefault());

  // Inicialización cuando el usuario entra
  window.addEventListener('usuarioLogueado', () => {
    usuarioActualId = window.currentUser;
    loadTasksFromFirestore();
  });
});