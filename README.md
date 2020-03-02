# Specifications

- Runs on `nodeJS`
- Communicates over `TCP`
- Listens on port `7070`

# Installation & Requirements

1. Download and install nodeJS from [nodejs.org](https://nodejs.org/en/) \
   You can check whether it was successfully installed by typing `node -v && npm -v` in the terminal.

2. Clone this repo

3. Run `./setup.sh` in the repo's base folder _(Internet connection required)_ \
   This will setup the subrepo and install the node dependencies.

4. To **start the server**, go into the `server` sub-directory and type `npm start`

# Updating (git pull & git checkout) the hyped-2020 code called by the debug-server

**The default branch is `develop`**

An option to `git pull` and `git checkout [branch]` through the [mission-control-GUI](https://github.com/Hyp-ed/mission-control-2020-frontend) is on our [Feature wishlist](https://app.clickup.com/t/2ugjg2) but not yet implemented

For the time being, you still have to `ssh` into the BBB, `cd` into `debug-server/hyped-pod_code` and run your `git` commands.

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

- [Termination](#termination)

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
- [Termination](#termination)

## Stopping execution

```JSON
{ "msg": "kill_running_bin" }
```

**Possible responses:**

Triggers the [Termination](#termination) response of the [binary execution](#executing-the-binary)

# Possible TCP responses

Responses are always broadcasted to all connected clients

## Errors

Error messages may be split into multiple TCP messages

```JSON
{
    "msg": "error",
    "type": <type>,
    "payload": "error_message"
}
```

**Error types:**

- `"server_error"`

## Console Data

```JSON
{
    "msg": "console_data",
    "payload": <data>
}
```

**Data types:**

- Parsed line(s) \
   e.g.

  ```JSON
  [
    {
        "line": "18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0",
        "time": "18:47:04.393",
        "log_type": "DBG3",
        "debug_level": "3",
        "submodule": "Fake-GpioCounter",
        "log": "time_after: 0"
    },
    {
        "line": "18:47:04.393 DBG3[Fake-GpioCounter]: time_after: 0",
        "time": "18:47:04.393",
        "log_type": "DBG3",
        "debug_level": "3",
        "submodule": "Fake-GpioCounter",
        "log": "time_after: 0"
    }
  ]
  ```

- String \
   _(Possible but not yet implemented)_

## Termination

```JSON
{
    "msg": "completed",
    "task": "command_name",
    "success": true|false
}
```

`task` returns the `msg`-parameter sent to trigger the specific command.

E.g. when compiling the binary, the TCP response would be

```JSON
{
    "msg": "terminated",
    "task": "compile_bin",
    "success": true,
    "payload": "error_message(s)"
}
```
