/*
 * File:          tcp.js
 * Project:       hyped-2020-debug-server
 * File Created:  Wednesday, 6th November 2019 10:53:45 am
 * Author(s):     Paul Martin
 *
 * Description:   Handles websocket requests and responses using socket.io
 *
 * Last Modified: Monday, 24th February 2020 7:18:21 pm
 * Modified By:   Paul Martin
 */

const net = require('net');

const Bbb = require('./Bbb');
const Logger = require('./Logger');
const parser = require('./parser');
const execBin = new Bbb();

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

function run_bin(payload) {
  // if already running binary, don't connect again
  if (execBin.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  if (!execBin.doesCompiledBinExist()) {
    broadcastError("Couldn't execute the binary. './hyped' does not exist.");
    return;
  }

  const logger = new Logger();
  const parseQueue = new parser.ExecParser();

  function outputHandler(data) {
    logger.addContent(data.toString());

    // Parse
    parseQueue.addToQueue(data.toString());
    if (parseQueue.countLines() <= 1) return; // Make sure that no incomplete lines are parsed

    const parsedLines = parseQueue.parse();
    broadcastData(parsedLines);
  }

  function exitHandler(data, err) {
    const parsedLines = parseQueue.parseRest();
    broadcastData(parsedLines);
    broadcastCompleted('run_bin');
  }

  function errorHandler(errCode) {
    broadcastError(err);
  }

  console.log('** Executing binary');
  execBin.run(
    payload.flags,
    payload.debug_level,
    outputHandler,
    exitHandler,
    errorHandler
  );
}

function compile_bin(make_params) {
  // if already running binary, don't connect again
  if (execBin.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  const logger = new Logger();

  function outputHandler(data) {
    // ignore output, only care about warnings and errors (errorHandler)
  }

  function exitHandler(data, err) {
    const parsedLines = parseQueue.parseRest();
    broadcastData(parsedLines);
    broadcastCompleted('compile_bin');
  }

  function errorHandler(err) {
    broadcastError(err);
  }

  console.log('** Executing binary');
  execBin.compile(make_params, outputHandler, exitHandler, errorHandler);
}

function kill_run() {
  console.log('** Stopping binary');
  execBin.kill();
}

/**
 * Interprets the tcp message
 *
 * @param {str} msg - The command to be executed (eg. 'run_bin')
 * @param {*} data - JSON-obj containing parameters for execution of command
 */
function handleRequest(msg, data) {
  console.log(msg);
  switch (msg) {
    case 'run_bin':
      run_bin({
        flags: data.flags || [],
        debug_level: data.debug_level || 3
      });
      break;

    case 'kill_running_bin':
      kill_run();
      break;

    case 'compile_bin':
      compile_bin(data.make_params || []);
      break;

    default:
      console.error("Couldn't interpret message");
  }
}

function tcpHandleData(dataRaw) {
  if (utils.isJsonParsable(dataRaw)) {
    const data = JSON.parse(dataRaw);
    const msg = data.msg;
    handleRequest(msg, data);
  } else {
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

function broadcast(data) {
  sockets.all.forEach(socket => {
    socket.write(data + '\n');
  });
}

// TODO: add error types
function broadcastError(err) {
  const data = JSON.stringify({
    msg: 'error',
    payload: err.toString()
  });

  broadcast(data);
}

function broadcastData(payload) {
  const data = JSON.stringify({
    msg: 'console_data',
    payload: payload
  });

  broadcast(data);
}

function broadcastCompleted(cmd) {
  const data = JSON.stringify({
    msg: 'completed',
    task: cmd
  });

  broadcast(data);
}

function onClientConnected(socket) {
  sockets.add(socket);

  console.log('** New connection');
  socket.setEncoding('utf-8');

  socket.on('data', tcpHandleData);
  socket.on('close', () => {
    tcpHandleClose();
    sockets.remove(socket);
  });
  socket.on('error', err => {
    tcpHandleError(err);
    sockets.remove(socket);
  });
}

module.exports = port => {
  const server = net.createServer(onClientConnected);
  server.listen(port);
  console.log(`** Listening on port ${port}`);
};
