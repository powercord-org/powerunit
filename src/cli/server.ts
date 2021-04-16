/*
 * Copyright (c) 2020-2021 Cynthia K. Rey, All rights reserved.
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

import { createServer } from 'https'
import { generateKeyPairSync } from 'crypto'
import WebSocket from 'ws'
import fastifyFactory from 'fastify'
import { CertificateSigningRequest } from '@cyyynthia/jscert'

import rest from '../api/rest.js'
import gateway from '../api/gateway/index.js'
import remoteAuth from '../api/remote-auth.js'

export interface ServerInstance {
  port: number
  close: () => Promise<unknown>
}

async function makeCert (): Promise<[ string, string ]> {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024 })
  const csr = new CertificateSigningRequest({ commonName: 'discord.localhost' }, privateKey, { digest: 'sha1' })

  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setMilliseconds(0)

  return [
    csr.createSelfSignedCertificate(date).toPem(),
    privateKey.export({ format: 'pem', type: 'pkcs1' }) as string
  ]
}

export default async function (): Promise<Readonly<ServerInstance>> {
  const [ cert, key ] = await makeCert()
  const http = createServer({ cert: cert, key: key })

  const fastify = fastifyFactory({ logger: true, serverFactory: (h) => http.on('request', h) })
  const gatewayServer = new WebSocket.Server({ noServer: true })
  const remoteAuthServer = new WebSocket.Server({ noServer: true })

  fastify.register(rest)
  fastify.setReplySerializer((payload) => JSON.stringify(payload, (_, v) => typeof v === 'bigint' ? v.toString() : v))
  gatewayServer.on('connection', gateway)
  remoteAuthServer.on('connection', remoteAuth)

  http.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    if (request.headers.host === 'remote-auth-gateway.discord.gg') {
      remoteAuthServer.handleUpgrade(request, socket, head, (ws) => remoteAuthServer.emit('connection', ws, request))
    } else if (request.headers.host === 'gateway.discord.gg') {
      gatewayServer.handleUpgrade(request, socket, head, (ws) => gatewayServer.emit('connection', ws, request))
    } else {
      socket.destroy()
    }
  })

  await fastify.ready()
  const port = await new Promise<number>((resolve) => http.listen(0, () => resolve((http.address() as { port: number }).port)))
  console.log(port)

  return {
    port: port,
    close: async (): Promise<unknown> =>
      Promise.all([
        fastify.close(),
        new Promise((resolve) => gatewayServer.close(resolve)),
        new Promise((resolve) => remoteAuthServer.close(resolve)),
        new Promise((resolve) => http.close(resolve)),
      ]),
  }
}
