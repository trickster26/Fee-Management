const { ipcRenderer } = require('electron');
const path = require('path');
const { 
  formatCurrency, 
  formatDate, 
  safelyUpdateElement, 
  showNotification, 
  throttle 
} = require('../utils/helpers');

// Console log for initialization
console.log('Initializing School Management System...');

// Global variables
let currentSection = 'dashboard';
let isSchoolSetup = false;

// Theme handling
let darkMode = false;
const themeToggle = document.getElementById('themeToggle');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  
  // Check if dark mode is saved in local storage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    darkMode = true;
    document.body.classList.add('dark-mode');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
  
  // Check if school is set up and auto-login if it exists
  ipcRenderer.send('get-school');
  
  // Set up event listeners
  setupEventListeners();
});

// Helper Functions
function showSection(sectionId) {
  console.log(`Showing section: ${sectionId}`);
  
  // Map section IDs to the actual element IDs in the HTML
  const sectionMap = {
    'dashboard': 'dashboard',
    'sessions': 'sessionsSection',
    'fees': 'feesSection',
    'routes': 'routesSection',
    'students': 'studentsSection'
  };
  
  const actualSectionId = sectionMap[sectionId] || sectionId;
  
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.add('hidden');
  });
  
  // Show the selected section
  const sectionToShow = document.getElementById(actualSectionId);
  if (sectionToShow) {
    console.log(`Found section element with ID: ${actualSectionId}`);
    sectionToShow.classList.remove('hidden');
    updatePageTitle(sectionId);
    updateActiveNavItem(sectionId);
    
    // Load data for specific sections
    if (sectionId === 'dashboard') {
      loadDashboardStats();
    } else if (sectionId === 'sessions') {
      loadSessions();
    } else if (sectionId === 'fees') {
      loadFeeTypes();
    } else if (sectionId === 'routes') {
      loadRoutes();
    } else if (sectionId === 'students') {
      loadStudents();
    }
  } else {
    console.warn(`Section element with ID: ${actualSectionId} not found`);
  }
}

function updatePageTitle(sectionId) {
  const titles = {
    'dashboard': 'Dashboard',
    'sessions': 'Sessions Management',
    'fees': 'Fee Types Management',
    'routes': 'Transport Routes',
    'students': 'Student Management'
  };
  
  const title = titles[sectionId] || 'School Management';
  safelyUpdateElement('currentPageTitle', title);
}

function updateActiveNavItem(sectionId) {
  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to the current section's nav item
  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
}

function toggleTheme() {
  darkMode = !darkMode;
  
  if (darkMode) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }
}

function getInitials(name) {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function showModal(modalId) {
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal() {
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    
    // Clear any hidden fields
    form.querySelectorAll('input[type="hidden"]').forEach(input => {
      input.value = '';
    });
  }
}

// School Setup Functions
function saveSchoolInfo() {
  console.log('Saving school information');
  
  const schoolName = document.getElementById('schoolName')?.value;
  const schoolLocation = document.getElementById('schoolLocation')?.value;
  const sessionStartMonth = document.getElementById('sessionStartMonth')?.value;
  
  if (!schoolName || !schoolLocation || !sessionStartMonth) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  // First check if school data already exists
  ipcRenderer.send('get-school');
  
  // Store the form data temporarily
  window.pendingSchoolData = {
    name: schoolName,
    location: schoolLocation,
    sessionStartMonth: parseInt(sessionStartMonth)
  };
  
  showNotification('Checking existing school data...', 'info');
}

// Dashboard Functions
function loadDashboardStats() {
  console.log('Loading dashboard stats...');
  ipcRenderer.send('get-dashboard-stats');
  
  // Update stats with placeholders until real data arrives
  safelyUpdateElement('activeSessions', '0');
  safelyUpdateElement('totalStudents', '0');
  safelyUpdateElement('pendingFees', '₹0');
  safelyUpdateElement('totalRoutes', '0');
  
  // Show placeholder charts while data loads
  loadFeeChart();
  loadRecentActivities();
}

function loadFeeChart() {
  // This would normally be a chart library implementation
  // For now, we'll just show a placeholder
  const chartElement = document.getElementById('feeChart');
  if (chartElement) {
    chartElement.innerHTML = `<div class="chart-placeholder">Fee collection chart will be displayed here</div>`;
  }
}

function loadRecentActivities() {
  // This would normally fetch recent activities from the database
  // For now, we'll just show a placeholder
  const activitiesElement = document.getElementById('recentActivities');
  if (activitiesElement) {
    activitiesElement.innerHTML = `<div class="activity-placeholder">No recent activities found</div>`;
  }
}

// Setup Event Listeners
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      if (section) {
        showSection(section);
      }
    });
  });
  
  // School setup form
  const schoolSetupForm = document.getElementById('schoolSetupForm');
  if (schoolSetupForm) {
    schoolSetupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSchoolInfo();
    });
  }
  
  // Save school info button
  const saveSchoolBtn = document.getElementById('saveSchoolBtn');
  if (saveSchoolBtn) {
    saveSchoolBtn.addEventListener('click', saveSchoolInfo);
  }
  
  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', hideModal);
  });
  
  // Add event handlers for buttons in the application
  setupButtonHandlers();
}

