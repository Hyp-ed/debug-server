/*
 * File:          Logger.js
 * Project:       hyped-2020-debug-server
 * File Created:  Saturday, 9th November 2019 1:48:35 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Saturday, 8th February 2020 3:40:53 pm
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
    const datetime = new Date();
    const dt = {
      year: datetime.getFullYear(),
      mon: datetime.getMonth() + 1,
      day: datetime.getDate(),
      hour: datetime.getHours(),
      min: datetime.getMinutes(),
      sec: datetime.getSeconds()
    };
    return `log-${dt.year}${dt.mon}${dt.day}${dt.hour}${dt.min}${dt.sec}.txt`;
  }

  getFilename() {
    return this.filename;
  }

  addContent(content) {
    fs.appendFile(`${this.folder}/${this.filename}`, content, err => {
      if (err) throw err;
    });
  }

  getFullHistory() {
    return fs.readFileSync(`${this.folder}/${this.filename}`);
  }
}

module.exports = Logger;
