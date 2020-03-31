/*
 * File:          server.js
 * Project:       hyped-2020-debug-server
 * File Created:  Friday, 27th March 2020 5:38:22 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Saturday, 28th March 2020 4:09:32 pm
 * Modified By:   Paul Martin
 */
'use strict';

const net = require('net');

const socket = require('./socket');

const Bbb = require('../Bbb');

class TCP {
  constructor() {
    this.isOpen = false;
    this.sockets = new socket.List();

    this.bbb = Bbb.hasInstance() ? Bbb.getInstance() : Bbb.createInstance();
  }

  open(port) {
    if (this.isOpen) return false;

    this.server = net.createServer(tcpSocket =>
      this.onClientConnected(tcpSocket)
    );
    this.server.listen(port);
    this.isOpen = true;
    console.log(`** Listening on port ${port}`);

    return true;
  }

  close() {
    if (!this.server) throw ReferenceError('Server has not been opened');

    // Kill running processes
    if (this.bbb.isBusy()) this.bbb.kill();

    // close all connections
    this.sockets.all().forEach(sock => sock.destroy());

    this.server.close(function() {
      console.log('** Server closed');
      this.isOpen = false;
    });
  }

  onClientConnected(tcpSocket) {
    this.sockets.add(tcpSocket);

    const socket_wrapper = new socket.Wrapper(tcpSocket, this.bbb);

    console.log('** New connection');
    tcpSocket.setEncoding('utf-8');

    tcpSocket.on('data', rawData => socket_wrapper.handleIncoming(rawData));
    tcpSocket.on('close', () => {
      this.handleClientExit();
      this.sockets.remove(tcpSocket);
    });
    tcpSocket.on('error', err => {
      this.handleConnectionError(err);
      this.sockets.remove(tcpSocket);
    });
  }

  handleConnectionError(err) {
    if (err.code === 'ECONNRESET') console.log('** Client exited abruptly');
    else console.log(err);
  }

  handleClientExit() {
    console.log('** Lost connection to client');
  }
}

module.exports = TCP;
