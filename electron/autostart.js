const AutoLaunch = require('auto-launch');
const { app } = require('electron');

/**
 * Auto-start configuration for kiosk mode
 * Configures the application to start automatically on system boot
 */
class AutoStartManager {
  constructor() {
    this.autoLauncher = new AutoLaunch({
      name: 'OneRoom Health Kiosk',
      path: app.getPath('exe'),
      isHidden: false // Show window immediately on startup
    });
  }

  /**
   * Enable auto-start on system boot
   */
  async enable() {
    try {
      const isEnabled = await this.isEnabled();
      if (!isEnabled) {
        await this.autoLauncher.enable();
        console.log('Auto-start enabled');
      }
      return true;
    } catch (error) {
      console.error('Error enabling auto-start:', error);
      return false;
    }
  }

  /**
   * Disable auto-start
   */
  async disable() {
    try {
      const isEnabled = await this.isEnabled();
      if (isEnabled) {
        await this.autoLauncher.disable();
        console.log('Auto-start disabled');
      }
      return true;
    } catch (error) {
      console.error('Error disabling auto-start:', error);
      return false;
    }
  }

  /**
   * Check if auto-start is enabled
   */
  async isEnabled() {
    try {
      return await this.autoLauncher.isEnabled();
    } catch (error) {
      console.error('Error checking auto-start status:', error);
      return false;
    }
  }

  /**
   * Toggle auto-start
   */
  async toggle() {
    const isEnabled = await this.isEnabled();
    if (isEnabled) {
      return await this.disable();
    } else {
      return await this.enable();
    }
  }
}

module.exports = new AutoStartManager();
