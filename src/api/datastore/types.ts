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

export enum PresenceType { ONLINE, IDLE, DND, OFFLINE }

export enum RelationshipType { NONE, FRIEND, BLOCK }

export interface User {
  id: string
  username: string
  discriminator: string
  avatar: string | null
}

export interface SelfUser extends User {
  settings: {
    locale: string
    theme: string
  }
}

export interface Presence {
  id: string
  // todo
}

export interface Relationship {
  id: string
  of: number
  userId: number
  type: RelationshipType
}

export interface Guild {
  id: string
  // todo
}

export interface BasicChannel {
  id: string
  // todo
}

export interface TextChannel extends BasicChannel {
  id: string
  // todo
}

export interface VoiceChannel extends BasicChannel {
  id: string
  // todo
}

export interface DMChannel extends BasicChannel {
  id: string
  // todo
}

// todo: other channel types?
export type Channel = TextChannel | VoiceChannel | DMChannel

export interface Message {
  id: string
  // todo
}

export interface DataStore {
  user: User
  users: Map<string, User>
  presences: Map<string, Presence>
  relations: Map<string, Relationship>
  guilds: Map<string, Guild>
  channels: Map<string, Channel>
  messages: Map<string, Message>
}

export type DataType = Exclude<keyof DataStore, 'user'>
