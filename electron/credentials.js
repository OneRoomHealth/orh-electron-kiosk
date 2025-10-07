const Store = require('electron-store');
const crypto = require('crypto');

/**
 * Secure credential storage using electron-store
 * Credentials are encrypted at rest
 */
class CredentialStore {
  constructor() {
    // Initialize encrypted store
    this.store = new Store({
      name: 'orh-credentials',
      encryptionKey: this.getEncryptionKey(),
      clearInvalidConfig: true
    });
  }

  /**
   * Generate or retrieve encryption key
   * In production, this could use OS keychain
   */
  getEncryptionKey() {
    const { app } = require('electron');
    const machineId = app.getPath('userData');
    return crypto.createHash('sha256').update(machineId).digest('hex').substring(0, 32);
  }

  /**
   * Save OAuth credentials
   * @param {Object} credentials - { accessToken, refreshToken, expiresAt, userInfo }
   */
  save(credentials) {
    try {
      this.store.set('oauth', {
        ...credentials,
        savedAt: new Date().toISOString()
      });
      console.log('Credentials saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }

  /**
   * Load saved credentials
   * @returns {Object|null} credentials or null if not found/expired
   */
  load() {
    try {
      const credentials = this.store.get('oauth');
      
      if (!credentials) {
        return null;
      }

      // Check if credentials have expired
      if (credentials.expiresAt) {
        const expiresAt = new Date(credentials.expiresAt);
        if (expiresAt < new Date()) {
          console.log('Credentials expired, clearing...');
          this.clear();
          return null;
        }
      }

      return credentials;
    } catch (error) {
      console.error('Error loading credentials:', error);
      return null;
    }
  }

  /**
   * Check if credentials exist
   * @returns {boolean}
   */
  has() {
    const credentials = this.load();
    return credentials !== null;
  }

  /**
   * Clear all saved credentials
   */
  clear() {
    try {
      this.store.delete('oauth');
      console.log('Credentials cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return false;
    }
  }

  /**
   * Get all stored data (for debugging)
   */
  getAll() {
    return this.store.store;
  }

  /**
   * Clear all data (for debugging/reset)
   */
  clearAll() {
    this.store.clear();
  }
}

module.exports = new CredentialStore();
