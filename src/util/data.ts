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
import { hasOwnProperty, isObject } from '@util/misc'

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

export function cloneDeep<T extends Record<PropertyKey, unknown>> (obj: T): T {
  const res: Record<PropertyKey, unknown> = {}
  for (const prop in obj) {
    if (hasOwnProperty(obj, prop)) {
      const value = obj[prop]
      if (Array.isArray(value)) {
        res[prop] = [ ...value ]
      } else if (isObject(value)) {
        res[prop] = cloneDeep(value)
      } else {
        res[prop] = value
      }
    }
  }

  return res as T
}

export function mergeData<T extends Record<string, unknown>> (obj1: T, obj2: DeepPartial<T>): T {
  const res = Object.assign({}, obj1)
  let key: keyof T
  for (key in obj2) {
    if (hasOwnProperty(obj2, key)) {
      let val1 = obj1[key]
      let val2 = obj2[key]
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (Array.isArray(val1) && Array.isArray(val2)) {
          res[key] = [ ...val1, ...val2 ] as T[typeof key]
        } else {
          res[key] = Object.assign({}, val1, val2)
        }
      } else {
        res[key] = val2
      }
    }
  }
  return res
}

export function extractData<TData extends Record<string, unknown>> (data: TData, keys: Array<keyof TData>, include: boolean = true): DeepPartial<TData> {
  // todo: handle nested objects
  // it'll probably be a pain to type and I'm too lazy to implement it
  // so instead of writing code I write a todo comment like any software engineer
  //
  // I may also need the help of a typescript guru here, although I'm fairly certain I ask for the impossible:
  // is there a way, to make a keyof which would handle nesting? like `[ 'property', 'property.nested', 'property.nested2' ]`?
  // this is the main thing holding me from implementing nested extraction :(

  let res: DeepPartial<TData>
  if (include) {
    res = {}
    keys.forEach((k) => (res[k] = data[k]))
  } else {
    res = cloneDeep<TData>(data)
    keys.forEach((k) => delete res[k])
  }

  return res
}
