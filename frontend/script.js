let notes = [];
let displayedNotes = [];
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
const searchBar = document.getElementById('searchBar');

// Custom message and confirm elements
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageOkBtn = document.getElementById('messageOkBtn');
const confirmBox = document.getElementById('confirmBox');
const confirmText = document.getElementById('confirmText');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

// Helper to get ID
const getId = n => n?._id;

// Show editor when the button is clicked
newNoteBtn.onclick = () => openEditor();

// Close the editor when cancel is clicked
cancelBtn.onclick = () => closeEditor();

// Close editor when clicking outside the content box
editor.onclick = (e) => {
  if (e.target === editor) {
    closeEditor();
  }
};

// Custom message box functions
function showMessage(message) {
  messageText.textContent = message;
  messageBox.classList.add('show');
}

messageOkBtn.onclick = () => {
  messageBox.classList.remove('show');
};

// Custom confirm box function
function showConfirm(message) {
  return new Promise(resolve => {
    confirmText.textContent = message;
    confirmBox.classList.add('show');
    confirmYesBtn.onclick = () => {
      confirmBox.classList.remove('show');
      resolve(true);
    };
    confirmNoBtn.onclick = () => {
      confirmBox.classList.remove('show');
      resolve(false);
    };
  });
}

// Load all notes from the backend
async function loadNotes() {
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    notes = Array.isArray(data) ? data : [];

  } catch (err) {
    console.error(err);
    showMessage('Failed to load notes from the backend. Displaying a local example note.');
  }

  // Add a default example note if the notes list is empty after the fetch attempt
  if (notes.length === 0) {
    notes.push({
      _id: 'example-note-1',
      title: 'A Local Example Note',
      body: 'This note is a local example and is not saved to the backend. It shows you what the app looks like with content, even if the server is offline.',
      tags: ['local', 'example'],
    });
  }

  displayedNotes = notes;
  render();
}

// Render note cards
function render() {
  listEl.innerHTML = '';
  if (displayedNotes.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'No notes found. Try a different search!';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = '#777';
      listEl.appendChild(emptyMsg);
  } else {
    displayedNotes.forEach(n => {
      const div = document.createElement('div');
      div.className = 'note-item';
      div.onclick = () => openEditor(n);

      const title = document.createElement('div');
      title.className = 'note-title';
      title.textContent = n.title || 'Untitled';

      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'note-tags';
      (n.tags || []).forEach(t => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'note-tag';
        tagSpan.textContent = t;
        tagsWrap.appendChild(tagSpan);
      });
      
      const body = document.createElement('div');
      body.className = 'note-body';
      body.textContent = n.body || '';

      div.appendChild(title);
      div.appendChild(body);
      div.appendChild(tagsWrap);
      listEl.appendChild(div);
    });
  }
}

// Function to handle search
function handleSearch(query) {
    const lowerQuery = query.toLowerCase();
    displayedNotes = notes.filter(note => {
        const titleMatch = note.title?.toLowerCase().includes(lowerQuery);
        const tagsMatch = note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
        return titleMatch || tagsMatch;
    });
    render();
}

// Add event listener for the search bar
searchBar.addEventListener('input', (e) => handleSearch(e.target.value));

function openEditor(note) {
  current = note;
  titleEl.value = note?.title || '';
  bodyEl.value = note?.body || '';
  tagsEl.value = note?.tags?.join(', ') || '';
  saveBtn.textContent = note ? 'Save' : 'Add';
  deleteBtn.style.display = note ? 'inline-block' : 'none';
  editor.classList.add('show');
}

function closeEditor() {
  editor.classList.remove('show');
  current = null;
  titleEl.value = '';
  bodyEl.value = '';
  tagsEl.value = '';
}

// Save or create note via API
saveBtn.onclick = async (e) => {
  e.preventDefault();
  const payload = {
    title: titleEl.value,
    body: bodyEl.value,
    tags: tagsEl.value.split(',').map(t => t.trim()).filter(Boolean)
  };

  try {
    let res;
    if (current && getId(current)) {
      // Update existing note
      res = await fetch(`/api/notes/${getId(current)}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
    } else {
      // Create a new note
      res = await fetch('/api/notes', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
    }
    
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    await loadNotes(); // Reload notes from the backend
    closeEditor();
  } catch(err) {
    console.error(err);
    showMessage('Failed to save note. Please check the console for errors.');
  }
};

// Delete note via API
deleteBtn.onclick = async () => {
  if (!current || !getId(current)) return;
  const confirmed = await showConfirm('Are you sure you want to delete this note?');
  if (!confirmed) {
    return;
  }
  try {
    const res = await fetch(`/api/notes/${getId(current)}`, { method:'DELETE' });
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    await loadNotes(); // Reload notes from the backend
    closeEditor();
  } catch(err) {
    console.error(err);
    showMessage('Failed to delete note. Please check the console for errors.');
  }
};

// Load initial notes on page load
window.onload = loadNotes;
