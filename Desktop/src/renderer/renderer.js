const { ipcRenderer } = require('electron');

window.onload = () => {
  console.log('Renderer: App loaded, checking school');
  ipcRenderer.send('get-school');

  // Setup event listeners
  document.getElementById('saveSchoolBtn').addEventListener('click', addSchool);
  document.getElementById('sessionsBtn').addEventListener('click', () => showSection('sessionsSection'));
  document.getElementById('feesBtn').addEventListener('click', () => showSection('feesSection'));
  document.getElementById('routesBtn').addEventListener('click', () => showSection('routesSection'));
  document.getElementById('studentsBtn').addEventListener('click', () => showSection('studentsSection'));
  document.getElementById('addSessionBtn').addEventListener('click', addSession);
  document.getElementById('sessionsBackBtn').addEventListener('click', () => showSection('dashboard'));
  document.getElementById('feesBackBtn').addEventListener('click', () => showSection('dashboard'));
  document.getElementById('addRouteBtn').addEventListener('click', addRoute);
  document.getElementById('routesBackBtn').addEventListener('click', () => showSection('dashboard'));
  document.getElementById('studentsBackBtn').addEventListener('click', () => showSection('dashboard'));
};

// Update school-added handler
ipcRenderer.on('school-added', (event, result) => {
  if (result.error) {
    document.getElementById('setupError').textContent = result.error;
  } else {
    // Show web token to user
    alert(`School registered successfully!\n\nYour Web Login Token: ${result.webToken}\n\nPlease save this token securely as it will be needed for web access.`);
    showSection('dashboard');
    document.getElementById('dashboardTitle').textContent = `${result.name} Dashboard`;
    ipcRenderer.send('get-dashboard-stats');
  }
});

ipcRenderer.on('dashboard-stats', (event, stats) => {
  if (stats.error) return console.error('Renderer: Stats error:', stats.error);
  document.getElementById('sessionCount').textContent = stats.active_sessions;
  document.getElementById('studentCount').textContent = stats.student_count;
  document.getElementById('pendingFees').textContent = stats.pending_fees;
});

ipcRenderer.on('session-added', (event, result) => {
  if (result.error) alert('Error: ' + result.error);
  else {
    ipcRenderer.send('get-sessions');
    ipcRenderer.send('get-dashboard-stats');
  }
});

ipcRenderer.on('sessions-list', (event, sessions) => {
  const tbody = document.getElementById('sessionsBody');
  tbody.innerHTML = sessions.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.start_date}</td>
      <td>${s.end_date}</td>
      <td>${s.is_active ? 'Yes' : 'No'}</td>
    </tr>
  `).join('');
});

ipcRenderer.on('sessions-list', (event, sessions) => {
  const tbody = document.getElementById('sessionsBody');
  tbody.innerHTML = sessions.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${formatDate(s.start_date)}</td>
      <td>${formatDate(s.end_date)}</td>
      <td>
        <span class="status-badge ${s.is_active ? 'active' : 'inactive'}">
          ${s.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="action-btn edit-btn" onclick="editSession(${s.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteSession(${s.id})">Delete</button>
      </td>
    </tr>
  `).join('');
});

// Enhanced session form validation and submission
function addSession() {
  const name = document.getElementById('sessionName').value.trim();
  const startDate = document.getElementById('sessionStartDate').value;
  const endDate = document.getElementById('sessionEndDate').value;
  const isActive = document.getElementById('sessionActive').checked;

  // Validation
  if (!name || !startDate || !endDate) {
    alert('Please fill in all required fields');
    return;
  }

  if (new Date(startDate) >= new Date(endDate)) {
    alert('End date must be after start date');
    return;
  }

  const data = { name, start_date: startDate, end_date: endDate, is_active: isActive };
  
  // If setting as active, confirm with user as it will deactivate other sessions
  if (isActive) {
    if (!confirm('Setting this session as active will deactivate all other sessions. Continue?')) {
      return;
    }
  }

  ipcRenderer.send('add-session', data);
  clearForm('sessionForm');
}

// Helper function to format dates
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Session edit handler
function editSession(id) {
  ipcRenderer.send('get-session', id);
}

// Session delete handler
function deleteSession(id) {
  if (confirm('Are you sure you want to delete this session? This cannot be undone.')) {
    ipcRenderer.send('delete-session', id);
  }
}

ipcRenderer.on('route-added', (event, result) => {
  if (result.error) alert('Error: ' + result.error);
  else {
    ipcRenderer.send('get-routes');
  }
});

