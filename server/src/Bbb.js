/*
 * File:          Bbb.js
 * Project:       hyped-2020-debug-server
 * File Created:  Monday, 4th November 2019 7:34:54 pm
 * Author(s):     Paul Martin
 *
 * Description:   Compiles & runs the HYPED binary (./hyped) as a child_process and handles the connection
 *
 * Last Modified: Tuesday, 31st March 2020 2:47:55 pm
 * Modified By:   Paul Martin
 */
'use strict';

const path = require('path');

const raiseErr = require('./utils').raiseErr;
const ssh = require('./environments/ssh');
const localShell = new (require('./environments/local'))();

const HYPED_PATH = path.join(__dirname, '../../hyped-pod_code');

class Bbb {
  constructor() {
    this._compiling = false;
    this._connectedToSSH = false;
    this.shouldUseSSH = false;

    this.bin_dir = HYPED_PATH;
    this.bin_path = path.join(HYPED_PATH, './hyped');
  }

  async useSSH({
    host = '192.168.7.1',
    username = 'hyped',
    password = 'spacex',
    dir = HYPED_PATH // TODO: default dir
  }) {
    if (!dir) dir = HYPED_PATH;
    // Initiate new ssh connection, overwriting old connection
    this.ssh = new ssh.SshConnection({ host, username, password });
    const success = await this.ssh.connect();
    if (success) {
      // Switch to using ssh
      this.bin_dir = dir;
      this.bin_path = path.join(dir, './hyped');
    }

    this.shouldUseSSH = success;
    return success;
  }

  /** A wrapper around running the make command
   *
   * @param {String[]} params - A list of parameters (e.g. flags) passed to the make command
   * @param {callback} dataCallback - Pipeline for stdout
   * @param {callback} exitCallback - Fired when process exits
   * @param {callback} errorCallback - Pipeline for stderr
   */
  compileBin(params, dataCallback, exitCallback, errorCallback) {
    this.runCommand('sh ./setup.sh && make', {
      params,
      cwd: this.bin_dir,
      onStdout: dataCallback,
      onStderr: errorCallback,
      onExit(code) {
        console.log('** Compilation terminated');
        exitCallback();
        // if not exited gracefully
        if (code !== 0) errorCallback(`Child process exited with code ${code}`);
      }
    }).catch(raiseErr);
  }

  /** Execute the ./hyped binary in hyped-pod_code
   *
   * @param {String[]} flags - The flags applied to the binary when executed
   * @param {int} debug_level
   * @param {callback} dataCallback - Pipeline for stdout
   * @param {callback} exitCallback - Fired when process exits
   * @param {callback} errorCallback - Pipeline for stderr
   */
  async runBin(flags, debug_level, dataCallback, exitCallback, errorCallback) {
    try {
      if (!(await this.doesCompiledBinExist())) return false;

      const params = flags.concat([`--debug=${debug_level}`]);

      this.runCommand('./hyped', {
        // TODO: change to './hyped'
        params, //: [], // TODO: remove []
        cwd: this.bin_dir,
        onStdout: dataCallback,
        onStderr: errorCallback,
        onExit(code) {
          exitCallback();
          // if not exited gracefully
          if (code !== 0)
            errorCallback(`Child process exited with code ${code}`);
        }
      });
    } catch (e) {
      throw e;
    }
  }

  /** Execute any command on ssh or local depending on settings
   *
   * @param {String} cmd - The command to execute
   */
  async runCommand(...args) {
    // Decide where to run command (local or ssh)
    if (this.shouldUseSSH) {
      this.ssh.execCommand(...args).catch(raiseErr);
    } else {
      localShell.execCommand(...args);
    }
  }

  /** Stops any running child-process (e.g. compiling or executing) */
  kill() {
    // Decide whether to use ssh
    if (this.shouldUseSSH) {
      this.ssh.kill();
    } else {
      localShell.kill();
    }
  }

  async binLastModified() {
    // Decide whether to use ssh
    if (this.shouldUseSSH) {
      return await this.ssh.getFileLastModified(this.bin_path).catch(raiseErr);
    } else {
      return localShell.getFileLastModified(this.bin_path);
    }
  }

  async doesCompiledBinExist() {
    // Decide whether to use ssh
    if (this.shouldUseSSH) {
      return await this.ssh.doesFileExist(this.bin_path).catch(raiseErr);
    } else {
      return localShell.doesFileExist(this.bin_path);
    }
  }

  isBusy() {
    return this.shouldUseSSH ? this.ssh.isBusy() : localShell.isBusy();
  }

  reset() {
    this.kill();
    this.ssh.disconnect();
    singleton.eraseInstance();
    return singleton.createInstance();
  }
}

// Implement as singleton
const singleton = {
  _instance: null,

  hasInstance() {
    return this._instance !== null;
  },

  createInstance(...args) {
    this._instance = new Bbb(...args);
    return this._instance;
  },

  eraseInstance() {
    this._instance = null;
  },

  getInstance() {
    return this._instance;
  }
};

module.exports = singleton;
