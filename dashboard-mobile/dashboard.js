// Toast notification system (replaces alert())
const Toast = {
  container: null,

  init() {
    // Create toast container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  }
};

// Optimized DOM manipulation using DocumentFragment
function mockStatus() {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;

  // Clear existing content
  statusEl.textContent = '';

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();

  const agents = ['Orchestrator', 'Prompt Enhancer', 'Slack Monitor'];

  agents.forEach(name => {
    // Use createElement instead of innerHTML for security
    const card = document.createElement('div');
    card.className = 'card';

    const nameText = document.createTextNode(`${name}: `);
    card.appendChild(nameText);

    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon';
    statusIcon.textContent = '\u2705'; // ✅ emoji
    card.appendChild(statusIcon);

    fragment.appendChild(card);
  });

  // Single DOM update instead of multiple
  statusEl.appendChild(fragment);

  // Update log with textContent (safe)
  const logEl = document.getElementById('log');
  if (logEl) {
    logEl.textContent = '[14:02] Slack trigger received\n[14:03] Prompt optimized\n[14:04] Deployment initiated';
  }

  // Update feed using DocumentFragment and createElement
  const feedEl = document.getElementById('feed');
  if (feedEl) {
    feedEl.textContent = ''; // Clear existing

    const feedFragment = document.createDocumentFragment();
    const feedItems = [
      'Keyword detected: "launch"',
      'Enhancement complete',
      'Workflow deployed'
    ];

    feedItems.forEach(itemText => {
      const li = document.createElement('li');
      li.textContent = itemText;
      feedFragment.appendChild(li);
    });

    feedEl.appendChild(feedFragment);
  }

  // Update metrics with textContent (safe)
  const metricsEl = document.getElementById('metrics');
  if (metricsEl) {
    metricsEl.textContent = 'Clarity: 92% • Success: 98% • Uptime: 99.9%';
  }
}

// Control functions with toast notifications instead of alerts
function pauseAll() {
  Toast.warning('All agents paused (demo mode)', 2500);
  console.log('Pause all agents requested');
}

function resumeAll() {
  Toast.success('All agents resumed (demo mode)', 2500);
  console.log('Resume all agents requested');
}

function trigger() {
  Toast.info('Workflow triggered (demo mode)', 2500);
  console.log('Workflow trigger requested');
}

// Event delegation for better performance
function initializeEventListeners() {
  // Use event delegation on the controls section
  const controlsSection = document.querySelector('.panel:last-of-type');
  if (!controlsSection) return;

  controlsSection.addEventListener('click', (event) => {
    const target = event.target;

    // Check if clicked element is a button
    if (target.tagName === 'BUTTON') {
      const action = target.getAttribute('data-action');

      switch (action) {
        case 'pause':
          pauseAll();
          break;
        case 'resume':
          resumeAll();
          break;
        case 'trigger':
          trigger();
          break;
        default:
          console.warn('Unknown action:', action);
      }

      // Prevent any default behavior
      event.preventDefault();
    }
  });
}

// Initialize on DOM content loaded
function initialize() {
  try {
    mockStatus();
    initializeEventListeners();
    Toast.info('Dashboard loaded successfully', 2000);
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    Toast.error('Failed to load dashboard', 3000);
  }
}

// Use DOMContentLoaded instead of window.onload for faster initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Export functions for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockStatus,
    pauseAll,
    resumeAll,
    trigger,
    Toast
  };
}
