/*
 * File:          parser.js
 * Project:       hyped-2020-debug-server
 * File Created:  Thursday, 7th November 2019 6:48:08 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Tuesday, 31st March 2020 2:21:02 pm
 * Modified By:   Paul Martin
 */
'use strict';

// A queue is needed because logs can be split in the middle of a line
class ExecParser {
  constructor() {
    this.queue = '';
  }

  countLines() {
    return this.queue.split('\n').length;
  }

  parse() {
    const lines = this.queue.split('\n');
    const lastLine = lines.pop();
    this.queue = lastLine;
    return lines.map(this.parse_line);
  }

  parseRest() {
    if (this.queue === '') return '';

    const lines = this.queue.split('\n');
    this.queue = [];
    return lines.map(this.parse_line);
  }

  addToQueue(data) {
    this.queue += data.toString();
  }

  /**
   * The function responsible for parsing each line
   *
   * @param {str} str The line to parse
   */
  parse_line(str) {
    //                h     m     s     ms     dbg  [submodule]   log
    const regex = /(\d{2}:\d{2}:\d{2}\.\d{3}) (\w*)\[([\w-]*)\]: (.*)/;

    const match = str.match(regex);

    if (match == null) return { line: str }; // Couldn't parse

    const [, time, debug_mode, submodule, debug_output] = str.match(regex);

    const debug_level = (debug_mode.match(/\d+/) || [0])[0];

    return {
      line: str,
      time: time,
      log_type: debug_mode,
      debug_level: debug_level,
      submodule: submodule,
      log: debug_output
    };
  }
}

module.exports = { ExecParser };
