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

import type { FastifyInstance } from 'fastify'

import apiv8 from './v8/index.js'
import status from './status.js'

export default async function (fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', (_, reply, next) => {
    reply.header('access-control-allow-credentials', 'true')
    reply.header('access-control-allow-headers', 'Content-Type, Authorization, X-Track, X-Super-Properties, X-Context-Properties, X-Failed-Requests, X-Fingerprint, X-RPC-Proxy, X-Debug-Options, x-client-trace-id, If-None-Match, X-RateLimit-Precision')
    reply.header('access-control-allow-methods', 'POST, GET, PUT, PATCH, DELETE')
    reply.header('access-control-allow-origin', '*')
    next()
  })

  fastify.register(apiv8, { prefix: '/api/v8' })
  fastify.register(status, { prefix: '/api/v2' })
  fastify.setNotFoundHandler((request, reply) => {
    console.log(request.url)
    reply.code(404).send({ code: 0, message: '404: Not Found' })
  })
}
