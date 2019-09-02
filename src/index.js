#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const inquirer = require('inquirer');

const AdbError = require('./adb-error');
const AndroidPackageManager = require('./android-package-manager');

// TODO: Check if adb is installed
// TODO: Support multiple Android devices
// TODO: Show package friendly name

const androidPackageManager = new AndroidPackageManager();

function listPackages(userId) {
  androidPackageManager
    .getInstalledPackages(userId)
    .forEach((installedPackage) => console.log(installedPackage));
}

function uninstallPackages(packages, userId) {
  let uninstalledPackagesCount = 0;
  const failedUninstalls = [];

  for (const packageName of packages) {
    process.stdout.write(`Uninstalling ${packageName}...`)

    try {
      androidPackageManager.uninstallPackage(packageName, userId);
      uninstalledPackagesCount++;
      console.log(chalk.green(' OK'));
    } catch (error) {
      if (error instanceof AdbError) {
        failedUninstalls.push({ packageName: packageName, adbResponse: error.adbResponse });
        console.log(chalk.red(' FAILED'));
      } else {
        throw error;
      }
    }
  }

  console.log(`Uninstalled ${uninstalledPackagesCount} packages.`)

  if (failedUninstalls.length > 0) {
    console.log(chalk.red('The following packages could not be uninstalled:'));

    failedUninstalls.forEach((failedUninstall) => {
      const message = `\t${failedUninstall.packageName}: ${failedUninstall.adbResponse}`;
      console.log(chalk.red(message));
    });
  }
}

inquirer
  .prompt([
    {
      type: 'list',
      name: 'userId',
      message: 'Select an Android user:',
      choices: androidPackageManager
        .getUsers()
        .map((user) => {
          return { name: `uid=${user.userId} (${user.username})`, value: user.userId };
        }),
    },
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: [
        { name: 'List installed packages', value: 'listInstalledPackages' },
        { name: 'Uninstall packages', value: 'uninstallPackages' },
      ]
    },
    {
      type: 'checkbox',
      name: 'packagesToUninstall',
      message: 'Choose which packages should be uninstalled:',
      choices: (answers) => androidPackageManager.getInstalledPackages(answers.userId),
      when: (answers) => answers.action === 'uninstallPackages',
    },
    {
      type: 'confirm',
      name: 'uninstallConfirmed',
      message: 'The above listed apps will be uninstalled. Do you want to continue?',
      default: false,
      when: (answers) => answers.packagesToUninstall !== undefined && answers.packagesToUninstall.length > 0,
    },
  ])
  .then((answers) => {
    console.log(answers);

    if (answers.action === 'listInstalledPackages') {
      listPackages(answers.userId);
    } else if (answers.action === 'uninstallPackages') {
      if (answers.packagesToUninstall.length === 0) {
        console.log(chalk.red('No packages were selected.'));
        process.exit(1);
      }

      if (!answers.uninstallConfirmed) {
        console.log('Aborting...');
        process.exit(0);
      }

      uninstallPackages(answers.packagesToUninstall, answers.userId);
    }
  })
