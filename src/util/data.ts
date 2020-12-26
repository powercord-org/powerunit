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

import type { DeepPartial } from '@util/types'

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

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function -- not implemented */

// @ts-expect-error - not implemented
export function mergeData <T extends Record<string, unknown>> (obj1: T, obj2: DeepPartial<T>): T {} // todo

// @ts-expect-error - not implemented
export function extractData <T extends Record<string, unknown>> (data: T, filter: Record<string, boolean>): DeepPartial<T> {} // todo; mongo-style sort of

/* eslint-enable */
