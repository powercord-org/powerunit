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
import type { DeepPartial } from '@util/types'
import { generateSnowflake, mergeData } from '@util/data'

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
    bot: false,
    system: false,
    settings: {
      locale: 'en-GB',
      theme: 'dark',
      show_current_game: true,
      restricted_guilds: [],
      default_guilds_restricted: false,
      inline_attachment_media: true,
      inline_embed_media: true,
      gif_auto_play: true,
      render_embeds: true,
      render_reactions: true,
      animate_emoji: true,
      enable_tts_command: true,
      message_display_compact: false,
      convert_emoticons: true,
      explicit_content_filter: 1,
      disable_games_tab: false,
      developer_mode: false,
      guild_positions: [],
      detect_platform_accounts: true,
      status: 'online',
      afk_timeout: 600,
      timezone_offset: 0,
      stream_notifications_enabled: true,
      allow_accessibility_detection: false,
      contact_sync_enabled: false,
      native_phone_integration_enabled: true,
      friend_source_flags: { all: true },
      guild_folders: [],
      custom_status: null,
    },
  }
}

// I don't really care about having an efficient datastore here; What matters is storing it and being able to fetch it.
// and despite the fact it'd break apart at scale, it's surprisingly decent compared to what I did expect to end with

// todo: BETTER TYPINGS
// I honestly don't think I'm knowledgeable enough for this, so let's hope a ts guru in the audience comes here to help a girl in need
//
// basically, each function receives a collection name, and an *any typed value*
// the collection name points to a Map<string, TDocument> where TDocument is the type I need for those any typed stuff

const dataStore: DataStore = {
  user: createSelf(),
  users: new Map(),
  presences: new Map(),
  relations: new Map(),
  guilds: new Map(),
  channels: new Map(),
  messages: new Map(),
}

dataStore.users.set(dataStore.user.id, dataStore.user)

// Special one; self user
export function readSelf (): SelfUser {
  return dataStore.user
}

export function read (type: DataType, id: string): any | void {
  return dataStore[type].get(id)
}

export function find (type: DataType, predicate: (item: any) => boolean): any | void {
  for (const item of dataStore[type].values()) {
    if (predicate(item)) return item
  }
}

export function readAll (type: DataType, ids: string[]): any[] {
  const res: any[] = []
  ids.forEach((id) => {
    const item = dataStore[type].get(id)
    if (item) res.push(item)
  })
  return res
}

export function findAll (type: DataType, predicate: (item: any) => boolean): any[] {
  const res: any[] = []
  for (const item of dataStore[type].values()) {
    if (predicate(item)) res.push(item)
  }
  return res
}

export function push (type: DataType, obj: any, id: string = generateSnowflake()): string {
  dataStore[type].set(id, obj)
  return id
}

export function patch (type: DataType, id: string, obj: any): void {
  if (type === 'users' && id === dataStore.user.id) throw new Error('Cannot patch base user, use `patchSelf` instead.')
  if (!dataStore[type].has(id)) throw new RangeError(`ID ${id} not found in collection ${type}.`)
  if (obj.id) throw new TypeError('Cannot patch IDs.')

  const item = dataStore[type].get(id)
  dataStore[type].set(id, mergeData(item, obj))
}

export function patchSelf (user: DeepPartial<SelfUser>): void {
  if (user.id) throw new TypeError('Cannot patch IDs.')

  dataStore.user = mergeData(dataStore.user, user)
  dataStore.users.set(dataStore.user.id, dataStore.user)
}

export function pull (type: DataType, id: string): boolean {
  if (type === 'users' && id === dataStore.user.id) throw new Error('Cannot delete base user!')
  return dataStore[type].delete(id)
}

export function reset (): void {
  dataStore.user = createSelf()
  dataStore.users.clear()
  dataStore.presences.clear()
  dataStore.relations.clear()
  dataStore.guilds.clear()
  dataStore.channels.clear()
  dataStore.messages.clear()
  dataStore.users.set(dataStore.user.id, dataStore.user)
}
