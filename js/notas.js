// notas.js - Lógica de Notas SIN PARPADEO (ACTUALIZACIÓN QUIRÚRGICA)

import { 
  collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const NOTAS_COLLECTION = "notas";
  const USER_ID_FIELD = "userId";

  const noteTitleInput = document.getElementById("note-title");
  const noteContentInput = document.getElementById("note-content");
  const saveNoteButton = document.getElementById("save-note-button");
  const notesGrid = document.getElementById("notes-grid");

  let usuarioActualId = null;

  // Carga inicial (Solo ocurre una vez al entrar)
  async function loadNotesFromFirestore() {
    if (!usuarioActualId) return;
    notesGrid.innerHTML = ""; 
    const q = query(collection(window.db, NOTAS_COLLECTION), where(USER_ID_FIELD, "==", usuarioActualId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => createNoteCard({ id: doc.id, ...doc.data() }));
  }

  function createNoteCard(note) {
    const card = document.createElement("div");
    card.classList.add("note-card");

    const readView = document.createElement("div");
    readView.style.cssText = "display:flex; flex-direction:column; height:100%;";

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

    // BORRAR: Eliminamos el elemento del DOM inmediatamente
    deleteBtn.addEventListener("click", async function (e) {
      e.stopPropagation();
      if (confirm("¿Borrar nota?")) {
        card.remove(); // <--- ELIMINACIÓN QUIRÚRGICA (Sin parpadeo)
        await deleteDoc(doc(window.db, NOTAS_COLLECTION, note.id));
      }
    });

    actionsEl.appendChild(deleteBtn);
    readView.appendChild(titleEl);
    readView.appendChild(contentEl);
    readView.appendChild(actionsEl);
    card.appendChild(readView);

    // EDITAR: Modificamos el contenido del HTML existente
    card.addEventListener("dblclick", function() {
      readView.classList.add("hidden");
      const editForm = document.createElement("div");
      editForm.className = "note-edit-form";
      editForm.innerHTML = `
        <input class="note-edit-input" value="${titleEl.textContent}">
        <textarea class="note-edit-textarea">${contentEl.textContent}</textarea>
        <div class="note-edit-actions">
          <button class="note-cancel-btn" type="button">Cancelar</button>
          <button class="note-save-btn" type="button">Guardar</button>
        </div>
      `;
      card.appendChild(editForm);

      editForm.querySelector(".note-save-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        const newT = editForm.querySelector(".note-edit-input").value;
        const newC = editForm.querySelector(".note-edit-textarea").value;
        
        // ACTUALIZACIÓN QUIRÚRGICA: Cambiamos el texto sin recargar nada
        titleEl.textContent = newT;
        contentEl.textContent = newC;
        editForm.remove();
        readView.classList.remove("hidden");

        await updateDoc(doc(window.db, NOTAS_COLLECTION, note.id), { title: newT, content: newC });
      });

      editForm.querySelector(".note-cancel-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        editForm.remove();
        readView.classList.remove("hidden");
      });
    });

    notesGrid.appendChild(card);
  }

  // AÑADIR: Insertamos solo el nuevo elemento al final
  saveNoteButton.addEventListener("click", async function () {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    if (content === "") return;

    const newNote = { title, content, [USER_ID_FIELD]: usuarioActualId, createdAt: new Date() };
    noteTitleInput.value = ""; noteContentInput.value = "";

    const docRef = await addDoc(collection(window.db, NOTAS_COLLECTION), newNote);
    createNoteCard({ id: docRef.id, ...newNote }); // <--- INSERCIÓN QUIRÚRGICA (Sin parpadeo)
  });

  window.addEventListener('usuarioLogueado', () => {
    usuarioActualId = window.currentUser;
    loadNotesFromFirestore();
  });
});