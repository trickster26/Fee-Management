const { ipcRenderer } = require('electron');

// Helper functions
function showSection(sectionId) {
  document.querySelectorAll('.screen, .sub-screen').forEach(el => el.classList.add('hidden'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.remove('hidden');
  if (sectionId === 'dashboard') ipcRenderer.send('get-dashboard-stats');
  if (sectionId === 'sessionsSection') ipcRenderer.send('get-sessions');
  if (sectionId === 'feesSection') ipcRenderer.send('get-fee-types');
  if (sectionId === 'routesSection') ipcRenderer.send('get-routes');
  if (sectionId === 'studentsSection') {
    ipcRenderer.send('get-students');
    ipcRenderer.send('get-routes'); // For route dropdown
  }
}

function clearForm(formId) {
  document.querySelectorAll(`#${formId} input:not([type=hidden])`).forEach(input => {
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
  document.querySelectorAll(`#${formId} select`).forEach(select => {
    select.selectedIndex = 0;
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatCurrency(amount) {
  return parseFloat(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

// Setup event listeners
window.onload = () => {
  console.log('Renderer: App loaded, checking school');
  ipcRenderer.send('get-school');

  // Add event listeners for UI elements
  // School setup
  document.getElementById('saveSchoolBtn')?.addEventListener('click', addSchool);
  
  // Navigation buttons
  document.getElementById('sessionsBtn')?.addEventListener('click', () => showSection('sessionsSection'));
  document.getElementById('feesBtn')?.addEventListener('click', () => showSection('feesSection'));
  document.getElementById('routesBtn')?.addEventListener('click', () => showSection('routesSection'));
  document.getElementById('studentsBtn')?.addEventListener('click', () => showSection('studentsSection'));
  
  // Back buttons
  document.getElementById('sessionsBackBtn')?.addEventListener('click', () => showSection('dashboard'));
  document.getElementById('feesBackBtn')?.addEventListener('click', () => showSection('dashboard'));
  document.getElementById('routesBackBtn')?.addEventListener('click', () => showSection('dashboard'));
  document.getElementById('studentsBackBtn')?.addEventListener('click', () => showSection('dashboard'));
  document.getElementById('studentFeesBackBtn')?.addEventListener('click', () => showSection('studentsSection'));
  
  // Form submission buttons
  document.getElementById('addSessionBtn')?.addEventListener('click', addSession);
  document.getElementById('addFeeBtn')?.addEventListener('click', addFeeType);
  document.getElementById('addRouteBtn')?.addEventListener('click', addRoute);
  document.getElementById('addStudentBtn')?.addEventListener('click', addStudent);
  document.getElementById('addStudentFeeBtn')?.addEventListener('click', addStudentFee);
};

// School setup handlers
ipcRenderer.on('school-info', (event, school) => {
  if (school && !school.error) {
    // School exists, show dashboard
    document.getElementById('dashboardTitle').textContent = `${school.name} Dashboard`;
    showSection('dashboard');
    ipcRenderer.send('get-dashboard-stats');
  } else {
    // No school exists, show setup screen
    showSection('schoolSetup');
  }
});

ipcRenderer.on('school-added', (event, result) => {
  if (result.error) {
    document.getElementById('setupError').textContent = result.error;
  } else {
    // Show web token to user
    alert(`School registered successfully!\n\nYour Web Login Token: ${result.webToken}\n\nPlease save this token securely as it will be needed for web access.`);
    document.getElementById('dashboardTitle').textContent = `${result.name} Dashboard`;
    showSection('dashboard');
    ipcRenderer.send('get-dashboard-stats');
  }
});

// Dashboard handlers
ipcRenderer.on('dashboard-stats', (event, stats) => {
  if (stats && !stats.error) {
    document.getElementById('activeSessions').textContent = stats.activeSessions || 0;
    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('pendingFees').textContent = stats.pendingFees || 0;
  } else {
    console.error('Error loading dashboard stats:', stats?.error || 'Unknown error');
  }
});

// Session handlers
ipcRenderer.on('sessions-list', (event, sessions) => {
  const tbody = document.getElementById('sessionsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  sessions.forEach(session => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${session.name}</td>
      <td>${formatDate(session.start_date)}</td>
      <td>${formatDate(session.end_date)}</td>
      <td><span class="status-badge ${session.is_active ? 'active' : 'inactive'}">${session.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="action-btn edit-btn" data-id="${session.id}">Edit</button>
        <button class="action-btn delete-btn" data-id="${session.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Add event listeners for action buttons
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      editSession(id);
    });
  });
  
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteSession(id);
    });
  });
});

// Fee type handlers
ipcRenderer.on('fee-types-list', (event, feeTypes) => {
  const tbody = document.getElementById('feesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  feeTypes.forEach(fee => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${fee.name}</td>
      <td>${formatCurrency(fee.amount)}</td>
      <td>${fee.is_recurring ? 'Yes' : 'No'}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${fee.id}">Edit</button>
        <button class="action-btn delete-btn" data-id="${fee.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Add event listeners for action buttons
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      editFeeType(id);
    });
  });
  
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteFeeType(id);
    });
  });
  
  // Also update fee type dropdown in student fees form
  updateFeeTypeDropdown(feeTypes);
});

