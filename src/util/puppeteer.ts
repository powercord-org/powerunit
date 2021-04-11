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

import { NodeWebSocketTransport } from 'puppeteer-core/lib/cjs/puppeteer/node/NodeWebSocketTransport.js'
import { Connection } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection.js'

export interface NodePuppeteer {
  eval: (js: string) => Promise<any>
  close: () => Promise<void>
}

export async function connectToNode (url: string): Promise<NodePuppeteer> {
  return new Promise((resolve) => {
    NodeWebSocketTransport.create(url).then(async (ws) => {
      const conn = new Connection(url, ws, 0)

      await conn.send('Runtime.enable')
      await conn.send('Debugger.enable')
      await conn.send('Runtime.runIfWaitingForDebugger')
      conn.on('Debugger.paused', () => {
        resolve({
          eval: async (js: string) =>
            conn.send('Runtime.evaluate', {
              replMode: true,
              includeCommandLineAPI: true,
              objectGroup: 'powerunit',
              expression: js,
            }),
          close: async () =>
            conn.send('Runtime.releaseObjectGroup', { objectGroup: 'powerunit' })
              .then(() => conn.dispose()),
        })
      })
    })
  })
}
