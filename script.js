// 1. Esperar a que el documento HTML esté cargado
document.addEventListener("DOMContentLoaded", function () {
    // 2. Conseguir referencias a los elementos del HTML
    const taskInput = document.getElementById("task-input");
    const addButton = document.getElementById("add-button");
    const taskList = document.getElementById("task-list");
    const themeToggleButton = document.getElementById("theme-toggle-button");

    let draggedItem = null; // Guardará la tarea que estamos arrastrando
    let dragPlaceholder = null; // Hueco visual donde se mostrará la posición
    let dragInitialIndex = null; // Índice de la tarea al empezar el arrastre (para no mostrar placeholder si no se mueve)
  
    // 3. Nombre de la clave que usaremos en localStorage para las tareas
    const STORAGE_KEY = "mi_lista_tareas";
  
    // 4. Nombre de la clave para guardar el tema (claro/oscuro)
    const THEME_STORAGE_KEY = "mi_tema_preferido";

    // Clave para guardar el filtro activo (all, pending, completed)
    const FILTER_STORAGE_KEY = "mi_filtro_tareas";
  
    // 5. Función para guardar las tareas actuales en localStorage
    function saveTasksToLocalStorage() {
      const tasks = [];
  
      // Recorremos todos los <li> que hay en la lista
      const items = taskList.querySelectorAll(".task-item");
      items.forEach(function (item) {
        const textSpan = item.querySelector(".task-text");
  
        tasks.push({
          text: textSpan.textContent,
          completed: textSpan.classList.contains("completed"),
        });
      });
  
      // Guardamos el array convertido a texto JSON
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

  // Actualiza los números en los botones de filtro (Todas / Pendientes / Completadas)
  function updatePendingCounter() {
    updateFilterCounts();
  }

  // Actualizar los contadores en la barra de filtros (Todas / Pendientes / Completadas)
  function updateFilterCounts() {
    const items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
    let pendingCount = 0;
    let completedCount = 0;
    items.forEach(function (item) {
      if (item.classList.contains("task-item--completed")) {
        completedCount++;
      } else {
        pendingCount++;
      }
    });
    const total = items.length;

    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      const filter = btn.getAttribute("data-filter");
      if (filter === "all") {
        btn.textContent = "Todas (" + total + ")";
      } else if (filter === "pending") {
        btn.textContent = "Pendientes (" + pendingCount + ")";
      } else if (filter === "completed") {
        btn.textContent = "Completadas (" + completedCount + ")";
      }
    });
  }

  
  // 6. Función para crear un <li> (tarea) a partir de un texto y su estado
  function createTaskElement(text, completed) {
    // Crear el elemento <li> que será la tarea
    const listItem = document.createElement("li");
    listItem.classList.add("task-item");

    // Marcar el <li> como completado para el filtrado (ocultar/mostrar según filtro)
    if (completed) {
      listItem.classList.add("task-item--completed");
    }

    // Hacer que el elemento se pueda arrastrar
    listItem.draggable = true;

    // Crear el span que contiene el texto de la tarea
    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = text;
    taskTextSpan.classList.add("task-text");

    // Si la tarea viene marcada como completada, le añadimos la clase
    if (completed) {
      taskTextSpan.classList.add("completed");
    }

    // Cuando hacemos clic en el texto, se marca/desmarca como completado
    taskTextSpan.addEventListener("click", function () {
      taskTextSpan.classList.toggle("completed");
      listItem.classList.toggle("task-item--completed"); // Para el filtrado
      saveTasksToLocalStorage(); // Guardamos cambios
      updatePendingCounter();
    });

    // Cuando hacemos doble clic en el texto, entramos en modo edición
    taskTextSpan.addEventListener("dblclick", function () {
      const originalText = taskTextSpan.textContent;

      // Crear un input de texto para editar
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = originalText;
      editInput.classList.add("task-edit-input");

      // Sustituir el span por el input
      listItem.replaceChild(editInput, taskTextSpan);
      editInput.focus();
      editInput.select();

      // Función para terminar la edición (guardar o cancelar)
      function finishEdit(saveChanges) {
        let newText = editInput.value.trim();

        if (!saveChanges || newText === "") {
          // Si cancelamos o queda vacío, volvemos al texto original
          newText = originalText;
        }

        taskTextSpan.textContent = newText;

        // Volver a poner el span en lugar del input
        listItem.replaceChild(taskTextSpan, editInput);

        // Guardar en localStorage el nuevo texto
        saveTasksToLocalStorage();
        updatePendingCounter();
      }

      // Guardar al pulsar Enter
      editInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          finishEdit(true);
        } else if (event.key === "Escape") {
          // Con Escape, cancelamos los cambios
          finishEdit(false);
        }
      });

      // Guardar cuando el input pierde el foco (hacemos clic fuera)
      editInput.addEventListener("blur", function () {
        finishEdit(true);
      });
    });

    // Crear el botón de eliminar
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.classList.add("delete-button");

    // Cuando hacemos clic en el botón "Eliminar", quitamos la tarea de la lista
    deleteButton.addEventListener("click", function () {
      taskList.removeChild(listItem);
      saveTasksToLocalStorage(); // Guardamos cambios
      updatePendingCounter();
    });

        // --- Eventos para drag & drop con marcador (placeholder) ---

    // Al empezar a arrastrar: no creamos el placeholder todavía
    listItem.addEventListener("dragstart", function (event) {
      draggedItem = listItem;
      listItem.classList.add("dragging");

      var items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      dragInitialIndex = Array.from(items).indexOf(listItem);

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
      }
    });

    // Al soltar el botón del ratón (fin del arrastre)
    listItem.addEventListener("dragend", function () {
      listItem.classList.remove("dragging");

      if (dragPlaceholder && dragPlaceholder.parentNode) {
        dragPlaceholder.parentNode.removeChild(dragPlaceholder);
      }

      dragPlaceholder = null;
      draggedItem = null;
      dragInitialIndex = null;
    });

    // Mientras arrastramos por encima de una tarea: solo mostramos placeholder si la posición de soltar es distinta a la inicial
    listItem.addEventListener("dragover", function (event) {
      event.preventDefault();

      if (!draggedItem || draggedItem === listItem) {
        return;
      }
      // No hacer nada si estamos sobre el propio placeholder
      if (listItem.classList.contains("task-placeholder")) {
        return;
      }

      var items = taskList.querySelectorAll(".task-item:not(.task-placeholder)");
      var currentIndex = Array.from(items).indexOf(listItem);
      var rect = listItem.getBoundingClientRect();
      var offsetY = event.clientY - rect.top;
      var halfHeight = rect.height / 2;
      var dropIndex = offsetY < halfHeight ? currentIndex : currentIndex + 1;

      if (dropIndex === dragInitialIndex) {
        // Misma posición que al inicio: quitar el placeholder si existía
        if (dragPlaceholder && dragPlaceholder.parentNode) {
          dragPlaceholder.parentNode.removeChild(dragPlaceholder);
          dragPlaceholder = null;
        }
        return;
      }

      // Al bajar: no mostrar placeholder "justo debajo" (mitad superior del siguiente) hasta pasar a la mitad inferior
      if (dropIndex === dragInitialIndex + 1 && offsetY < halfHeight) {
        if (dragPlaceholder && dragPlaceholder.parentNode) {
          dragPlaceholder.parentNode.removeChild(dragPlaceholder);
          dragPlaceholder = null;
        }
        return;
      }

      // Posición distinta: crear placeholder si no existe y colocarlo
      if (!dragPlaceholder) {
        dragPlaceholder = document.createElement("li");
        dragPlaceholder.classList.add("task-item", "task-placeholder");
      }
      var insertBefore = items[dropIndex];
      if (insertBefore) {
        taskList.insertBefore(dragPlaceholder, insertBefore);
      } else {
        taskList.appendChild(dragPlaceholder);
      }
    });

    // Meter el texto y el botón dentro del <li>
    listItem.appendChild(taskTextSpan);
    listItem.appendChild(deleteButton);

    return listItem;
  }
  
    // 7. Función que crea y añade una nueva tarea a la lista (desde el input)
    function addTask() {
      const text = taskInput.value.trim(); // Quitamos espacios al inicio y final
  
      // Si el input está vacío, no hacemos nada
      if (text === "") {
        return;
      }
  
      // Crear el elemento <li> usando nuestra función
      const listItem = createTaskElement(text, false);
  
      // Añadir el <li> a la lista <ul>
      taskList.appendChild(listItem);
  
      // Guardar en localStorage después de añadir
      saveTasksToLocalStorage();
      updatePendingCounter();
  
      // Vaciar la caja de texto para poder escribir otra tarea
      taskInput.value = "";
      taskInput.focus();
    }
  
    // 8. Cargar las tareas guardadas en localStorage al iniciar
    function loadTasksFromLocalStorage() {
      const saved = localStorage.getItem(STORAGE_KEY);
  
      if (!saved) {
        // Si no hay nada guardado, no hacemos nada
        return;
      }
  
      // Convertimos el texto JSON a un array de objetos
      const tasks = JSON.parse(saved);
  
      tasks.forEach(function (task) {
        const listItem = createTaskElement(task.text, task.completed);
        taskList.appendChild(listItem);
      });
      updatePendingCounter();
    }
  
    // 9. Guardar el tema actual en localStorage
    function saveThemeToLocalStorage(theme) {
      // theme será "light" o "dark"
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  
    // 10. Aplicar un tema ("light" o "dark")
    function applyTheme(theme) {
        if (theme === "dark") {
        document.body.classList.add("dark-mode");
        } else {
        document.body.classList.remove("dark-mode");
        }
    }
  
    // 11. Cargar el tema guardado (si existe)
    function loadThemeFromLocalStorage() {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  
      if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
      } else {
        // Si no hay nada guardado, usamos "light" por defecto
        applyTheme("light");
      }
    }

    // Aplicar filtro de tareas (all | pending | completed)
    function applyFilter(filterValue) {
      taskList.classList.remove("filter-all", "filter-pending", "filter-completed");
      taskList.classList.add("filter-" + filterValue);

      document.querySelectorAll(".filter-btn").forEach(function (btn) {
        if (btn.getAttribute("data-filter") === filterValue) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      localStorage.setItem(FILTER_STORAGE_KEY, filterValue);
    }

      // Soltar (drop) dentro de la lista: colocamos la tarea donde está el marcador
  taskList.addEventListener("drop", function (event) {
    event.preventDefault();

    if (!draggedItem || !dragPlaceholder) {
      return;
    }

    taskList.insertBefore(draggedItem, dragPlaceholder);

    // Limpiamos marcador y estado
    dragPlaceholder.parentNode.removeChild(dragPlaceholder);
    dragPlaceholder = null;
    draggedItem.classList.remove("dragging");
    draggedItem = null;

    // Guardamos el nuevo orden
    saveTasksToLocalStorage();
    updatePendingCounter();
  });

  // Permitir que se pueda soltar en zonas vacías de la lista
  taskList.addEventListener("dragover", function (event) {
    if (!draggedItem || !dragPlaceholder) {
      return;
    }

    // Solo necesitamos esto para que el evento "drop" funcione
    event.preventDefault();
  });
  
    // 12. Cuando pulsamos el botón "Añadir"
    addButton.addEventListener("click", addTask);
  
    // 13. Cuando pulsamos la tecla Enter dentro del input
    taskInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        addTask();
      }
    });
  
    // 14. Cuando pulsamos el botón de cambio de tema
    themeToggleButton.addEventListener("click", function () {
      const isDarkMode = document.body.classList.contains("dark-mode");
  
      if (isDarkMode) {
        applyTheme("light");
        saveThemeToLocalStorage("light");
      } else {
        applyTheme("dark");
        saveThemeToLocalStorage("dark");
      }
    });
  
    // Filtros: al hacer clic en un botón de filtro
    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const filterValue = btn.getAttribute("data-filter");
        applyFilter(filterValue);
      });
    });

    // 15. Cargar tareas y tema guardados al abrir la página
    loadTasksFromLocalStorage();
    loadThemeFromLocalStorage();
    updatePendingCounter();

    // Aplicar el filtro guardado (o "all" por defecto)
    const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
    if (savedFilter === "all" || savedFilter === "pending" || savedFilter === "completed") {
      applyFilter(savedFilter);
    } else {
      applyFilter("all");
    }
  });