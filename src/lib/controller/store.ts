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

import type { DataStore, DataTypes } from './types'

// I don't really care about having an efficient datastore here; What matters is storing it and being able to fetch it.

let idBuffer = 1
const BASIC_USER = {
  username: 'powerunit',
  discriminator: '0001',
  avatar: null
}

const dataStore: DataStore = {
  get user () { return dataStore.users.get(0)! },
  users: new Map([ [ 0, BASIC_USER ] ]),
  presences: new Map(),
  relations: new Map(),
  guilds: new Map(),
  channels: new Map(),
  messages: new Map()
}

// todo: get rid of any
export function push (type: DataTypes, obj: any): number {
  const id = idBuffer++
  dataStore[type].set(id, obj)
  return id
}

// todo: get rid of any
export function patch (type: DataTypes, id: number, obj: any): void {
  if (!dataStore[type].has(id)) throw new RangeError(`ID ${id} not found in collection ${type}`)
  const item = dataStore[type].get(id)
  dataStore[type].set(id, Object.assign({}, item, obj))
}

export function pull (type: DataTypes, id: number): boolean {
  if (type === 'users' && id === 0) throw new Error('Cannot delete own user (ID 0)')
  return dataStore[type].delete(id)
}

export function reset () {
  idBuffer = 1
  dataStore.users.clear()
  dataStore.presences.clear()
  dataStore.relations.clear()
  dataStore.guilds.clear()
  dataStore.channels.clear()
  dataStore.messages.clear()
  dataStore.users.set(0, BASIC_USER)
}
