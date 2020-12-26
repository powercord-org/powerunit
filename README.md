# Powerunit
Powercord's unit testing framework. Used by [Powercord](https://powercord.dev/) to test things and see if they break
or if they break a lot. Powercord plugin developers can also use powerunit if they want to unit test their plugins, if
they are as crazy as me.

Powerunit is meant to be used with a unit testing framework like [jest](https://jestjs.io/), and just takes care of
setting up/tearing down an environment and providing a toolsuite for the tests to run.

The test environment is quite heavy and includes:
 - Running Discord using a separate profile, to not pollute your installation;
 - Starting up a mock API server which will be used to mock the app state and make it function without needing to ever
 reach the actual Discord API using [fastify](https://fastify.io/) and [ws](https://github.com/websockets/ws);
 - Connecting to Discord using [puppeteer](https://pptr.dev/);

This means Powerunit will spin up an instance of Discord, an http server, and a websocket server, which is costly
in terms of resources. It, obviously, requires having Discord installed on the host machine.

See USAGE.md for more info on how to use this.

## Why?
Because it's completely unnecessary but a fun project to work on.

Injecting into Discord is a tedious task and some weird glitches can occur, so why not just do what the big brain people
do, which is unit test the fuck out of this, huh?

## How?
The Discord client is just an electron app, and an electron app is just a glorified chromium instance. I just start
a new instance of Discord, enable remote debugging, and connect using puppeteer. Once that's done, all of the magic
is done!

The mock API & Gateway Powerunit runs are in no way suitable for uses other than basic unit testing of the client.
Only endpoints and features used by the official Discord client are implemented and will work, and there is no
persistent storage (everything is stored in memory, and dropped once the test is over). There are also little to
no payload validation for the time being, so if your thingy does raw http requests (*which it shouldn't do >:(*),
make sure your payload is valid before trying. Data validation will be added in the future.

In the future, I may also introduce a broader support of the API, and who knows maybe make this a viable tool for
unit testing not only your ~~illegal software~~client mod but your bot as well. In the far future, though.

## Repo structure
 - `src/api`: Mock routes of the Discord API (only has partial and very funky coverage);
 - `src/cli`: Powerunit CLI, brain of the unit test framework;
 - `src/lib`: Unit testing toolsuite; what the end users have access to;
 - `cert`: Contains a self-signed certificate, since https is required, this is not a security issue;
