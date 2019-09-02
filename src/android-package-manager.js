const { execSync } = require('child_process');
const os = require('os');

const AdbError = require('./adb-error');

const userInfoRegex = new RegExp(/UserInfo\{(?<userId>\d+):(?<username>.*):\d+\}/);

class AndroidPackageManager {

  getUsers() {
    const rawUsers = this._execAdbShellCommand('pm list users');
    const users = rawUsers
      .trim()
      .split(os.EOL)
      .slice(1)
      .map((rawUser) => {
        const regexResult = userInfoRegex.exec(rawUser);
        const user = { userId: regexResult.groups.userId, username: regexResult.groups.username };

        return user;
      });

    return users;
  }

  getInstalledPackages(userId = 0) {
    const rawInstalledPackages = this._execAdbShellCommand(`pm list packages --user ${userId}`);
    const installedPackages = rawInstalledPackages
      .trim()
      .replace(new RegExp(/^package:/, 'gm'), '')
      .split(os.EOL)
      .filter((packageName) => packageName !== 'android') // probably best to filter out this package
      .sort();

    return installedPackages;
  }

  uninstallPackage(packageName, userId = 0) {
    this._execAdbShellCommand(`pm uninstall --user ${userId} ${packageName}`);
  }

  _execAdbShellCommand(command) {
    let result;

    try {
      result = execSync(`adb shell ${command}`);
    } catch (error) {
      const adbError = new AdbError(`adb shell command '${command}' failed! adb response: '${error.stdout}'.`);
      adbError.adbResponse = error.stdout;

      throw adbError;
    }

    if (result instanceof Buffer) {
      return result.toString();
    }

    return result;
  }

}

module.exports = AndroidPackageManager;
