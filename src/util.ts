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

import type { FastifyRequest, FastifyReply, RouteHandlerMethod } from 'fastify'

import { existsSync } from 'fs'
import { readdir, lstat, unlink, rmdir } from 'fs/promises'

export type DeepPartial<TObject extends {}> = { [TProperty in keyof TObject]?: DeepPartial<TObject[TProperty]> }

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))

export async function rmdirRf (path: string) {
  if (existsSync(path)) {
    const files = await readdir(path)
    await Promise.all(
      files.map(async (file) => {
        const curPath = `${path}/${file}`
        const stat = await lstat(curPath)
  
        stat.isDirectory()
          ? await rmdirRf(curPath)
          : await unlink(curPath)
      })
    )

    await rmdir(path)
  }
}

let inc = 0
export function generateSnowflake (timestamp: number = Date.now()): string {
  const time = (timestamp - 1420070400000).toString(2)
  const increment = inc.toString(2).padStart(12, '0')
  inc = (inc + 1) % 4096

  let dec = BigInt(0)
  const bin = `${time}${'0'.repeat(10)}${increment}`
  for (let i = 0; i < bin.length; i++) {
    const digit = bin[bin.length - i - 1]
    if (digit === '1') {
      dec += BigInt(2) ** BigInt(i)
    }
  }

  return dec.toString(10)
}

export function isObject (obj: unknown): obj is {} {
  return typeof obj === 'object' && !Array.isArray(obj)
}

export function hasOwnProperty <TObject extends {}, TKey extends PropertyKey>(obj: TObject, prop: TKey): obj is TObject & Record<TKey, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

export function fastifyStatic (data: {}, code: number = 200): RouteHandlerMethod {
  return (_: FastifyRequest, reply: FastifyReply) => void reply.code(code).send(data)
}
