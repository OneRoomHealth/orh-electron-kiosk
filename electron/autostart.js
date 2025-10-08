const AutoLaunch = require('auto-launch');
const { app } = require('electron');
const { exec } = require('child_process');
const path = require('path');

/**
 * Auto-start configuration for kiosk mode
 * Configures the application to start automatically on system boot
 */
class AutoStartManager {
  constructor() {
    this.autoLauncher = new AutoLaunch({
      name: 'OneRoom Health Kiosk',
      path: app.getPath('exe'),
      isHidden: false, // Show window immediately on startup
      // Windows-specific options to improve startup priority
      mac: {
        useLaunchAgent: true
      },
      options: [
        '--startup' // Custom flag to indicate startup launch
      ]
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
        console.log('Auto-start enabled via registry');
        
        // Also create a Windows Task Scheduler entry for higher priority startup
        if (process.platform === 'win32') {
          await this.createWindowsTask();
        }
      }
      return true;
    } catch (error) {
      console.error('Error enabling auto-start:', error);
      return false;
    }
  }

  /**
   * Create Windows Task Scheduler entry for high-priority startup
   */
  async createWindowsTask() {
    return new Promise((resolve, reject) => {
      const taskName = 'OneRoomHealthKioskStartup';
      const exePath = app.getPath('exe');
      
      // Create task with high priority and early startup
      const taskXml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>OneRoom Health Kiosk Auto-Start</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <Delay>PT10S</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>4</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>"${exePath}"</Command>
    </Exec>
  </Actions>
</Task>`;

      // Write task XML to temp file
      const tempFile = path.join(require('os').tmpdir(), 'orh-kiosk-task.xml');
      require('fs').writeFileSync(tempFile, taskXml);

      // Create the scheduled task
      const cmd = `schtasks /create /tn "${taskName}" /xml "${tempFile}" /f`;
      
      exec(cmd, (error, stdout, stderr) => {
        // Clean up temp file
        try {
          require('fs').unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }

        if (error) {
          console.log('Task scheduler setup failed (this is optional):', error.message);
          resolve(); // Don't fail the whole process
        } else {
          console.log('Windows Task Scheduler entry created for high-priority startup');
          resolve();
        }
      });
    });
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
