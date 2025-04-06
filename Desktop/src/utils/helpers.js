/**
 * Common utility functions for the School Management App
 */

// Format currency values
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Format date from ISO string to local format
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString();
}

// Generate random ID for elements
function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate email address
function isValidEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// Safely get an element by ID with error handling
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID "${id}" not found`);
  }
  return element;
}

// Safely update an element's content
function safelyUpdateElement(id, content, property = 'textContent') {
  const element = getElement(id);
  if (element) {
    if (property === 'value') {
      element.value = content;
    } else if (property === 'checked') {
      element.checked = content;
    } else if (property === 'html' || property === 'innerHTML') {
      element.innerHTML = content;
    } else {
      element[property] = content;
    }
    return true;
  }
  return false;
}

// Create a notification toast
function showNotification(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `notification ${type}`;
  toast.textContent = message;
  
  const container = document.getElementById('notification-container') || document.body;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, duration);
  }, 10);
}

// Throttle function to limit how often a function can be called
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

// Export functions for use in other modules
module.exports = {
  formatCurrency,
  formatDate,
  generateId,
  isValidEmail,
  getElement,
  safelyUpdateElement,
  showNotification,
  throttle
}; 