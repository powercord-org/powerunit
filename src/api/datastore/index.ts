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

import type { DataStore, DataType, SelfUser } from './types'
import type { DeepPartial } from '@util'
import { generateSnowflake } from '@util'

function createSelf (): SelfUser {
  return {
    id: generateSnowflake(),
    username: 'powerunit',
    discriminator: '0001',
    avatar: null,
    flags: 0,
    email: 'powerunit@powercord.dev',
    phone: null,
    premium: false,
    verified: true,
    mfa_enabled: false,
    nsfw_allowed: null,
    settings: {
      locale: 'en-GB',
      theme: 'dark'
    }
  }
}

// I don't really care about having an efficient datastore here; What matters is storing it and being able to fetch it.
const dataStore: DataStore = {
  user: createSelf(),
  users: new Map(),
  presences: new Map(),
  relations: new Map(),
  guilds: new Map(),
  channels: new Map(),
  messages: new Map()
}

dataStore.users.set(dataStore.user.id, dataStore.user)

export function read (type: DataType, id: string): any | undefined {
  if (!id) throw new TypeError('ID must be defined')
  return dataStore[type].get(id)
}

export function readSelf (): SelfUser {
  return dataStore.user
}

// todo: get rid of any
export function push (type: DataType, obj: any, id: string = generateSnowflake()): string {
  dataStore[type].set(id, obj)
  return id
}

// todo: get rid of any
export function patch (type: DataType, id: string, obj: any): void {
  if (type === 'users' && id === dataStore.user.id) throw new Error('Cannot patch base user, use `patchSelf` instead.')
  if (!dataStore[type].has(id)) throw new RangeError(`ID ${id} not found in collection ${type}.`)
  const item = dataStore[type].get(id)
  // todo: merge deep
  delete obj.id // prevent id injection - todo: better
  dataStore[type].set(id, Object.assign({}, item, obj))
}

export function patchSelf (user: DeepPartial<SelfUser>) {
  // todo: merge deep (the proper way)
  delete user.id // prevent id injection - todo: better
  const newUser = Object.assign({}, dataStore.user, user)
  if (user.settings) newUser.settings = Object.assign({}, dataStore.user.settings, user.settings)
  dataStore.user = newUser
  dataStore.users.set(dataStore.user.id, dataStore.user)
}

export function pull (type: DataType, id: string): boolean {
  if (type === 'users' && id === dataStore.user.id) throw new Error('Cannot delete base user!')
  return dataStore[type].delete(id)
}

export function reset () {
  dataStore.user = createSelf()
  dataStore.users.clear()
  dataStore.presences.clear()
  dataStore.relations.clear()
  dataStore.guilds.clear()
  dataStore.channels.clear()
  dataStore.messages.clear()
  dataStore.users.set(dataStore.user.id, dataStore.user)
}
