# Powerunit
Powercord's unit testing framework. Used by [Powercord](https://powercord.dev) to test things and see if they break
or if they break a lot.

Powercord plugin developers can also use powerunit if they want to unit test their plugins, if they are as crazy as
me.

## Why?
Because it's completely unnecessary but a fun project to work on.

## How?
The Discord client is just an electron app, and an electron app is just a glorified chromium instance. I just start
a new instance of Discord, enable remote debugging, and connect using [puppeteer](https://pptr.dev/).

The API/Gateway are also mocked, to allow faking data super easily and not get banned on discord.com which would be
a bummer.
