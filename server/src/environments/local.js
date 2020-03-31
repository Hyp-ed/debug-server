/*
 * File:          local.js
 * Project:       hyped-2020-debug-server
 * File Created:  Saturday, 28th March 2020 5:16:24 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Tuesday, 31st March 2020 2:31:28 pm
 * Modified By:   Paul Martin
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_PATH = path.join(__dirname, '../../hyped-pod_code');

class LocalShell {
  constructor() {
    this.childProcess = null;
  }

  isBusy() {
    return !!this.childProcess;
  }

  /** Execute any command as a local shell instance
   *
   * @param {String} cmd - The command to execute
   */
  execCommand(
    cmd,
    {
      params = [],
      cwd = DEFAULT_PATH,
      onStdout = () => {},
      onStderr = () => {},
      onExit = () => {}
    }
  ) {
    this.childProcess = spawn(cmd, params, {
      cwd,
      shell: true // to enable &&
    });
    this.childProcess.stdout.setEncoding('utf8');
    this.childProcess.stderr.setEncoding('utf8');

    this.childProcess.stdout.on('data', onStdout);
    this.childProcess.stderr.on('data', onStderr);
    this.childProcess.on('exit', () => {
      this.childProcess = null;
      onExit();
    });
  }

  /** Stop any running child-process (e.g. compiling or executing) */
  kill() {
    console.log(this.childProcess.kill('SIGINT'));
    this.childProcess = null;
  }

  doesFileExist(fpath) {
    if (fpath === null)
      throw new Error('ERR_INVALID_ARG_VALUE: fpath must not be null');

    return fs.existsSync(fpath);
  }

  getFileLastModified(fpath) {
    if (!this.doesFileExist(fpath)) return null;
    return fs.statSync(fpath).mtime;
  }
}

module.exports = LocalShell;
