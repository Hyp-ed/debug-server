/*
 * File:          Utils.js
 * Project:       hyped-2020-debug-server
 * File Created:  Saturday, 8th February 2020 2:23:36 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Saturday, 8th February 2020 2:24:40 pm
 * Modified By:   Paul Martin
 */

function isJsonParsable(string) {
  try {
    JSON.parse(string);
    return true;
  } catch {
    return false;
  }
}

module.exports = { isJsonParsable };