// Route handlers
ipcRenderer.on('routes-list', (event, routes) => {
  const tbody = document.getElementById('routesTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    routes.forEach(route => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${route.name}</td>
        <td>${route.distance_km ? route.distance_km.toFixed(1) : 'N/A'}</td>
        <td>${route.base_fee ? formatCurrency(route.base_fee) : 'N/A'}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${route.id}">Edit</button>
          <button class="action-btn delete-btn" data-id="${route.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        editRoute(id);
      });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteRoute(id);
      });
    });
  }
  
  // Also update route dropdown in student form
  updateRouteDropdown(routes);
});

// Student handlers
ipcRenderer.on('students-list', (event, students) => {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.admission_number}</td>
      <td>${student.route_name || 'None'}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${student.id}">Edit</button>
        <button class="action-btn delete-btn" data-id="${student.id}">Delete</button>
        <button class="action-btn fees-btn" data-id="${student.id}" data-name="${student.name}">Fees</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Add event listeners for action buttons
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      editStudent(id);
    });
  });
  
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteStudent(id);
    });
  });
  
  tbody.querySelectorAll('.fees-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      viewStudentFees(id, name);
    });
  });
});

// Student fees handlers
ipcRenderer.on('student-fees-list', (event, fees) => {
  const tbody = document.getElementById('studentFeesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  fees.forEach(fee => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${fee.fee_name}</td>
      <td>${formatCurrency(fee.amount)}</td>
      <td>${formatDate(fee.due_date)}</td>
      <td>
        <select class="status-dropdown" data-id="${fee.id}" data-student-id="${fee.student_id}">
          <option value="pending" ${fee.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="paid" ${fee.status === 'paid' ? 'selected' : ''}>Paid</option>
          <option value="late" ${fee.status === 'late' ? 'selected' : ''}>Late</option>
          <option value="waived" ${fee.status === 'waived' ? 'selected' : ''}>Waived</option>
        </select>
      </td>
      <td>
        <button class="action-btn delete-btn" data-id="${fee.id}" data-student-id="${fee.student_id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Add event listeners
  tbody.querySelectorAll('.status-dropdown').forEach(dropdown => {
    dropdown.addEventListener('change', () => {
      const id = dropdown.getAttribute('data-id');
      const studentId = dropdown.getAttribute('data-student-id');
      const status = dropdown.value;
      updateFeeStatus(id, studentId, status);
    });
  });
  
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const studentId = btn.getAttribute('data-student-id');
      deleteStudentFee(id, studentId);
    });
  });
});

// Helper functions for dropdown updates
function updateRouteDropdown(routes) {
  const dropdown = document.getElementById('studentRoute');
  if (!dropdown) return;
  
  // Keep the first "None" option
  const noneOption = dropdown.options[0];
  dropdown.innerHTML = '';
  dropdown.appendChild(noneOption);
  
  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.id;
    option.textContent = route.name;
    dropdown.appendChild(option);
  });
}

function updateFeeTypeDropdown(feeTypes) {
  const dropdown = document.getElementById('feeType');
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  
  feeTypes.forEach(fee => {
    const option = document.createElement('option');
    option.value = fee.id;
    option.textContent = `${fee.name} (${formatCurrency(fee.amount)})`;
    option.dataset.amount = fee.amount;
    dropdown.appendChild(option);
  });
  
  // Set default amount if a fee type is selected
  if (dropdown.options.length > 0) {
    const amountInput = document.getElementById('feeAmount');
    if (amountInput) {
      amountInput.value = dropdown.options[0].dataset.amount || '';
    }
  }
  
  // Add event listener to update amount when fee type changes
  dropdown.addEventListener('change', () => {
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const amountInput = document.getElementById('feeAmount');
    if (amountInput && selectedOption) {
      amountInput.value = selectedOption.dataset.amount || '';
    }
  });
}

// Form submission functions
function addSchool() {
  const name = document.getElementById('schoolName').value.trim();
  const location = document.getElementById('schoolLocation').value.trim();
  const sessionStartMonth = parseInt(document.getElementById('sessionStartMonth').value);
  
  if (!name || !location) {
    alert('School name and location are required');
    return;
  }
  
  ipcRenderer.send('add-school', { name, location, sessionStartMonth });
}

