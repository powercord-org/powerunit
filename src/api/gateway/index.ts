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

import type WebSocket from 'ws'
import type { Deflate } from 'zlib'
import type { IdentifyPayload } from './types'

import erlpack from 'erlpack'
import { createDeflate } from 'zlib'
import { OpCode } from './types'
import { readSelf } from '@api/datastore'
import { projectData } from '@util/data'

enum ConnectionState { CONNECTING, CONNECTED, CLOSED }

type Payload = { op: OpCode, d?: unknown, t?: string, s?: number }

// I'll assume the gateway requests etf format and zlib-stream compression - todo: stop assuming before gateway sjw yells at me
class GatewayConnection {
  private ws: WebSocket

  private deflate: Deflate

  private sequence: number = 0

  private heartbeatInterval: number

  private identifyTimer: NodeJS.Timeout

  private heartbeatTimer: NodeJS.Timeout

  private state: ConnectionState = ConnectionState.CONNECTING

  public constructor (ws: WebSocket) {
    this.ws = ws
    this.heartbeatInterval = (Math.floor(Math.random() * 10) + 40) * 1e3
    this.deflate = createDeflate({ chunkSize: 128 * 1024 })
    this.deflate.on('data', (d: Buffer) => this.ws.send(d))
    this.ws.on('message', this.handleMessage.bind(this))
    this.ws.once('close', () => {
      this.state = ConnectionState.CLOSED
      // eslint-disable-next-line no-use-before-define -- its fine
      connections.delete(this)
    })

    this.send({
      op: OpCode.HELLO,
      d: {
        heartbeat_interval: this.heartbeatInterval,
        _trace: [ 'cutie' ],
      },
    })

    this.identifyTimer = setTimeout(() => this.ws.close(), 60e3)
    this.heartbeatTimer = setTimeout(() => this.ws.close(), this.heartbeatInterval * 2)
  }

  public getState (): ConnectionState {
    return this.state
  }

  public send (payload: Payload): void {
    if (this.state === ConnectionState.CLOSED) throw new Error('Connection is closed!')
    if (payload.op === OpCode.DISPATCH) {
      if (!payload.t) throw new TypeError('An event must be defined for a dispatch')
      payload.s = this.sequence++
    }

    const packed = erlpack.pack(payload)
    this.deflate.write(packed)
    this.deflate.flush()
  }

  public close (code?: number, message?: string): void {
    if (this.state === ConnectionState.CLOSED) throw new Error('Connection already closed!')
    this.ws.close(code, message)
  }

  private handleMessage (encoded: Buffer): void {
    let data: Payload | null
    try { data = erlpack.unpack(encoded) } catch { return this.ws.close(4002) }
    if (!data || typeof data !== 'object' || !('op' in data) || !('d' in data)) {
      return this.ws.close(4002)
    }

    // todo: payload validation
    switch (data.op) {
      case OpCode.HEARTBEAT:
        this.handleHeartbeat()
        break
      case OpCode.IDENTIFY:
        this.handleIdentify(data.d as IdentifyPayload)
        break
      default:
        // once everthing is implemented just throw w/ invalid op
        console.log(data)
        break
    }
  }

  private handleHeartbeat (): void {
    clearTimeout(this.heartbeatTimer)
    this.heartbeatTimer = setTimeout(() => this.ws.close(), this.heartbeatInterval * 2)
    this.send({ op: OpCode.HEARTBEAT_ACK })
  }

  private handleIdentify (payload: IdentifyPayload): void {
    if (this.state !== ConnectionState.CONNECTING) {
      return this.ws.close(4005)
    }

    clearTimeout(this.identifyTimer)
    if (payload.token !== 'powerunit') {
      return this.ws.close(4004)
    }

    if (payload.compress) {
      return this.ws.close(4000, 'Unsupported (powerunit)')
    }

    // todo: set presence
    this.state = ConnectionState.CONNECTED

    this.send({
      op: OpCode.DISPATCH,
      t: 'READY',
      d: {
        v: 8,
        analytics_token: 'track.me.daddy',
        connected_accounts: [], // todo
        consents: { personalization: { consented: false } },
        country_code: 'FR',
        experiments: [],
        friend_suggestion_count: 0,
        geo_ordered_rtc_regions: [], // todo
        guild_experiments: [],
        guild_join_requests: [],
        guilds: [], // todo
        merged_members: [], // todo
        private_channels: [], // todo
        read_state: {
          version: 50,
          partial: false,
          entries: [], // todo
        },
        relationships: [], // todo
        session_id: Math.random().toString(16).slice(2), // powerunit doesn't have session handling in mind
        tutorial: null,
        user: projectData(readSelf(), { properties: [ 'settings' ], delete: true }),
        user_guild_settings: {
          version: 0,
          partial: false,
          entries: [], // todo
        },
        user_settings: readSelf().settings,
        users: [], // todo
        _trace: [ 'cutie uwu' ],
      },
    })

    this.send({
      op: OpCode.DISPATCH,
      t: 'READY_SUPPLEMENTAL',
      d: {
        guilds: [], // todo
        merged_members: [], // todo
        merged_presences: {
          guilds: [], // todo
          friends: [], // todo
        },
      },
    })
  }
}

const connections: Set<GatewayConnection> = new Set()

export function dispatch (evt: string, data: {}): void {
  connections.forEach((conn) => {
    // for now all connections are the same user only, no need for a user-provided predicate
    if (conn.getState() === ConnectionState.CONNECTED) {
      conn.send({
        op: OpCode.DISPATCH,
        d: data,
        t: evt,
      })
    }
  })
}

export default function (ws: WebSocket): void {
  const conn = new GatewayConnection(ws)
  connections.add(conn)
}
