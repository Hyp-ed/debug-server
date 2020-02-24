/*
 * File:          index.js
 * Project:       hyped-2020-debug-server
 * File Created:  Wednesday, 6th November 2019 10:37:43 am
 * Author(s):     Paul Martin
 *
 * Description:   Entry point for backend
 *
 * Last Modified: Monday, 24th February 2020 6:05:02 pm
 * Modified By:   Paul Martin
 */

// start websocket server
const tcp = require('./src/tcp');
tcp(7070);
