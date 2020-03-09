/*
 * File:          tcp.js
 * Project:       hyped-2020-debug-server
 * File Created:  Wednesday, 6th November 2019 10:53:45 am
 * Author(s):     Paul Martin
 *
 * Description:   Handles websocket requests and responses using socket.io
 *
 * Last Modified: Monday, 9th March 2020 7:43:13 pm
 * Modified By:   Paul Martin
 */

const net = require('net');

const Bbb = require('./Bbb');
const Logger = require('./Logger');
const { ExecParser } = require('./parser');
const bbb = new Bbb();

const utils = require('./utils');

class SocketWrapper {
  constructor(sock) {
    this.socket = sock;
  }

  // Alias for this.socket.write
  write(...args) {
    this.socket.write(...args);
  }

  send(data) {
    if (!this.socket.destroyed) {
      this.write(data + '\n');
    }
  }

  sendData(payload) {
    const data = JSON.stringify({
      msg: 'console_data',
      payload: payload
    });

    this.send(data);
  }

  sendError(type, errorMessage) {
    const data = JSON.stringify({
      msg: 'error',
      type: type,
      payload: errorMessage
    });

    this.send(data);
  }

  sendTerminated(taskName, success = false, payload = '') {
    const data = JSON.stringify({
      msg: 'terminated',
      task: taskName,
      success: success,
      payload
    });

    this.send(data);
  }

  handleIncoming(rawData) {
    console.log(rawData);
    console.log(this);
    if (utils.isJsonParsable(rawData)) {
      const data = JSON.parse(rawData);
      const msg = data.msg;
      this.interpretMsg(msg, data);
    } else {
      socket_wrapper.write('Not in JSON format\n');
      console.error('** Could not parse incoming json-data');
    }
  }

  interpretMsg(msg, data) {
    console.log(`Task: ${msg}`);
    switch (msg) {
      case 'run_bin':
        run_bin(this, {
          flags: data.flags || [],
          debug_level: data.debug_level || 3
        });
        break;

      case 'kill_running_bin':
        kill_run(this);
        break;

      case 'compile_bin':
        compile_bin(this, data.make_params || []);
        break;

      default:
        socket.write('Could not interpret json message\n');
        console.error("Couldn't interpret message");
    }
  }
}

class Sockets {
  socks = [];
  all = this.socks;

  add(sock) {
    this.socks.push(sock);
  }
  push = this.add;

  remove(sock) {
    this.socks.splice(this.socks.indexOf(sock), 1);
  }

  length() {
    return this.socks.length;
  }
}
const sockets = new Sockets();

function run_bin(socket_wrapper, payload) {
  // if already running binary, don't connect again
  if (bbb.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  if (!bbb.doesCompiledBinExist()) {
    socket_wrapper.sendError(
      'server_error',
      "Couldn't execute the binary. './hyped' does not exist."
    );
    return;
  }

  const logger = new Logger();
  const parseQueue = new ExecParser();

  function outputHandler(data) {
    logger.addContent(data.toString());

    // Parse
    parseQueue.addToQueue(data.toString());
    if (parseQueue.countLines() <= 1) return; // Make sure that no incomplete lines are parsed

    const parsedLines = parseQueue.parse();
    socket_wrapper.sendData(parsedLines);
  }

  function exitHandler(data, err) {
    const parsedLines = parseQueue.parseRest();
    socket_wrapper.sendData(parsedLines);
    socket_wrapper.sendTerminated('run_bin', true);
  }

  // Don't differentiate between stdout and stderr
  // DBG logs are sent through stderr and errors are sent through stdout (also parsable)
  errorHandler = outputHandler;

  console.log('** Executing binary');
  bbb.run(
    payload.flags,
    payload.debug_level,
    outputHandler,
    exitHandler,
    errorHandler
  );
}

function compile_bin(socket_wrapper, make_params) {
  // if already running binary, don't connect again
  if (bbb.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  let error_collection = '';

  function outputHandler(data) {
    // ignore output, only care about warnings and errors (errorHandler)
  }

  function exitHandler(data, err) {
    // Check if binary was created
    let successful = false;
    if (bbb.doesCompiledBinExist()) {
      const secsSinceCompiled = (new Date() - bbb.binLastModified()) / 1000;
      if (secsSinceCompiled <= 1) successful = true;
      console.log(successful);
    }

    socket_wrapper.sendTerminated('compile_bin', successful, error_collection);
  }

  function errorHandler(err) {
    // Collect error messages and send on exit
    error_collection += err.toString();
  }

  console.log('** Compiling binary');
  bbb.compile(make_params, outputHandler, exitHandler, errorHandler);
}

function kill_run() {
  console.log('** Stopping binary');
  bbb.kill();
}

function tcpHandleClose() {
  console.log('** Lost connection to client');
}

function tcpHandleError(err) {
  if (err.code == 'ECONNRESET') console.log('** Client exited abruptly');
  else console.log(err);
}

function onClientConnected(socket) {
  sockets.add(socket);

  socket_wrapper = new SocketWrapper(socket);

  console.log('** New connection');
  socket.setEncoding('utf-8');

  socket.on('data', rawData => socket_wrapper.handleIncoming(rawData));
  socket.on('close', () => {
    tcpHandleClose();
    sockets.remove(socket);
  });
  socket.on('error', err => {
    tcpHandleError(err);
    sockets.remove(socket);
  });
}

class TCP {
  isOpen = false;

  open(port) {
    this.server = net.createServer(onClientConnected);
    this.server.listen(port);
    this.isOpen = true;
    console.log(`** Listening on port ${port}`);
  }

  close() {
    if (!this.server) throw ReferenceError('Server has not been opened');

    // Kill running processes
    if (bbb.isBusy()) bbb.kill();

    // close all connections
    sockets.all.forEach(sock => sock.destroy());

    this.server.close(function() {
      console.log('** Server closed');
      this.isOpen = false;
    });
  }
}

module.exports = TCP;