function setupButtonHandlers() {
  // Add Session Button
  const addSessionBtn = document.getElementById('addSessionBtn');
  if (addSessionBtn) {
    addSessionBtn.addEventListener('click', () => showSessionModal());
  }
  
  // Add Fee Type Button
  const addFeeTypeBtn = document.getElementById('addFeeTypeBtn');
  if (addFeeTypeBtn) {
    addFeeTypeBtn.addEventListener('click', () => showFeeTypeModal());
  }
  
  // Add Route Button
  const addRouteBtn = document.getElementById('addRouteBtn');
  if (addRouteBtn) {
    addRouteBtn.addEventListener('click', () => showRouteModal());
  }
  
  // Add Student Button
  const addStudentBtn = document.getElementById('addStudentBtn');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => showStudentModal());
  }
}

// IPC Renderer Event Handlers
ipcRenderer.on('school-info', (event, schoolInfo) => {
  console.log('School info result:', schoolInfo);
  
  // If we have pending school data to save, handle it here
  if (window.pendingSchoolData) {
    if (schoolInfo) {
      // School already exists
      showNotification('School information already exists', 'error');
      window.pendingSchoolData = null;
    } else {
      // No school exists yet, proceed with saving
      ipcRenderer.send('add-school', window.pendingSchoolData);
      showNotification('Saving school information...', 'info');
      window.pendingSchoolData = null;
    }
    return;
  }
  
  // Regular initialization flow
  if (schoolInfo) {
    // School is already set up, auto-login
    isSchoolSetup = true;
    const schoolSetup = document.getElementById('schoolSetup');
    const appLayout = document.getElementById('appLayout');
    
    if (schoolSetup) schoolSetup.classList.add('hidden');
    if (appLayout) appLayout.classList.remove('hidden');
    
    // Update school name and location in header
    safelyUpdateElement('schoolNameHeader', schoolInfo.name);
    safelyUpdateElement('schoolLocationDisplay', schoolInfo.location);
    
    // Show dashboard
    showSection('dashboard');
    
    // Load initial dashboard data
    loadDashboardStats();
    
    showNotification(`Welcome back to ${schoolInfo.name}!`, 'success');
  } else {
    // School is not set up, show setup form
    isSchoolSetup = false;
    const schoolSetup = document.getElementById('schoolSetup');
    const appLayout = document.getElementById('appLayout');
    
    if (schoolSetup) schoolSetup.classList.remove('hidden');
    if (appLayout) appLayout.classList.add('hidden');
    
    showNotification('Welcome! Please set up your school information.', 'info');
  }
});

ipcRenderer.on('school-added', (event, result) => {
  console.log('School added result:', result);
  
  if (result.success) {
    isSchoolSetup = true;
    
    // Hide setup screen, show app
    const schoolSetup = document.getElementById('schoolSetup');
    const appLayout = document.getElementById('appLayout');
    
    if (schoolSetup) schoolSetup.classList.add('hidden');
    if (appLayout) appLayout.classList.remove('hidden');
    
    // Update school name and location in header
    safelyUpdateElement('schoolNameHeader', result.data.name);
    safelyUpdateElement('schoolLocationDisplay', result.data.location);
    
    // Show dashboard
    showSection('dashboard');
    
    showNotification('School information saved successfully', 'success');
  } else {
    showNotification(result.error || 'Failed to save school information', 'error');
  }
});

ipcRenderer.on('dashboard-stats', (event, stats) => {
  console.log('Received dashboard stats:', stats);
  
  // Update the stats display
  safelyUpdateElement('activeSessions', stats.activeSessions || '0');
  safelyUpdateElement('totalStudents', stats.totalStudents || '0');
  safelyUpdateElement('pendingFees', formatCurrency(stats.pendingFees || 0));
  safelyUpdateElement('totalRoutes', stats.totalRoutes || '0');
});

// Session Functions
function loadSessions() {
  ipcRenderer.send('get-sessions');
}

