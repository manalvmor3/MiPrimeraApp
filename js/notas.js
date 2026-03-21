// notas.js - Lógica exclusiva de Notas CONECTADA A FIRESTORE

// NUEVO: Importamos las funciones necesarias de Firestore (Añadimos updateDoc para editar)
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", function () {
  // 1. Selección de elementos del DOM específicos para la sección de notas
  const noteTitleInput = document.getElementById("note-title");
  const noteContentInput = document.getElementById("note-content");
  const saveNoteButton = document.getElementById("save-note-button");
  const notesGrid = document.getElementById("notes-grid");

  let misNotas = []; // Array que contendrá las notas del usuario actual
  let usuarioActualId = null; // Guardará el ID del usuario logueado

  // --- NUEVO: FUNCIONES DE FIRESTORE ---

  // 2. Cargar notas desde la nube (solo las del usuario actual)
  async function loadNotesFromFirestore() {
    if (!usuarioActualId) return; // Si no hay usuario, no hacemos nada

    notesGrid.innerHTML = ""; // Limpiamos la vista
    misNotas = []; // Vaciamos el array local

    // Creamos una "pregunta" a la base de datos:
    // "En la colección 'notas', dame todos los documentos donde el 'userId' sea igual al del usuario actual"
    const q = query(collection(window.db, "notas"), where("userId", "==", usuarioActualId));
    
    const querySnapshot = await getDocs(q); // Ejecutamos la consulta
    querySnapshot.forEach((doc) => {
      const nota = { id: doc.id, ...doc.data() }; // Unimos el ID del documento con sus datos
      misNotas.push(nota);
      createNoteCard(nota); // Pintamos la tarjeta
    });
  }

  // 3. Crear una tarjeta de nota visual (Con soporte para edición)
  function createNoteCard(note) {
    const card = document.createElement("div");
    card.classList.add("note-card");

    // --- VISTA DE LECTURA (Lo que se ve normalmente) ---
    const readView = document.createElement("div");
    readView.classList.add("note-read-view"); // Clase para control visual
    readView.style.display = "flex";
    readView.style.flexDirection = "column";
    readView.style.height = "100%";

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

    // NUEVO: Evento para borrar de Firestore
    deleteBtn.addEventListener("click", async function (e) {
      e.stopPropagation(); // Evita que el clic active el modo edición
      if (confirm("¿Estás seguro de que quieres borrar esta nota?")) {
        try {
          await deleteDoc(doc(window.db, "notas", note.id));
          loadNotesFromFirestore(); // Refrescamos la vista
        } catch (error) {
          console.error("Error al borrar la nota: ", error);
          alert("No se pudo borrar la nota.");
        }
      }
    });

    // Montamos la vista de lectura
    actionsEl.appendChild(deleteBtn);
    readView.appendChild(titleEl);
    readView.appendChild(contentEl);
    readView.appendChild(actionsEl);
    card.appendChild(readView);

    // --- NUEVO: LÓGICA DE EDICIÓN (Doble clic) ---
    card.addEventListener("dblclick", function() {
        // Ocultamos la vista de lectura
        readView.classList.add("hidden");

        // Creamos dinámicamente el formulario de edición
        const editForm = document.createElement("div");
        editForm.classList.add("note-edit-form");

        const editTitle = document.createElement("input");
        editTitle.classList.add("note-edit-input");
        editTitle.value = note.title;

        const editContent = document.createElement("textarea");
        editContent.classList.add("note-edit-textarea");
        editContent.value = note.content;

        const editActions = document.createElement("div");
        editActions.classList.add("note-edit-actions");

        const saveBtn = document.createElement("button");
        saveBtn.classList.add("note-save-btn");
        saveBtn.textContent = "Guardar";

        const cancelBtn = document.createElement("button");
        cancelBtn.classList.add("note-cancel-btn");
        cancelBtn.textContent = "Cancelar";

        // Evento para GUARDAR cambios en Firestore
        saveBtn.addEventListener("click", async function(e) {
            e.stopPropagation();
            const newTitle = editTitle.value.trim();
            const newContent = editContent.value.trim();

            if (newContent === "") return alert("El contenido no puede estar vacío.");

            try {
                const noteRef = doc(window.db, "notas", note.id);
                await updateDoc(noteRef, {
                    title: newTitle,
                    content: newContent
                });
                loadNotesFromFirestore(); // Recargamos para ver los cambios
            } catch (error) {
                console.error("Error al actualizar: ", error);
            }
        });

        // Evento para CANCELAR la edición
        cancelBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            editForm.remove(); // Borramos el formulario
            readView.classList.remove("hidden"); // Volvemos a mostrar la nota
        });

        // Montamos el formulario de edición
        editActions.appendChild(cancelBtn);
        editActions.appendChild(saveBtn);
        editForm.appendChild(editTitle);
        editForm.appendChild(editContent);
        editForm.appendChild(editActions);
        card.appendChild(editForm);

        editTitle.focus(); // Ponemos el foco en el título al empezar a editar
    });

    notesGrid.appendChild(card);
  }

  // --- LÓGICA DE EVENTOS ---

  // 4. Evento para añadir una nota nueva
  saveNoteButton.addEventListener("click", async function () {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (content === "") {
      alert("¡El contenido de la nota no puede estar vacío!");
      return;
    }

    // NUEVO: Preparamos el objeto para guardarlo en la nube
    const newNote = {
      title: title,
      content: content,
      userId: usuarioActualId, // ¡La etiqueta con el DNI del usuario!
      createdAt: new Date() // Guardamos la fecha de creación
    };

    try {
      // NUEVO: Usamos addDoc para guardar la nota en la colección "notas"
      await addDoc(collection(window.db, "notas"), newNote);
      loadNotesFromFirestore(); // Recargamos las notas desde la nube
    } catch (e) {
      console.error("Error al añadir la nota: ", e);
      alert("Hubo un error al guardar tu nota. Inténtalo de nuevo.");
    }

    noteTitleInput.value = "";
    noteContentInput.value = "";
    noteTitleInput.focus();
  });

  // 5. Inicialización: Escuchamos el evento que lanza auth.js
  window.addEventListener('usuarioLogueado', () => {
      usuarioActualId = window.currentUser;
      loadNotesFromFirestore(); // Cargamos las notas en cuanto entra el usuario
  });
});