/*
 * File:          commands.js
 * Project:       hyped-2020-debug-server
 * File Created:  Friday, 27th March 2020 6:14:46 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Tuesday, 31st March 2020 2:36:42 pm
 * Modified By:   Paul Martin
 * Description:   Functions must be named after their corresponding tcp message
 */
'use strict';

const raiseErr = require('./utils').raiseErr;
const Logger = require('./logger');
const ExecParser = require('./parser').ExecParser;

async function run_bin(bbb, socket_wrapper, msg_payload) {
  // if already running binary, don't connect again
  if (bbb.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  if (!(await bbb.doesCompiledBinExist().catch(raiseErr))) {
    throw new Error(
      `ERR_INVALID_FILE_URL_PATH: Couldn't execute the binary. '${bbb.bin_path}' does not exist.`
    );
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
    if (parseQueue.queue === '') return;

    const parsedLines = parseQueue.parseRest();
    socket_wrapper.sendData(parsedLines);
    socket_wrapper.sendTerminated('run_bin', true);
  }

  // Don't differentiate between stdout and stderr
  // DBG logs are sent through stderr and errors are sent through stdout (also parsable)
  const errorHandler = outputHandler;

  console.log('** Executing binary');
  bbb
    .runBin(
      msg_payload.flags || [],
      msg_payload.debug_level || 3,
      outputHandler,
      exitHandler,
      errorHandler
    )
    .catch(raiseErr);
}

async function compile_bin(bbb, socket_wrapper, msg_payload) {
  const make_params = msg_payload.make_params;

  // if already running binary, don't connect again
  if (bbb.isBusy()) {
    console.log('** System is currently busy');
    return;
  }

  let error_collection = '';

  function outputHandler(data) {
    // ignore output, only care about warnings and errors (errorHandler)
  }

  async function exitHandler(data, err) {
    // Check if binary was created
    let successful = false;
    if (bbb.doesCompiledBinExist()) {
      const secsSinceCompiled =
        (new Date() - (await bbb.binLastModified())) / 1000;
      if (secsSinceCompiled <= 1) successful = true;
    }

    socket_wrapper.sendTerminated('compile_bin', successful, error_collection);
  }

  function errorHandler(err) {
    // Collect error messages and send on exit
    error_collection += err.toString();
  }

  console.log('** Compiling binary');
  bbb.compileBin(make_params, outputHandler, exitHandler, errorHandler);
}

async function kill_running_bin(bbb) {
  console.log('** Stopping binary');
  bbb.kill();
}

async function use_ssh(bbb, socket_wrapper, msg_payload) {
  const { host, username, password = '', dir = '' } = msg_payload;

  const success = await bbb.useSSH({ host, username, password, dir });
  socket_wrapper.sendFormatted({ msg: 'ssh_connection', success });
}

async function reset(bbb, socket_wrapper) {
  socket_wrapper.bbb = bbb.reset();
  socket_wrapper.sendFormatted({ msg: 'reset_complete' });
}

module.exports = {
  run_bin,
  compile_bin,
  kill_running_bin,
  use_ssh,
  reset
};
