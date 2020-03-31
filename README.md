# Specifications

- Runs on `nodeJS`
- Communicates over `TCP`
- TCP server listens on port `7070`

# Installation & Requirements

1. Download and install nodeJS from [nodejs.org](https://nodejs.org/en/) \
   You can check whether it was successfully installed by typing `node -v && npm -v` in the terminal.

2. Clone this repo

3. Run `./setup.sh` in the repo's base folder _(Internet connection required)_ \
   This will setup the subrepo and install the node dependencies.

4. To **start the server**, go into the `server` sub-directory and type `npm start`

# Updating the hyped-2020 submodule _(git pull / git checkout)_

**The default branch for hyped-2020 is `develop`**

For the time being, you will have to `ssh` into the BBB, `cd` into `debug-server/hyped-pod_code` and run your `git` commands there.

An option to `git pull` and `git checkout [branch]` through the [mission-control GUI](https://github.com/Hyp-ed/mission-control-2020-frontend) is on our [Feature wishlist](https://app.clickup.com/t/2ugjg2) but not yet implemented.

# Valid TCP messages

## Using SSH

By default the hyped pod code used for compiling and executing the binary is located in the "hyped-pod_code" directory.

If you wish to run the commands not on your local machine but instead remotely via ssh, send the following message to setup the remote connection.

```JSON
{
    "msg" : "use_ssh",
    "host" : "192.168.6.2",
    "username" : "hyped",
    "password" : "spacex",
    "dir" : "~/hyped-2020"
}
```

- If a connection already exists, it is closed and overwritten.
- If the connection fails, the local machine is used.

**Possible responses:**

```JSON
{ "msg": "ssh_connection", "success": <bool> }
```

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

## Resetting

- Kills all running processes
- Disconnects ssh
- Deletes all temporary data (e.g. ssh connection details)
- _Does not_ disconnect tcp connections. For that a manual restart of the server is required.

```JSON
{ "msg" : "reset" }
```

**Possible responses:**

```JSON
{ "msg": "reset_complete" }
```

# Possible TCP responses

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

## Errors

Error messages may be split into multiple TCP messages

```JSON
{
    "msg": "error",
    "type": <type>,
    "payload":  {
        "message": "error_message",
        "stack_trace": "if available"
    }
}
```

**Error types:**

- `"server_error"`

## Termination

```JSON
{
    "msg": "terminated",
    "task": "command_name",
    "success": <bool>,
    "payload": "error_message(s)"
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
