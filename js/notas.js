// notas.js - Lógica exclusiva de Notas CONECTADA A FIRESTORE

// NUEVO: Importamos las funciones necesarias de Firestore
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", function () {
  // 1. Selección de elementos del DOM
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

  // 3. Crear una tarjeta de nota visual (simplificada)
  function createNoteCard(note) {
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

    // NUEVO: Evento para borrar de Firestore
    deleteBtn.addEventListener("click", async function () {
      try {
        await deleteDoc(doc(window.db, "notas", note.id));
        loadNotesFromFirestore(); // Refrescamos la vista
      } catch (error) {
        console.error("Error al borrar la nota: ", error);
        alert("No se pudo borrar la nota.");
      }
    });

    actionsEl.appendChild(deleteBtn);
    card.appendChild(titleEl);
    card.appendChild(contentEl);
    card.appendChild(actionsEl);

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