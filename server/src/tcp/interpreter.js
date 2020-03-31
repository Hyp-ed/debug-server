/*
 * File:          interpreter.js
 * Project:       hyped-2020-debug-server
 * File Created:  Friday, 27th March 2020 6:20:18 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Tuesday, 31st March 2020 2:39:01 pm
 * Modified By:   Paul Martin
 */

'use strict';

const raiseErr = require('../utils').raiseErr;
const commandFunctions = require('../commands');

function isCommand(msg) {
  // Does function named <msg> exist
  for (const cmd in commandFunctions) {
    if (msg === cmd) return true;
  }
  return false;
}

async function runCommand(bbb, socket_wrapper, cmd, msg_payload) {
  if (!isCommand(cmd))
    throw new Error(`ERR_INVALID_ARG_VALUE: command "${cmd}" not supported`);

  commandFunctions[cmd](bbb, socket_wrapper, msg_payload).catch(err => {
    const errType = err.type ? `${err.type}: ` : '';
    socket_wrapper.sendError(
      'server_error',
      `${errType}${err.message}`,
      err.stack
    );
  });
}

module.exports = { isCommand, runCommand };
