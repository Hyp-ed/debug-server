/*
 * File:          tcp.js
 * Project:       hyped-2020-debug-server
 * File Created:  Wednesday, 6th November 2019 10:53:45 am
 * Author(s):     Paul Martin
 *
 * Description:   Handles websocket requests and responses using socket.io
 *
 * Last Modified: Monday, 2nd March 2020 8:20:23 pm
 * Modified By:   Paul Martin
 */

const net = require('net');
const fs = require('fs');

const Bbb = require('./Bbb');
const Logger = require('./Logger');
const { ExecParser } = require('./parser');
const bbb = new Bbb();

const utils = require('./utils');

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

function run_bin(socket, payload) {
  // if already running binary, don't connect again
  if (bbb.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  if (!bbb.doesCompiledBinExist()) {
    sendErrorMsg(
      socket,
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
    sendData(socket, parsedLines);
  }

  function exitHandler(data, err) {
    const parsedLines = parseQueue.parseRest();
    sendData(socket, parsedLines);
    sendTerminated(socket, 'run_bin', true);
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

function compile_bin(socket, make_params) {
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
    // TODO: fix - successful even if not compiled
    // Check if binary was created
    let successful = false;
    if (bbb.doesCompiledBinExist()) {
      const secsSinceCompiled = (new Date() - bbb.binLastModified()) / 1000;
      if (secsSinceCompiled <= 1) successful = true;
    }

    sendTerminated(socket, 'compile_bin', successful, error_collection);
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

/**
 * Interprets the tcp message
 *
 * @param {str} msg - The command to be executed (eg. 'run_bin')
 * @param {*} data - JSON-obj containing parameters for execution of command
 */
function handleRequest(socket, msg, data) {
  console.log(`Task: ${msg}`);
  switch (msg) {
    case 'run_bin':
      run_bin(socket, {
        flags: data.flags || [],
        debug_level: data.debug_level || 3
      });
      break;

    case 'kill_running_bin':
      kill_run(socket);
      break;

    case 'compile_bin':
      compile_bin(socket, data.make_params || []);
      break;

    default:
      socket.write('Could not interpret json message\n');
      console.error("Couldn't interpret message");
  }
}

function tcpHandleData(socket, dataRaw) {
  if (utils.isJsonParsable(dataRaw)) {
    const data = JSON.parse(dataRaw);
    const msg = data.msg;
    handleRequest(socket, msg, data);
  } else {
    socket.write('Not in JSON format\n');
    console.error('** Could not parse incoming json-data');
  }
}

function tcpHandleClose() {
  console.log('** Lost connection to client');
}

function tcpHandleError(err) {
  if (err.code == 'ECONNRESET') console.log('** Client exited abruptly');
  else console.log(err);
}

function tcpSend(socket, data) {
  if (!socket.destroyed) {
    socket.write(data + '\n');
  }
}

function sendErrorMsg(socket, type, errorMessage) {
  const data = JSON.stringify({
    msg: 'error',
    type: type,
    payload: errorMessage
  });

  tcpSend(socket, data);
}

function sendData(socket, payload) {
  const data = JSON.stringify({
    msg: 'console_data',
    payload: payload
  });

  tcpSend(socket, data);
}

function sendTerminated(socket, taskName, success, payload = '') {
  const data = JSON.stringify({
    msg: 'terminated',
    task: taskName,
    success: success || true,
    payload
  });

  tcpSend(socket, data);
}

function onClientConnected(socket) {
  sockets.add(socket);

  console.log('** New connection');
  socket.setEncoding('utf-8');

  socket.on('data', rawData => tcpHandleData(socket, rawData));
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
