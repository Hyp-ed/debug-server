# Specifications

- Runs on `nodeJS`
- Communicates over `TCP`
- Listens on port `7070`

# Installation & Requirements

1. Download and install nodeJS from [nodejs.org](https://nodejs.org/en/) \
   You can check whether it was successfully installed by typing `node -v && npm -v` in the terminal.

2. Clone this repo

3. Run `./setup.sh` in the repo's base folder \
   This will setup the subrepo and install the node dependencies.

4. To **start the server**, go into the `server` sub-directory and type `npm start`

# Valid TCP messages

## Compiling the binary

Only run the `make` command:

```JSON
{ "msg": "compile_bin" }
```

Run the `make` command with params / flags:

```JSON
{
    "msg": "compile_bin",
    "make_params": [
        "--ignore-errors",
        "--jobs=2"
    ]
}
```

**Possible responses:**

- [Errors](#errors)
- [Completion](#completion)

## Executing the binary

Execute without flags:

```JSON
{ "msg": "run_bin" }
```

Execute with custom flags and debug-level (default=3):

```JSON
{
    "msg": "run_bin",
    "flags": ["--fake_imus"],
    "debug_lvl": 2
}
```

**Possible responses:**

- [Console Data](#console-data) -> Parsed lines
- [Errors](#errors)
- [Completion](#completion)

## Stopping execution

```JSON
{ "msg": "kill_running_bin" }
```

**Possible responses:**

Triggers the [Completion](#completion) response of the [binary execution](#executing-the-binary)

# Possible TCP responses

Responses are always broadcasted to all connected clients

## Errors

Error messages may be split into multiple TCP messages

```JSON
{
    "msg": "error",
    "payload": "error_message"
}
```

## Console Data

```JSON
{
    "msg": "console_data",
    "payload": <data>
}
```

**Types of data:**

- Parsed line(s) \
   e.g.

  ```JSON
  [
    {
        "line": "18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0",
        "time": "18:47:04.393",
        "debug_mode": "DBG3",
        "debug_level": "3",
        "submodule": "Fake-GpioCounter",
        "log": "time_after: 0"
    },
    {
        "line": "18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0",
        "time": "18:47:04.393",
        "debug_mode": "DBG3",
        "debug_level": "3",
        "submodule": "Fake-GpioCounter",
        "log": "time_after: 0"
    }
  ]
  ```

- String \
   _(Possible but not yet implemented)_

## Completion

```JSON
{
    "msg": "completed",
    "task": "command_name"
}
```

`task` returns the `msg`-parameter sent to trigger the specific command.

E.g. when compiling the binary, the TCP response would be

```JSON
{
    "msg": "completed",
    "task": "compile_bin"
}
```
