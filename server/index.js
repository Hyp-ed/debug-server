/*
 * File:          index.js
 * Project:       hyped-2020-debug-server
 * File Created:  Wednesday, 6th November 2019 10:37:43 am
 * Author(s):     Paul Martin
 *
 * Description:   Entry point for backend
 *
 * Last Modified: Friday, 27th March 2020 6:52:25 pm
 * Modified By:   Paul Martin
 */
'use strict';

// start websocket server
const tcp = require('./src/tcp/server');
const tcpServer = new tcp();

tcpServer.open(7070);
