/*
 * File:          socket.js
 * Project:       hyped-2020-debug-server
 * File Created:  Friday, 27th March 2020 5:38:26 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Monday, 30th March 2020 2:10:23 pm
 * Modified By:   Paul Martin
 */
'use strict';

const interpreter = require('./interpreter');
const utils = require('../utils');

class Wrapper {
  constructor(sock, bbb) {
    this.tcpSocket = sock;
    this.bbb = bbb;
  }

  // Alias for this.socket.write
  write(...args) {
    try {
      this.tcpSocket.write(...args);
    } catch (e) {
      // Ignore error
    }
  }

  send(data) {
    if (!this.tcpSocket.destroyed) {
      this.write(data + '\n');
    }
  }

  sendFormatted(data) {
    const data_str = JSON.stringify(data);
    this.send(data_str);
  }

  sendData(payload) {
    this.sendFormatted({
      msg: 'console_data',
      payload
    });
  }

  sendError(type, errorMessage, stackTrace = '') {
    const payload = {
      message: errorMessage
    };

    if (stackTrace) payload.stack_trace = stackTrace;

    this.sendFormatted({
      msg: 'error',
      type: type,
      payload
    });
  }

  sendTerminated(taskName, success = false, payload = '') {
    this.sendFormatted({
      msg: 'terminated',
      task: taskName,
      success: success,
      payload
    });
  }

  handleIncoming(rawData) {
    if (utils.isJsonParsable(rawData)) {
      const data = JSON.parse(rawData);
      const msg = data.msg;
      this.interpretMsg(msg, data);
    } else {
      this.write('Not in JSON format\n');
      console.error('** Could not parse incoming json-data');
    }
  }

  interpretMsg(msg, msg_payload) {
    console.log(`Task: ${msg}`);

    if (!interpreter.isCommand(msg)) {
      this.write('Could not interpret json message\n');
      console.error("Couldn't interpret message");
      return;
    }

    interpreter.runCommand(this.bbb, this, msg, msg_payload);
  }
}

class List {
  constructor() {
    this.socks = [];
  }

  all() {
    return this.socks;
  }

  add(sock) {
    this.socks.push(sock);
  }

  remove(sock) {
    this.socks.splice(this.socks.indexOf(sock), 1);
  }

  length() {
    return this.socks.length;
  }
}

module.exports = { Wrapper, List };
