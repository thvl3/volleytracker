/**
 * Helper service for managing document title
 */
class TitleService {
  constructor() {
    this.baseTitle = 'VolleyTracker';
  }

  /**
   * Set document title with optional section
   * @param {string} title - Page title
   */
  setTitle(title) {
    if (title) {
      document.title = `${title} | ${this.baseTitle}`;
    } else {
      document.title = this.baseTitle;
    }
  }
}

// Export singleton instance
export default new TitleService();
