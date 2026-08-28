/**
 * Theme Switcher Module
 * Allows runtime toggling between dashboard v1 (default) and v2 (experimental)
 * 
 * Usage:
 * - setTheme('v2') - Enable experimental redesign
 * - setTheme('v1') - Return to original design
 * - getTheme() - Get current theme
 */

const THEME_STORAGE_KEY = 'dashboard-theme-version';
const V2_CLASS = 'dashboard-v2';

export const ThemeSwitcher = {
  /**
   * Initialize theme from localStorage or default to v1
   */
  init() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'v2') {
      this.setTheme('v2');
    } else {
      this.setTheme('v1');
    }
  },

  /**
   * Set active theme
   * @param {string} version - 'v1' for original, 'v2' for experimental
   */
  setTheme(version) {
    const html = document.documentElement;
    
    if (version === 'v2') {
      html.classList.add(V2_CLASS);
      localStorage.setItem(THEME_STORAGE_KEY, 'v2');
    } else {
      html.classList.remove(V2_CLASS);
      localStorage.setItem(THEME_STORAGE_KEY, 'v1');
    }
  },

  /**
   * Get current theme version
   * @returns {string} 'v1' or 'v2'
   */
  getTheme() {
    return document.documentElement.classList.contains(V2_CLASS) ? 'v2' : 'v1';
  },

  /**
   * Toggle between themes
   */
  toggle() {
    const current = this.getTheme();
    this.setTheme(current === 'v1' ? 'v2' : 'v1');
  },

  /**
   * Add a theme switch button to the DOM
   * Useful for development/testing
   */
  addDebugToggle() {
    if (document.getElementById('theme-switch-debug')) return;
    
    const button = document.createElement('button');
    button.id = 'theme-switch-debug';
    button.textContent = `Theme: ${this.getTheme().toUpperCase()}`;
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      padding: 8px 12px;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    button.addEventListener('click', () => {
      this.toggle();
      button.textContent = `Theme: ${this.getTheme().toUpperCase()}`;
    });
    
    document.body.appendChild(button);
  },
};

// Auto-initialize on import
ThemeSwitcher.init();

export default ThemeSwitcher;