function addSession() {
  const name = document.getElementById('sessionName').value.trim();
  const startDate = document.getElementById('sessionStartDate').value;
  const endDate = document.getElementById('sessionEndDate').value;
  const isActive = document.getElementById('sessionActive').checked;
  
  if (!name || !startDate || !endDate) {
    alert('All fields are required');
    return;
  }
  
  if (new Date(startDate) >= new Date(endDate)) {
    alert('End date must be after start date');
    return;
  }
  
  if (isActive && !confirm('Setting this session as active will deactivate all other sessions. Continue?')) {
    return;
  }
  
  ipcRenderer.send('add-session', {
    name,
    start_date: startDate,
    end_date: endDate,
    is_active: isActive
  });
  
  clearForm('sessionForm');
}

function addFeeType() {
  const name = document.getElementById('feeName').value.trim();
  const amount = parseFloat(document.getElementById('feeAmount').value);
  const isRecurring = document.getElementById('feeRecurring').checked;
  
  if (!name || isNaN(amount)) {
    alert('Name and amount are required');
    return;
  }
  
  ipcRenderer.send('add-fee-type', {
    name,
    amount,
    is_recurring: isRecurring
  });
  
  clearForm('feeForm');
}

function addRoute() {
  const name = document.getElementById('routeName').value.trim();
  const distance = parseFloat(document.getElementById('routeDistance').value);
  const fee = parseFloat(document.getElementById('routeFee').value);
  
  if (!name || isNaN(distance) || isNaN(fee)) {
    alert('All fields are required');
    return;
  }
  
  ipcRenderer.send('add-route', {
    name,
    distance_km: distance,
    base_fee: fee
  });
  
  clearForm('routeForm');
}

function addStudent() {
  const name = document.getElementById('studentName').value.trim();
  const admissionNumber = document.getElementById('admissionNumber').value.trim();
  const routeDropdown = document.getElementById('studentRoute');
  const routeId = routeDropdown.value ? parseInt(routeDropdown.value) : null;
  
  if (!name || !admissionNumber) {
    alert('Name and admission number are required');
    return;
  }
  
  ipcRenderer.send('add-student', {
    name,
    admission_number: admissionNumber,
    route_id: routeId
  });
  
  clearForm('studentForm');
}

function addStudentFee() {
  const studentId = document.getElementById('studentFeeStudentId').value;
  const feeTypeDropdown = document.getElementById('feeType');
  const feeTypeId = parseInt(feeTypeDropdown.value);
  const amount = parseFloat(document.getElementById('feeAmount').value);
  const dueDate = document.getElementById('feeDueDate').value;
  
  if (!studentId || !feeTypeId || isNaN(amount) || !dueDate) {
    alert('All fields are required');
    return;
  }
  
  ipcRenderer.send('add-student-fee', {
    student_id: studentId,
    fee_type_id: feeTypeId,
    amount,
    due_date: dueDate
  });
  
  clearForm('studentFeeForm');
}

// CRUD operations
function editSession(id) {
  // Implementation will be added in a future update
  alert('Edit session functionality will be available in a future update');
}

function deleteSession(id) {
  if (confirm('Are you sure you want to delete this session? This cannot be undone.')) {
    ipcRenderer.send('delete-session', id);
  }
}

function editFeeType(id) {
  // Implementation will be added in a future update
  alert('Edit fee type functionality will be available in a future update');
}

function deleteFeeType(id) {
  if (confirm('Are you sure you want to delete this fee type? This cannot be undone.')) {
    ipcRenderer.send('delete-fee-type', id);
  }
}

function editRoute(id) {
  // Implementation will be added in a future update
  alert('Edit route functionality will be available in a future update');
}

function deleteRoute(id) {
  if (confirm('Are you sure you want to delete this route? This cannot be undone.')) {
    ipcRenderer.send('delete-route', id);
  }
}

function editStudent(id) {
  // Implementation will be added in a future update
  alert('Edit student functionality will be available in a future update');
}

function deleteStudent(id) {
  if (confirm('Are you sure you want to delete this student? This will also delete all associated fees. This cannot be undone.')) {
    ipcRenderer.send('delete-student', id);
  }
}

function viewStudentFees(id, name) {
  document.getElementById('studentFeesName').textContent = name;
  document.getElementById('studentFeeStudentId').value = id;
  
  showSection('studentFeesSection');
  ipcRenderer.send('get-student-fees', id);
  ipcRenderer.send('get-fee-types');
}

function updateFeeStatus(id, studentId, status) {
  ipcRenderer.send('update-fee-status', { id, student_id: studentId, status });
}

function deleteStudentFee(id, studentId) {
  if (confirm('Are you sure you want to delete this fee? This cannot be undone.')) {
    ipcRenderer.send('delete-student-fee', { id, student_id: studentId });
  }
}

// Initialize on load
console.log('Renderer script loaded');