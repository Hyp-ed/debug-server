/*
 * File:          parser.test.js
 * Project:       hyped-2020-debug-server
 * File Created:  Thursday, 6th February 2020 6:37:09 pm
 * Author(s):     Paul Martin
 *
 * Last Modified: Monday, 2nd March 2020 6:49:26 pm
 * Modified By:   Paul Martin
 */

const { ExecParser } = require('../src/parser');

const input1 = `18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.427 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.428 DBG3[Fake-GpioCounter]: time_after: 0`;
const output1 = [
  {
    line: '18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.393',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  },
  {
    line: '18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.393',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  },
  {
    line: '18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.404',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  },
  {
    line: '18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.404',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  },
  {
    line: '18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.414',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  },
  {
    line: '18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.414',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  },
  {
    line: '18:47:04.427 DBG3[Fake-GpioCounter]: time_after: 0',
    time: '18:47:04.427',
    log_type: 'DBG3',
    debug_level: '3',
    submodule: 'Fake-GpioCounter',
    log: 'time_after: 0'
  }
];

const input2 = [
  '18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0',
  `
18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0
`,
  `18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.427 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.428 DBG3[Fake-GpioCounter]: time_after: 0`
];
const output2 = output1;

const input3 = [
  '18:47:04.393 DBG3[Fake-GpioC',
  `ounter]: time_after: 0
18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.404 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.414 `,
  `DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.414 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.427 DBG3[Fake-GpioCounter]: time_after: 0
18:47:04.428 DBG3[Fake-GpioCounter]: time_after: 0`
];
const output3 = output1;

test('Queue & parse simple block', () => {
  const queue = new ExecParser();

  queue.addToQueue(input1);
  expect(queue.countLines()).toBe(8);

  const parsedLines = queue.parse();
  expect(parsedLines).toHaveLength(7);
  expect(parsedLines).toEqual(output1);
});

test('Queue & parse multiple line blocks', () => {
  const queue = new ExecParser();

  input2.forEach(line => {
    queue.addToQueue(line);
  });
  expect(queue.countLines()).toBe(8);

  const parsedLines = queue.parse();
  expect(parsedLines).toHaveLength(7);
  expect(parsedLines).toEqual(output2);
});

test('Queue & parse split lines', () => {
  const queue = new ExecParser();

  input3.forEach(line => {
    queue.addToQueue(line);
  });
  expect(queue.countLines()).toBe(8);

  const parsedLines = queue.parse();
  expect(parsedLines).toHaveLength(7);
  expect(parsedLines).toEqual(output3);
});
