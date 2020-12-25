/*
 * Copyright (c) 2020 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import type { IncomingMessage } from 'http'
import type { Socket } from 'net'

import { join } from 'path'
import { readFileSync } from 'fs'
import { createServer } from 'https'
import { Server } from 'ws'
import Fastify from 'fastify'

import gateway from '@api/gateway'
import remoteAuth from '@api/remote-auth'
import rest from '@api/rest'

export interface ServerInstance {
  port: number
  close: () => Promise<unknown>
}

export default async function (): Promise<Readonly<ServerInstance>> {
  const port = Math.floor((Math.random() * 20000) + 10000)
  const http = createServer({
    cert: readFileSync(join(__dirname, '..', '..', 'cert', 'server-cert.pem')),
    key: readFileSync(join(__dirname, '..', '..', 'cert', 'server-key.pem'))
  })

  const fastify = Fastify({ logger: true, serverFactory: (h) => http.on('request', h) })
  const gatewayServer = new Server({ noServer: true })
  const remoteAuthServer = new Server({ noServer: true })

  fastify.register(rest)
  gatewayServer.on('connection', gateway)
  remoteAuthServer.on('connection', remoteAuth)

  http.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    if (request.headers.host === 'remote-auth-gateway.discord.gg') {
      remoteAuthServer.handleUpgrade(request, socket, head, ws => remoteAuthServer.emit('connection', ws, request))
    } else if (request.headers.host === 'gateway.discord.gg') {
      gatewayServer.handleUpgrade(request, socket, head, ws => gatewayServer.emit('connection', ws, request))
    } else {
      socket.destroy()
    }
  })

  await fastify.ready()
  await new Promise<void>((resolve) => http.listen(port, () => void resolve()))

  return {
    port: port,
    close: async () => Promise.all([
      fastify.close(),
      new Promise((resolve) => gatewayServer.close(resolve)),
      new Promise((resolve) => remoteAuthServer.close(resolve)),
      new Promise((resolve) => http.close(resolve))
    ])
  }
}
