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

import type WebSocket from 'ws'
import { createPublicKey, publicEncrypt, createHash } from 'crypto'

const YEAR = 365 * 24 * 3600e3

// The implementation just lets the client show a QR
export default function (ws: WebSocket): void {
  let fingerprint: string = ''
  ws.on('message', (blob: string) => {
    const data = JSON.parse(blob)
    switch (data.op) {
      case 'init': {
        const key = Buffer.from(data.encoded_public_key, 'base64')
        const publicKey = createPublicKey({ key: key, type: 'spki', format: 'der' })
        const enc = publicEncrypt({ key: publicKey, oaepHash: 'sha256' }, Buffer.from('hey cutie <3')).toString('base64')
        fingerprint = createHash('sha256')
          .update(key)
          .digest('base64')
          .replace(/\//g, '_')
          .replace(/\+/g, '-')
          .replace(/=/g, '')
        ws.send(JSON.stringify({ op: 'nonce_proof', encrypted_nonce: enc }))
        break
      }
      case 'nonce_proof':
        ws.send(JSON.stringify({ op: 'pending_remote_init', fingerprint: fingerprint }))
        break
      case 'heartbeat':
        ws.send(JSON.stringify({ op: 'heartbeat_ack' }))
        break
    }
  })

  ws.send(JSON.stringify({ op: 'hello', timeout_ms: YEAR, heartbeat_interval: 60e3 }))
}
