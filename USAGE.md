# Usage
**Note**: most of this document is a draft, and things are subject to change.

## Using Powerunit
### General "rules"
### For a mod
### For a plugin

## API Reference

-------
everything here is even more of a draft than what's above; this is in fact more of my personal notes than a draft

cli: `powerunit <actual cmd>`
 - acts as a 'wrapper': sets things up, runs the unit test command, tear things down, exit

keep in mind pupetter will be up for the whole time the lib can be consumed, otherwise someone is fucking things up
and deserved to be spanked <!-- unless its their kink -->

lib:
 - get puppeteer's page object: `import { discord } from '@powercord/powerunit'`
 - get data controller: `import { controller } from '@powercord/powerunit'`

data controller:
 - `controller.reset()`: resets everything to default (absolutely no data, logged in)
 - `controller.disconnect()`: logs current user out
 - `controller.connect()`: logs in
 - `controller.user` current user
 - `controller.users` instance-wide users
 - `controller.relations` instance-wide relationships (friends & blocks)
 - `controller.presences` instance-wide presences
 - `controller.guilds` instance-wide guilds
 - `controller.channels` instance-wide channels
 - `controller.messages` instance-wide messages
 - `controller.dms` dms with other users
