/**
 * ThemeService - Centralized theme management for the portfolio
 * Handles theme initialization, persistence, and toggling
 */
export class ThemeService {
  private static readonly STORAGE_KEY = 'theme';
  private static readonly DARK_CLASS = 'dark';

  /**
   * Get the current theme preference
   * Priority: localStorage > system preference > default light
   */
  static getTheme(): 'dark' | 'light' {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(this.STORAGE_KEY)) {
      return localStorage.getItem(this.STORAGE_KEY) as 'dark' | 'light';
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Initialize theme on page load
   * Sets the dark class and persists to localStorage
   */
  static initialize(): void {
    const theme = this.getTheme();

    if (theme === 'dark') {
      document.documentElement.classList.add(this.DARK_CLASS);
    } else {
      document.documentElement.classList.remove(this.DARK_CLASS);
    }

    // Persist the resolved theme to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  /**
   * Toggle between dark and light themes
   * Updates DOM class and persists preference
   */
  static toggle(): void {
    const element = document.documentElement;
    element.classList.toggle(this.DARK_CLASS);

    const isDark = element.classList.contains(this.DARK_CLASS);
    const newTheme = isDark ? 'dark' : 'light';

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, newTheme);
    }
  }

  /**
   * Check if current theme is dark
   */
  static isDark(): boolean {
    return document.documentElement.classList.contains(this.DARK_CLASS);
  }

  /**
   * Set theme explicitly
   */
  static setTheme(theme: 'dark' | 'light'): void {
    if (theme === 'dark') {
      document.documentElement.classList.add(this.DARK_CLASS);
    } else {
      document.documentElement.classList.remove(this.DARK_CLASS);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }
}