function showSessionModal(mode = 'add', sessionId = null) {
  resetForm('sessionForm');
  safelyUpdateElement('modalTitle', mode === 'add' ? 'Add New Session' : 'Edit Session');
  
  if (mode === 'edit' && sessionId) {
    ipcRenderer.send('get-session', sessionId);
  }
  
  document.getElementById('sessionForm').style.display = 'block';
  document.getElementById('feeTypeForm').style.display = 'none';
  document.getElementById('routeForm').style.display = 'none';
  document.getElementById('studentForm').style.display = 'none';
  
  document.getElementById('modalOverlay').classList.add('active');
}

function saveSession() {
  const id = document.getElementById('sessionId').value;
  const name = document.getElementById('sessionName').value;
  const startDate = document.getElementById('sessionStartDate').value;
  const endDate = document.getElementById('sessionEndDate').value;
  const isActive = document.getElementById('sessionActive').checked;
  
  if (!name || !startDate || !endDate) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (new Date(startDate) >= new Date(endDate)) {
    showNotification('End date must be after start date', 'error');
    return;
  }
  
  if (id) {
    // Update existing session
    ipcRenderer.send('update-session', {
      id,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive
    });
    showNotification('Updating session...', 'info');
  } else {
    // Add new session
    ipcRenderer.send('add-session', {
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive
    });
    showNotification('Adding new session...', 'info');
  }
  
  closeModal();
}

function deleteSession(id) {
  if (confirm('Are you sure you want to delete this session?')) {
    ipcRenderer.send('delete-session', id);
    showNotification('Deleting session...', 'warning');
  }
}

// Fee Type Functions
function loadFeeTypes() {
  ipcRenderer.send('get-fee-types');
}

function showFeeTypeModal(mode = 'add', feeTypeId = null) {
  resetForm('feeTypeForm');
  safelyUpdateElement('modalTitle', mode === 'add' ? 'Add Fee Type' : 'Edit Fee Type');
  
  if (mode === 'edit' && feeTypeId) {
    ipcRenderer.send('get-fee-type', feeTypeId);
  }
  
  document.getElementById('sessionForm').style.display = 'none';
  document.getElementById('feeTypeForm').style.display = 'block';
  document.getElementById('routeForm').style.display = 'none';
  document.getElementById('studentForm').style.display = 'none';
  
  document.getElementById('modalOverlay').classList.add('active');
}

function saveFeeType() {
  const id = document.getElementById('feeTypeId').value;
  const name = document.getElementById('feeTypeName').value;
  const amount = document.getElementById('feeTypeAmount').value;
  const isRecurring = document.getElementById('feeTypeRecurring').checked;
  
  if (!name || !amount) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (id) {
    // Update existing fee type
    ipcRenderer.send('update-fee-type', {
      id,
      name,
      amount,
      is_recurring: isRecurring
    });
    showNotification('Updating fee type...', 'info');
  } else {
    // Add new fee type
    ipcRenderer.send('add-fee-type', {
      name,
      amount,
      is_recurring: isRecurring
    });
    showNotification('Adding new fee type...', 'info');
  }
  
  closeModal();
}

function deleteFeeType(id) {
  if (confirm('Are you sure you want to delete this fee type?')) {
    ipcRenderer.send('delete-fee-type', id);
    showNotification('Deleting fee type...', 'warning');
  }
}

// Route Functions
function loadRoutes() {
  ipcRenderer.send('get-routes');
}

function showRouteModal(mode = 'add', routeId = null) {
  resetForm('routeForm');
  safelyUpdateElement('modalTitle', mode === 'add' ? 'Add New Route' : 'Edit Route');
  
  if (mode === 'edit' && routeId) {
    ipcRenderer.send('get-route', routeId);
  }
  
  document.getElementById('sessionForm').style.display = 'none';
  document.getElementById('feeTypeForm').style.display = 'none';
  document.getElementById('routeForm').style.display = 'block';
  document.getElementById('studentForm').style.display = 'none';
  
  document.getElementById('modalOverlay').classList.add('active');
}

function saveRoute() {
  const id = document.getElementById('routeId').value;
  const name = document.getElementById('routeName').value;
  const distance = document.getElementById('routeDistance').value;
  const fee = document.getElementById('routeFee').value;
  
  if (!name || !distance || !fee) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (id) {
    // Update existing route
    ipcRenderer.send('update-route', {
      id,
      name,
      distance_km: distance,
      base_fee: fee
    });
    showNotification('Updating route...', 'info');
  } else {
    // Add new route
    ipcRenderer.send('add-route', {
      name,
      distance_km: distance,
      base_fee: fee
    });
    showNotification('Adding new route...', 'info');
  }
  
  closeModal();
}

