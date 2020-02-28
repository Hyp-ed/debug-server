/*
 * File:          index.js
 * Project:       hyped-2020-debug-server
 * File Created:  Wednesday, 6th November 2019 10:37:43 am
 * Author(s):     Paul Martin
 *
 * Description:   Entry point for backend
 *
 * Last Modified: Thursday, 27th February 2020 7:15:32 pm
 * Modified By:   Paul Martin
 */

// start websocket server
const tcp = require('./src/tcp');
const tcpServer = new tcp();

tcpServer.open(7070);
