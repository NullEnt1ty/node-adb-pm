const { execSync } = require('child_process');

class AdbManager {

  static adbIsInstalled() {
    const isUsingWindows = process.platform === 'win32';
    const checkCommandExists = isUsingWindows
      ? this._checkCommandExistsWindows
      : this._checkCommandExistsUnix;

    let adbFound = true;

    try {
      checkCommandExists('adb');
    } catch (error) {
      adbFound = false;
    }

    return adbFound;
  }

  static _checkCommandExistsWindows(command) {
    return execSync(`where ${command}`);
  }

  static _checkCommandExistsUnix(command) {
    return execSync(`which ${command}`);
  }

}

module.exports = AdbManager;
