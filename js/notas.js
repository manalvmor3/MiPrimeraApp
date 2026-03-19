// notas.js - Lógica exclusiva de Notas
document.addEventListener("DOMContentLoaded", function () {
    const noteTitleInput = document.getElementById("note-title");
    const noteContentInput = document.getElementById("note-content");
    const saveNoteButton = document.getElementById("save-note-button");
    const notesGrid = document.getElementById("notes-grid");
  
    const NOTES_STORAGE_KEY = "mis_notas";
  
    // 1. Cargar notas del LocalStorage
    function loadNotesFromLocalStorage() {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!saved) {
        return [];
      }
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
  
    // 2. Guardar notas en el LocalStorage
    function saveNotesToLocalStorage(notes) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    }
  
    // 3. Crear una tarjeta de nota visual
    function createNoteCard(note, notesGrid, notes, onChange) {
      const card = document.createElement("div");
      card.classList.add("note-card");
  
      const titleEl = document.createElement("div");
      titleEl.classList.add("note-title");
      titleEl.textContent = note.title || "Sin título";
  
      const contentEl = document.createElement("div");
      contentEl.classList.add("note-content");
      contentEl.textContent = note.content || "";
  
      const actionsEl = document.createElement("div");
      actionsEl.classList.add("note-actions");
  
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("note-delete-button");
      deleteBtn.textContent = "Eliminar";
  
      deleteBtn.addEventListener("click", function () {
        const index = notes.findIndex(function (n) { return n.id === note.id; });
        if (index !== -1) {
          notes.splice(index, 1);
          saveNotesToLocalStorage(notes);
          onChange();
        }
      });
  
      actionsEl.appendChild(deleteBtn);
      card.appendChild(titleEl);
      card.appendChild(contentEl);
      card.appendChild(actionsEl);
  
      notesGrid.appendChild(card);
    }
  
    // 4. Dibujar todas las notas en pantalla
    function renderNotes(notesGrid, notes) {
      notesGrid.innerHTML = "";
      notes.forEach(function (note) {
        createNoteCard(note, notesGrid, notes, function () {
          renderNotes(notesGrid, notes);
        });
      });
    }
  
    // 5. Inicialización y Eventos
    let misNotas = loadNotesFromLocalStorage();
    renderNotes(notesGrid, misNotas);
  
    saveNoteButton.addEventListener("click", function () {
      const title = noteTitleInput.value.trim();
      const content = noteContentInput.value.trim();
  
      if (content === "") {
        alert("¡El contenido de la nota no puede estar vacío!");
        return;
      }
  
      const newNote = {
        id: Date.now().toString(),
        title: title,
        content: content
      };
  
      misNotas.push(newNote);
      saveNotesToLocalStorage(misNotas);
      renderNotes(notesGrid, misNotas);
  
      noteTitleInput.value = "";
      noteContentInput.value = "";
      noteTitleInput.focus();
    });
  });