ipcRenderer.on('routes-list', (event, routes) => {
  const tbody = document.getElementById('routesBody');
  tbody.innerHTML = routes.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.distance_km || 'N/A'}</td>
      <td>${r.base_fee || 'N/A'}</td>
    </tr>
  `).join('');
});

function addSchool() {
  const data = {
    name: document.getElementById('schoolName').value.trim(),
    location: document.getElementById('schoolLocation').value.trim(),
    sessionStartMonth: parseInt(document.getElementById('sessionStartMonth').value)
  };

  if (!data.name || !data.location) {
    alert('School name and location are required');
    return;
  }

  ipcRenderer.send('add-school', data);
}

function addSession() {
  const data = {
    name: document.getElementById('sessionName').value.trim(),
    start_date: document.getElementById('sessionStartDate').value,
    end_date: document.getElementById('sessionEndDate').value,
    is_active: document.getElementById('sessionActive').checked
  };
  if (data.name && data.start_date && data.end_date) {
    ipcRenderer.send('add-session', data);
    clearForm('sessionForm');
  } else {
    alert('All session fields are required');
  }
}

function addRoute() {
  const data = {
    name: document.getElementById('routeName').value.trim(),
    distance_km: parseFloat(document.getElementById('routeDistance').value) || null,
    base_fee: parseFloat(document.getElementById('routeFee').value) || null
  };
  if (data.name) {
    ipcRenderer.send('add-route', data);
    clearForm('routeForm');
  } else {
    alert('Route name is required');
  }
}

function showSection(sectionId) {
  document.querySelectorAll('.screen, .sub-screen').forEach(el => el.classList.add('hidden'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.remove('hidden');
  if (sectionId === 'sessionsSection') ipcRenderer.send('get-sessions');
  if (sectionId === 'routesSection') ipcRenderer.send('get-routes');
  if (sectionId === 'dashboard') ipcRenderer.send('get-dashboard-stats');
}

function clearForm(formId) {
  document.querySelectorAll(`#${formId} input`).forEach(input => input.value = '');
  document.querySelectorAll(`#${formId} input[type=checkbox]`).forEach(input => input.checked = false);
}

console.log('Renderer script loaded');

window.onload = () => {
  console.log('Window loaded, setting up event listeners');
  
  // Add error handling for missing elements
  const elements = {
    'saveSchoolBtn': document.getElementById('saveSchoolBtn'),
    'sessionsBtn': document.getElementById('sessionsBtn'),
    'feesBtn': document.getElementById('feesBtn'),
    'routesBtn': document.getElementById('routesBtn'),
    'studentsBtn': document.getElementById('studentsBtn'),
    'addSessionBtn': document.getElementById('addSessionBtn'),
    'sessionsBackBtn': document.getElementById('sessionsBackBtn'),
    'feesBackBtn': document.getElementById('feesBackBtn'),
    'addRouteBtn': document.getElementById('addRouteBtn'),
    'routesBackBtn': document.getElementById('routesBackBtn'),
    'studentsBackBtn': document.getElementById('studentsBackBtn')
  };

  // Check if all elements exist
  for (const [id, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`Element with id '${id}' not found`);
    }
  }

  // Add event listeners only if elements exist
  elements.saveSchoolBtn?.addEventListener('click', addSchool);
  elements.sessionsBtn?.addEventListener('click', () => {
    console.log('Sessions button clicked');
    showSection('sessionsSection');
  });
  elements.feesBtn?.addEventListener('click', () => {
    console.log('Fees button clicked');
    showSection('feesSection');
  });
  elements.routesBtn?.addEventListener('click', () => {
    console.log('Routes button clicked');
    showSection('routesSection');
  });
  elements.studentsBtn?.addEventListener('click', () => {
    console.log('Students button clicked');
    showSection('studentsSection');
  });
  elements.addSessionBtn?.addEventListener('click', addSession);
  elements.sessionsBackBtn?.addEventListener('click', () => showSection('dashboard'));
  elements.feesBackBtn?.addEventListener('click', () => showSection('dashboard'));
  elements.addRouteBtn?.addEventListener('click', addRoute);
  elements.routesBackBtn?.addEventListener('click', () => showSection('dashboard'));
  elements.studentsBackBtn?.addEventListener('click', () => showSection('dashboard'));
};

// Modify the showSection function to add debugging
function showSection(sectionId) {
  console.log('Showing section:', sectionId);
  
  const sections = document.querySelectorAll('.screen, .sub-screen');
  console.log('Found sections:', sections.length);
  
  sections.forEach(el => {
    console.log('Processing section:', el.id);
    el.classList.add('hidden');
  });
  
  const section = document.getElementById(sectionId);
  if (section) {
    console.log('Found target section:', sectionId);
    section.classList.remove('hidden');
    
    // Trigger appropriate data loading
    if (sectionId === 'sessionsSection') {
      console.log('Requesting sessions data');
      ipcRenderer.send('get-sessions');
    }
    if (sectionId === 'routesSection') {
      console.log('Requesting routes data');
      ipcRenderer.send('get-routes');
    }
    if (sectionId === 'dashboard') {
      console.log('Requesting dashboard stats');
      ipcRenderer.send('get-dashboard-stats');
    }
  } else {
    console.error('Section not found:', sectionId);
  }
}

// Update the school-info handler
ipcRenderer.on('school-info', (event, school) => {
  console.log('Received school info:', school);
  if (school && !school.error) {
    showSection('dashboard');
    const titleElement = document.getElementById('dashboardTitle');
    if (titleElement) {
      titleElement.textContent = `${school.name} Dashboard`;
    }
    ipcRenderer.send('get-dashboard-stats');
    ipcRenderer.send('get-sessions');
  } else {
    showSection('schoolSetup');
    if (school && school.error) {
      console.error('School info error:', school.error);
      alert('Error loading school data: ' + school.error);
    }
  }
});