function deleteRoute(id) {
  if (confirm('Are you sure you want to delete this route?')) {
    ipcRenderer.send('delete-route', id);
    showNotification('Deleting route...', 'warning');
  }
}

// Student Functions
function loadStudents() {
  ipcRenderer.send('get-students');
  loadRoutesForDropdown();
}

function loadRoutesForDropdown() {
  ipcRenderer.send('get-routes');
}

function showStudentModal(mode = 'add', studentId = null) {
  resetForm('studentForm');
  safelyUpdateElement('modalTitle', mode === 'add' ? 'Add New Student' : 'Edit Student');
  
  if (mode === 'edit' && studentId) {
    ipcRenderer.send('get-student', studentId);
  }
  
  document.getElementById('sessionForm').style.display = 'none';
  document.getElementById('feeTypeForm').style.display = 'none';
  document.getElementById('routeForm').style.display = 'none';
  document.getElementById('studentForm').style.display = 'block';
  
  document.getElementById('modalOverlay').classList.add('active');
}

function saveStudent() {
  const id = document.getElementById('studentId').value;
  const name = document.getElementById('studentName').value;
  const admissionNumber = document.getElementById('admissionNumber').value;
  const routeId = document.getElementById('studentRoute').value;
  
  if (!name || !admissionNumber) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (id) {
    // Update existing student
    ipcRenderer.send('update-student', {
      id,
      name,
      admission_number: admissionNumber,
      route_id: routeId || null
    });
    showNotification('Updating student...', 'info');
  } else {
    // Add new student
    ipcRenderer.send('add-student', {
      name,
      admission_number: admissionNumber,
      route_id: routeId || null
    });
    showNotification('Adding new student...', 'info');
  }
  
  closeModal();
}

function deleteStudent(id) {
  if (confirm('Are you sure you want to delete this student?')) {
    ipcRenderer.send('delete-student', id);
    showNotification('Deleting student...', 'warning');
  }
}

// UI Helpers
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function resetForm(formId) {
  document.getElementById(formId).reset();
  
  // Clear any hidden id fields
  const idFields = document.querySelectorAll(`#${formId} input[type="hidden"]`);
  idFields.forEach(field => field.value = '');
}

// School Functions
function checkSchoolSetup() {
  ipcRenderer.send('get-school');
}

function setupSchool(name, location, sessionStartMonth) {
  ipcRenderer.send('add-school', {
    name,
    location,
    sessionStartMonth
  });
  
  showNotification('Setting up your school...', 'info');
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    
    // Get all content sections
    const sections = document.querySelectorAll('.content-section');
    
    // Get the current page title element
    const currentPageTitle = document.getElementById('currentPageTitle');

    // Function to show selected section and hide others
    function showSection(sectionId) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        // Remove active class from all nav items
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
        }

        // Add active class to selected nav item
        const selectedNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (selectedNavItem) {
            selectedNavItem.classList.add('active');
        }

        // Update page title
        currentPageTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    }

    // Add click event listeners to navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Handle initial school setup
    const schoolSetup = document.getElementById('schoolSetup');
    const appLayout = document.getElementById('appLayout');
    const saveSchoolBtn = document.getElementById('saveSchoolBtn');

    // Check if school is already set up (you can use localStorage for demo)
    const isSchoolSetup = localStorage.getItem('schoolSetup');

    if (isSchoolSetup) {
        schoolSetup.classList.add('hidden');
        appLayout.classList.remove('hidden');
    }

    // Handle school setup form submission
    saveSchoolBtn.addEventListener('click', () => {
        const schoolName = document.getElementById('schoolName').value;
        const schoolLocation = document.getElementById('schoolLocation').value;
        const sessionStartMonth = document.getElementById('sessionStartMonth').value;

        if (schoolName && schoolLocation && sessionStartMonth) {
            // Save school info (using localStorage for demo)
            localStorage.setItem('schoolSetup', 'true');
            localStorage.setItem('schoolName', schoolName);
            localStorage.setItem('schoolLocation', schoolLocation);

            // Update school name in sidebar
            document.getElementById('schoolNameHeader').textContent = schoolName;
            document.getElementById('schoolLocationDisplay').textContent = schoolLocation;

            // Hide setup and show main app
            schoolSetup.classList.add('hidden');
            appLayout.classList.remove('hidden');

            // Show dashboard by default
            showSection('dashboard');
        }
    });

    // Show dashboard by default if school is already set up
    if (isSchoolSetup) {
        showSection('dashboard');
    }

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    });
});