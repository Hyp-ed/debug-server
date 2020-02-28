/*
 * File:          Logger.js
 * Project:       hyped-2020-debug-server
 * File Created:  Saturday, 9th November 2019 1:48:35 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Thursday, 27th February 2020 11:57:01 pm
 * Modified By:   Paul Martin
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

class Logger {
  constructor(filename) {
    this.filename = filename ? filename : this._genFilename();
    const filepath = path.join(LOG_DIR, this.filename);

    // Create Directory if it doesn't exist yet
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

    // Create File if it doesn't exist yet, but don't overwrite if it does
    fs.closeSync(fs.openSync(filepath, 'a'));
  }

  _genFilename() {
    function twoDigit(x) {
      return ('0' + x).slice(-2);
    }

    const datetime = new Date();
    const dt = {
      year: twoDigit(datetime.getFullYear()),
      mon: twoDigit(datetime.getMonth() + 1),
      day: twoDigit(datetime.getDate()),
      hour: twoDigit(datetime.getHours()),
      min: twoDigit(datetime.getMinutes()),
      sec: twoDigit(datetime.getSeconds())
    };
    return `log-${dt.year}${dt.mon}${dt.day}${dt.hour}${dt.min}${dt.sec}.txt`;
  }

  getFilename() {
    return this.filename;
  }

  addContent(content) {
    fs.appendFile(`${LOG_DIR}/${this.filename}`, content, err => {
      if (err) throw err;
    });
  }

  getFullHistory() {
    return fs.readFileSync(`${LOG_DIR}/${this.filename}`);
  }
}

module.exports = Logger;
