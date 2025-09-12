let notes = [];
let current = null;

const listEl = document.getElementById('notesList');
const editor = document.getElementById('editor');
const titleEl = document.getElementById('title');
const bodyEl = document.getElementById('body');
const tagsEl = document.getElementById('tags');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const newNoteBtn = document.getElementById('newNoteBtn');
const cancelBtn = document.getElementById('cancelBtn');
const summarizeBtn = document.getElementById('summarizeBtn');
const generateTitleBtn = document.getElementById('generateTitleBtn');
const searchBar = document.getElementById('searchBar');

const modalBox = document.getElementById('messageModal');
const modalText = document.getElementById('messageText');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

// Helper to get backend ID
const getId = n => n?._id;

// Custom alert function
function customAlert(message) {
    return new Promise(resolve => {
        modalText.textContent = message;
        modalConfirmBtn.style.display = 'inline-block';
        modalCancelBtn.style.display = 'none';
        modalConfirmBtn.onclick = () => {
            modalBox.classList.remove('show');
            resolve(true);
        };
        modalBox.classList.add('show');
    });
}

// Custom confirm function
function customConfirm(message) {
    return new Promise(resolve => {
        modalText.textContent = message;
        modalConfirmBtn.style.display = 'inline-block';
        modalCancelBtn.style.display = 'inline-block';
        modalConfirmBtn.onclick = () => {
            modalBox.classList.remove('show');
            resolve(true);
        };
        modalCancelBtn.onclick = () => {
            modalBox.classList.remove('show');
            resolve(false);
        };
        modalBox.classList.add('show');
    });
}

// Load all notes
async function loadNotes() {
  try {
    const res = await fetch('/api/notes');
    notes = Array.isArray(await res.json()) ? await res.json() : [];

    // Add example note if notes array is empty
    if (notes.length === 0) {
        notes.push({
            title: "Delicious Tacos",
            content: "Tacos are a popular Mexican dish. They are made with a small hand-sized corn or wheat tortilla topped with a filling. The filling can be anything from meat, fish, beans, vegetables, and cheese. They are often garnished with various condiments, such as salsa or chili pepper, avocado or guacamole, cilantro, tomatoes, and lettuce.",
            tags: ["food"],
            summary: "Tacos are a versatile Mexican dish consisting of a tortilla with various fillings like meat, fish, or vegetables, topped with condiments such as salsa, guacamole, and cilantro.",
            _id: "example-id-1"
        });
    }

    render();
  } catch (err) {
    console.error("Failed to load notes from backend, using example note.", err);
    // Add example note if backend fails
    if (notes.length === 0) {
        notes.push({
            title: "Delicious Tacos",
            content: "Tacos are a popular Mexican dish. They are made with a small hand-sized corn or wheat tortilla topped with a filling. The filling can be anything from meat, fish, beans, vegetables, and cheese. They are often garnished with various condiments, such as salsa or chili pepper, avocado or guacamole, cilantro, tomatoes, and lettuce.",
            tags: ["food"],
            summary: "Tacos are a versatile Mexican dish consisting of a tortilla with various fillings like meat, fish, or vegetables, topped with condiments such as salsa, guacamole, and cilantro.",
            _id: "example-id-1"
        });
    }
    render();
  }
}

// Render note cards
function render(filteredNotes = notes) {
  listEl.innerHTML = '';
  filteredNotes.forEach(n => {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.onclick = () => openEditor(n);

    const title = document.createElement('div');
    title.className = 'note-title';
    title.textContent = n.title || 'Untitled';

    const body = document.createElement('div');
    body.className = 'note-body';
    body.textContent = n.summary || n.content;

    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'note-tags';
    (n.tags || []).forEach(t => {
      const tag = document.createElement('span');
      tag.className = 'note-tag';
      tag.textContent = t;
      tagsWrap.appendChild(tag);
    });

    div.appendChild(title);
    div.appendChild(body);
    div.appendChild(tagsWrap);

    listEl.appendChild(div);
  });
}

