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

export enum PresenceType {
  ONLINE = 'online',
  IDLE = 'idle',
  DND = 'dnd',
  OFFLINE = 'offline',
  INVISIBLE = 'invisible',
}

export enum RelationshipType { NONE, FRIEND, BLOCK }

export enum ChannelType {
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_ANNOUNCEMENT = 5,
  GUILD_STORE = 6,
  ANNOUNCEMENT_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
}

export type User = {
  id: string
  username: string
  discriminator: string
  avatar: string | null
}

export type SelfUser = User & {
  email: string
  phone: string | null
  premium: false | 1 | 2
  mfa_enabled: boolean
  verified: boolean
  flags: number
  nsfw_allowed: boolean | null
  settings: {
    locale: string
    theme: string
  }
}

export type Presence = {
  id: string
  // todo
}

export type Relationship = {
  id: string
  of: number
  userId: number
  type: RelationshipType
}

export type Guild = {
  id: string
  // todo
}

export type PermissionOverwrite = {
  id: string
  type: number
  allow: string
  deny: string
}

export type BasicChannel = {
  id: string
  type: ChannelType
  name: string
}

export type GuildChannel = {
  guild_id: string
  position: number
  parent_id: string | null
} & BasicChannel

export type TextChannel = BasicChannel & {
  last_message_id: string | null
  last_pin_timestamp: string | null
}

export type GuildTextChannel = TextChannel &
  GuildChannel & {
    permission_overwrites: PermissionOverwrite[]
    rate_limit_per_user: number
    topic: string | null
    nsfw: boolean
  }

export type VoiceChannel = GuildChannel & {
  bitrate: number
  user_limit: number
}

export type DMChannel = TextChannel & {
  recipients: User[]
}

export type GroupDMChannel = DMChannel & {
  owner_id: string
  icon: string | null
}

// todo: other channel types?
export type Channel =
  | GuildTextChannel
  | VoiceChannel
  | DMChannel
  | GroupDMChannel

export type Message = {
  id: string
  // todo
}

export type DataStore = {
  user: SelfUser
  users: Map<string, User>
  presences: Map<string, Presence>
  relations: Map<string, Relationship>
  guilds: Map<string, Guild>
  channels: Map<string, Channel>
  messages: Map<string, Message>
}

export type DataType = Exclude<keyof DataStore, 'user'>
