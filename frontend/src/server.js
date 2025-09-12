// --- CONFIGURATION ---
// The full URL to your running backend server
const API_URL = "http://localhost:5000";


// --- Existing Code (with updated fetch calls) ---
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
// ADDED ELEMENT REFERENCE
const elaborateBtn = document.getElementById('elaborateBtn');
const searchBar = document.getElementById('searchBar');

const modalBox = document.getElementById('messageModal');
const modalText = document.getElementById('messageText');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

const getId = n => n?._id;

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

async function loadNotes() {
  try {
    const res = await fetch(`${API_URL}/api/notes`);
    const data = await res.json();
    notes = Array.isArray(data) ? data : [];
    render();
  } catch (err) {
    console.error("Failed to load notes from backend.", err);
    customAlert("Could not connect to the backend. Please make sure the server is running.");
    render();
  }
}

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
    body.textContent = n.summary || n.elaboration || n.content;

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

function openEditor(note) {
  current = note;
  titleEl.value = note.title || '';
  bodyEl.value = note.content || '';
  tagsEl.value = (note.tags || []).join(', ');

  deleteBtn.style.display = getId(note) ? 'inline-block' : 'none';
  summarizeBtn.style.display = getId(note) ? 'inline-block' : 'none';
  generateTitleBtn.style.display = getId(note) ? 'inline-block' : 'none';
  // ADDED VISIBILITY TOGGLE
  elaborateBtn.style.display = getId(note) ? 'inline-block' : 'none';
  
  saveBtn.textContent = getId(note) ? 'Save' : 'Add';

  editor.classList.add('show');
}

function closeEditor() {
  current = null;
  editor.classList.remove('show');
  titleEl.value = '';
  bodyEl.value = '';
  tagsEl.value = '';
}

saveBtn.onclick = async e => {
  e.preventDefault();
  const payload = {
    title: titleEl.value,
    content: bodyEl.value,
    tags: tagsEl.value.split(',').map(t => t.trim()).filter(Boolean)
  };

  try {
    if (current && getId(current)) {
      // Update
      const res = await fetch(`${API_URL}/api/notes/${getId(current)}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const updated = await res.json();
      notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
    } else {
      // Create
      const res = await fetch(`${API_URL}/api/notes`, {
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
    customAlert('Failed to save note.'); 
  }
};

deleteBtn.onclick = async () => {
  if (!current || !getId(current)) return;
  if (!await customConfirm('Delete this note?')) return;

  try {
    await fetch(`${API_URL}/api/notes/${getId(current)}`, { method:'DELETE' });
    notes = notes.filter(n => getId(n) !== getId(current));
    closeEditor();
    render();
  } catch(err) { 
    console.error(err); 
    customAlert('Failed to delete note.');
  }
};

cancelBtn.onclick = () => closeEditor();

editor.onclick = e => {
  if (e.target === editor) {
    closeEditor();
  }
};

newNoteBtn.onclick = () => openEditor({});

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

summarizeBtn.onclick = async () => {
    if (!current || !getId(current)) return;
    summarizeBtn.textContent = 'Summarizing...';
    summarizeBtn.disabled = true;
    try {
        const res = await fetch(`${API_URL}/api/notes/${getId(current)}/summarize`, {
            method: 'POST',
        });
        const updated = await res.json();
        notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
        bodyEl.value = updated.content;
        customAlert("Summary created! It will appear on your note card.");
    } catch (err) {
        console.error(err);
        customAlert('Failed to summarize note.');
    } finally {
        summarizeBtn.textContent = 'Summarize';
        summarizeBtn.disabled = false;
        render();
    }
};

generateTitleBtn.onclick = async () => {
    if (!current || !getId(current)) return;
    generateTitleBtn.textContent = 'Generating...';
    generateTitleBtn.disabled = true;
    try {
        const res = await fetch(`${API_URL}/api/notes/${getId(current)}/generate-title`, {
            method: 'POST',
        });
        const updated = await res.json();
        notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
        titleEl.value = updated.title;
        customAlert("Title generated!");
    } catch (err) {
        console.error(err);
        customAlert('Failed to generate title.');
    } finally {
        generateTitleBtn.textContent = 'Generate Title';
        generateTitleBtn.disabled = false;
        render();
    }
};

// --- ADDED ELABORATE FUNCTION ---
elaborateBtn.onclick = async () => {
    if (!current || !getId(current)) return;

    elaborateBtn.textContent = 'Elaborating...';
    elaborateBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/notes/${getId(current)}/elaborate`, {
            method: 'POST',
        });
        const updated = await res.json();
        notes = notes.map(n => getId(n) === getId(updated) ? updated : n);
        // Update the editor with the new elaborated content
        bodyEl.value = updated.elaboration;
        customAlert("Content has been elaborated!");
    } catch (err) {
        console.error(err);
        customAlert('Failed to elaborate content.');
    } finally {
        elaborateBtn.textContent = 'Elaborate';
        elaborateBtn.disabled = false;
        render();
    }
};

loadNotes();