// Open and populate editor
function openEditor(note) {
  current = note;
  titleEl.value = note.title || '';
  bodyEl.value = note.content || '';
  tagsEl.value = (note.tags || []).join(', ');

  // Show/hide delete and LLM buttons
  deleteBtn.style.display = getId(note) ? 'inline-block' : 'none';
  summarizeBtn.style.display = getId(note) ? 'inline-block' : 'none';
  generateTitleBtn.style.display = getId(note) ? 'inline-block' : 'none';
  
  // Change save button text for update
  saveBtn.textContent = getId(note) ? 'Save' : 'Add';

  editor.classList.add('show');
}

// Close editor
function closeEditor() {
  current = null;
  editor.classList.remove('show');
  titleEl.value = '';
  bodyEl.value = '';
  tagsEl.value = '';
}

// Event Listeners
// Save/Update note
saveBtn.onclick = async e => {
  e.preventDefault(); // prevent page reload
  const payload = {
    title: titleEl.value,
    content: bodyEl.value,
    tags: tagsEl.value.split(',').map(t => t.trim()).filter(Boolean)
  };

  try {
    if (current && getId(current)) {
      // Update
      const res = await fetch(`/api/notes/${getId(current)}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const updated = await res.json();
      notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
    } else {
      // Create
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const created = await res.json();
      notes.unshift(created);
    }
    closeEditor();
    render();
  } catch(err) { 
    console.error(err); 
    customAlert('Failed to add note.'); 
  }
};

// Delete note
deleteBtn.onclick = async () => {
  if (!current || !getId(current)) return;
  if (!await customConfirm('Delete this note?')) return;

  try {
    await fetch(`/api/notes/${getId(current)}`, { method:'DELETE' });
    notes = notes.filter(n => getId(n) !== getId(current));
    closeEditor();
    render();
  } catch(err) { 
    console.error(err); 
    customAlert('Failed to delete note.');
  }
};

// Cancel button
cancelBtn.onclick = () => closeEditor();

// Click outside of editor to close
editor.onclick = e => {
  if (e.target === editor) {
    closeEditor();
  }
};

// New note button
newNoteBtn.onclick = () => openEditor({});

// Search notes
searchBar.oninput = () => {
  const query = searchBar.value.toLowerCase().trim();
  if (!query) {
    render();
    return;
  }
  const filtered = notes.filter(n => {
    const titleMatch = (n.title || '').toLowerCase().includes(query);
    const tagsMatch = (n.tags || []).some(t => t.toLowerCase().includes(query));
    return titleMatch || tagsMatch;
  });
  render(filtered);
};

// LLM Functions
summarizeBtn.onclick = async () => {
    if (!current || !getId(current)) return;

    // Show loading state
    summarizeBtn.textContent = 'Summarizing...';
    summarizeBtn.disabled = true;

    try {
        const res = await fetch(`/api/notes/${getId(current)}/summarize`, {
            method: 'POST',
        });
        const updated = await res.json();
        // Update the note on the frontend
        notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
        bodyEl.value = updated.content; // Update body with original content
        customAlert("Summary created! It will appear on your note card.");
    } catch (err) {
        console.error(err);
        customAlert('Failed to summarize note.');
    } finally {
        // Reset loading state
        summarizeBtn.textContent = 'Summarize';
        summarizeBtn.disabled = false;
        render(); // Rerender to show the summary
    }
};

generateTitleBtn.onclick = async () => {
    if (!current || !getId(current)) return;

    // Show loading state
    generateTitleBtn.textContent = 'Generating...';
    generateTitleBtn.disabled = true;

    try {
        const res = await fetch(`/api/notes/${getId(current)}/generate-title`, {
            method: 'POST',
        });
        const updated = await res.json();
        // Update the note on the frontend
        notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
        titleEl.value = updated.title; // Update editor title
        customAlert("Title generated!");
    } catch (err) {
        console.error(err);
        customAlert('Failed to generate title.');
    } finally {
        // Reset loading state
        generateTitleBtn.textContent = 'Generate Title';
        generateTitleBtn.disabled = false;
        render(); // Rerender to show the new title
    }
};

loadNotes();
