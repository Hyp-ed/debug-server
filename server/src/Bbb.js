/*
 * File:          Bbb.js
 * Project:       hyped-2020-debug-server
 * File Created:  Monday, 4th November 2019 7:34:54 pm
 * Author(s):     Paul Martin
 *
 * Description:   Compiles & runs the HYPED binary (./hyped) as a child_process and handles the connection
 *
 * Last Modified: Saturday, 15th February 2020 4:59:24 pm
 * Modified By:   Paul Martin
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const HYPED_PATH = path.join(__dirname, '../../hyped-pod_code');

class Bbb {
  // subprocess.connected is not reliable for checking whether a child-process is running
  _running = false;
  _compiling = false;

  /**
   * A wrapper around running the make command
   *
   * @param {String[]} params - A list of parameters (e.g. flags) passed to the make command
   * @param {callback} dataCallback - Pipeline for stdout
   * @param {callback} exitCallback - Fired when process exits
   * @param {callback} errorCallback - Pipeline for stderr
   */
  // TODO: check wheter successful (was binary created?)
  compile(params, dataCallback, exitCallback, errorCallback) {
    const make = spawn('sh ./setup.sh && make', params, {
      cwd: HYPED_PATH,
      shell: true
    });
    make.stdout.setEncoding('utf8');

    make.stdout.on('data', dataCallback);
    make.stderr.on('data', errorCallback);

    make.on('exit', code => {
      this._connected = false;
      exitCallback();
      // if not exited gracefully
      if (code != 0) errorCallback(`Child process exited with code ${code}`);
    });
  }

  /**
   * Executes the ./hyped binary in hyped-pod_code
   *
   * @param {String[]} flags - The flags applied to the binary when executed
   * @param {int} debug_level
   * @param {callback} dataCallback - Pipeline for stdout
   * @param {callback} exitCallback - Fired when process exits
   * @param {callback} errorCallback - Pipeline for stderr
   */
  run(flags, debug_level, dataCallback, exitCallback, errorCallback) {
    if (!self.doesCompiledBinExist()) return false;

    const params = flags.concat([`--debug=${debug_level}`]);

    this.child = spawn('./hyped', params, { cwd: HYPED_PATH });
    this.child.stdout.setEncoding('utf8');
    this._connected = true;

    this.child.on('exit', code => {
      this._connected = false;
      exitCallback();
      // if not exited gracefully
      if (code != 0) errorCallback(`Child process exited with code ${code}`);
    });

    this.child.stdout.on('data', dataCallback);
    this.child.stderr.on('data', errorCallback);
  }

  /** Stops any running child-process (e.g. compiling or executing) */
  kill() {
    this.child.kill('SIGINT');
  }

  doesCompiledBinExist() {
    return fs.existsSync(path.join(HYPED_PATH, './hyped'));
  }

  isRunning() {
    return this._running;
  }

  isBusy() {
    return this._running || this._compiling;
  }
}

module.exports = Bbb;
