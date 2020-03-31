/*
 * File:          ssh.js
 * Project:       hyped-2020-debug-server
 * File Created:  Monday, 9th March 2020 7:48:06 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Tuesday, 31st March 2020 2:26:36 pm
 * Modified By:   Paul Martin
 */
'use strict';

const SSH2Promise = require('ssh2-promise');

const DEFAULT_DIR = '/Users/paul/development/hyped/hyped-2020';

class SshConnection {
  constructor({ host, username, password }) {
    this.connected = false;
    this.ssh = new SSH2Promise({ host, username, password });

    this.busy = false;
  }

  async connect() {
    if (this.connected) {
      return true;
    }

    try {
      await this.ssh.connect();
      // Connection succeeded
      this.connected = true;
      return true;
    } catch (e) {
      // Connection failed
      return false;
    }
  }

  async disconnect() {
    await this.ssh.close();
    this.connected = false;
    return true;
  }

  isConnected() {
    return this.connected;
  }

  isBusy() {
    return this.busy;
  }

  /** Execute any command via ssh
   *
   * @param {String} cmd - The command to execute
   * @throws SSH_NOT_CONNECTED - No ssh connection exists
   */
  async execCommand(
    cmd,
    {
      params = [],
      cwd = DEFAULT_DIR,
      onStdout: stdoutCallback = () => {},
      onStderr: stderrCallback = () => {},
      onExit: exitCallback = () => {}
    }
  ) {
    if (!this.connected) throw new Error('SSH_NOT_CONNECTED');
    if (!cwd) cwd = DEFAULT_DIR;

    cmd = `cd ${cwd} && ${cmd}`;

    this.processStream = await this.ssh.spawn(cmd, params, {
      cwd,
      shell: true // to enable &&
    });

    this.busy = true;

    this.processStream
      .on('exit', () => {
        this.busy = false;
        exitCallback();
      })
      .on('data', stdoutCallback)
      .stderr.on('data', stderrCallback);
  }

  /** Stop any running child-process (e.g. compiling or executing) */
  kill() {
    if (!this.connected) throw new Error('SSH_NOT_CONNECTED');

    this.processStream.signal('SIGINT');
  }

  async doesFileExist(fpath) {
    if (!this.connected) throw new Error('SSH_NOT_CONNECTED');

    const sftp = this.ssh.sftp();
    try {
      await sftp.getStat(fpath);
      // Exists
      return true;
    } catch (e) {
      // Doesn't exist
      return false;
    }
  }

  async getFileLastModified(fpath) {
    if (!this.connected) throw new Error('SSH_NOT_CONNECTED');

    const sftp = this.ssh.sftp();
    const stat = await sftp.getStat(fpath);
    return stat.mtime;
  }
}

module.exports = { SshConnection };
