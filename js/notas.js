// notas.js - Lógica exclusiva de Notas
document.addEventListener("DOMContentLoaded", function () {
  // 1. Selección de elementos del DOM específicos para la sección de notas
  const noteTitleInput = document.getElementById("note-title");
  const noteContentInput = document.getElementById("note-content");
  const saveNoteButton = document.getElementById("save-note-button");
  const notesGrid = document.getElementById("notes-grid");

  // Clave para guardar las notas en el LocalStorage
  const NOTES_STORAGE_KEY = "mis_notas";

  // 2. Cargar notas desde el LocalStorage (o devolver array vacío si no hay nada)
  function loadNotesFromLocalStorage() {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    try {
      const parsed = JSON.parse(saved); // Convertimos el string JSON de vuelta a objeto JS
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return []; // Si hay error al leer, devolvemos array vacío
    }
  }

  // 3. Persistencia: Convertir el array de objetos a JSON y guardar en LocalStorage
  function saveNotesToLocalStorage(notes) {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }

  // 4. Crear una tarjeta visual para una nota individual
  function createNoteCard(note, notesGrid, notes, onChange) {
    const card = document.createElement("div");
    card.classList.add("note-card");

    // Título de la nota
    const titleEl = document.createElement("div");
    titleEl.classList.add("note-title");
    titleEl.textContent = note.title || "Sin título";

    // Cuerpo de la nota
    const contentEl = document.createElement("div");
    contentEl.classList.add("note-content");
    contentEl.textContent = note.content || "";

    // Botones de acción (Eliminar)
    const actionsEl = document.createElement("div");
    actionsEl.classList.add("note-actions");

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("note-delete-button");
    deleteBtn.textContent = "Eliminar";

    // Evento: Al hacer clic en eliminar, quitamos la nota del array y actualizamos la vista
    deleteBtn.addEventListener("click", function () {
      const index = notes.findIndex(function (n) { return n.id === note.id; });
      if (index !== -1) {
        notes.splice(index, 1);
        saveNotesToLocalStorage(notes);
        onChange(); // Callback para volver a pintar la lista
      }
    });

    actionsEl.appendChild(deleteBtn);
    card.appendChild(titleEl);
    card.appendChild(contentEl);
    card.appendChild(actionsEl);

    notesGrid.appendChild(card);
  }

  // 5. Dibujar todas las notas en pantalla
  function renderNotes(notesGrid, notes) {
    notesGrid.innerHTML = ""; // Limpiamos la cuadrícula antes de repintar
    notes.forEach(function (note) {
      createNoteCard(note, notesGrid, notes, function () {
        renderNotes(notesGrid, notes); // Función callback para refrescar la vista
      });
    });
  }

  // 6. Inicialización: Cargamos notas existentes al arrancar
  let misNotas = loadNotesFromLocalStorage();
  renderNotes(notesGrid, misNotas);

  // 7. Evento para añadir una nota nueva
  saveNoteButton.addEventListener("click", function () {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    // Validación básica
    if (content === "") {
      alert("¡El contenido de la nota no puede estar vacío!");
      return;
    }

    // Creamos el objeto de la nueva nota
    const newNote = {
      id: Date.now().toString(), // Usamos el timestamp como ID único
      title: title,
      content: content
    };

    // Añadimos al array, guardamos y repintamos
    misNotas.push(newNote);
    saveNotesToLocalStorage(misNotas);
    renderNotes(notesGrid, misNotas);

    // Limpiamos los campos de entrada
    noteTitleInput.value = "";
    noteContentInput.value = "";
    noteTitleInput.focus(); // Devolvemos el foco al campo de título
  });
});