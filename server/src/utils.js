/*
 * File:          utils.js
 * Project:       hyped-2020-debug-server
 * File Created:  Saturday, 8th February 2020 2:23:36 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Monday, 30th March 2020 12:57:57 pm
 * Modified By:   Paul Martin
 */
'use strict';

class SSH_NOT_CONNECTED extends Error {}
class SSH_CONNECTION_FAILED extends Error {}

const err = {
  SSH_NOT_CONNECTED,
  SSH_CONNECTION_FAILED
};

function isJsonParsable(string) {
  try {
    JSON.parse(string);
    return true;
  } catch (e) {
    return false;
  }
}

function raiseErr(err) {
  throw err;
}

module.exports = { isJsonParsable, err, raiseErr };
