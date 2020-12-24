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

import type { ChildProcessWithoutNullStreams } from 'child_process'
import type { Browser, Page } from 'puppeteer-core'

import { URL } from 'url' // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/34960
import { spawn } from 'child_process'
import puppeteer from 'puppeteer-core'
import { sleep } from '@util'

export interface DiscordInstance {
  process: ChildProcessWithoutNullStreams
  browser: Browser
  page: Page
}

async function findDiscord (): Promise<string> {
  // todo
  return '/opt/discord-canary/DiscordCanary'
}

async function getDevToolsEndpoint (childProcess: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve) => {
    function processStdout (line: string) {
      line = line.trim()
      if (line.startsWith('DevTools listening on')) {
        childProcess.stderr.off('data', processStdout)
        resolve(line.slice(22))
      }
    }

    // The devtools listening thing is sent to stderr
    childProcess.stderr.setEncoding('utf8');
    childProcess.stderr.on('data', processStdout);
  })
}

async function getMainWindow (browser: Browser): Promise<Page> {
  // If the page is loaded remotely, we can assume it's discord's main window.
  let discordPage = null
  do {
    const pages = await browser.pages()
    discordPage = pages.find(p => p.url().startsWith('https:'))
    if (!discordPage) await sleep(10)
  } while (!discordPage);

  return discordPage
}

export default async function (apiPort: number): Promise<DiscordInstance> {
  const discordExecutable = await findDiscord()
  if (!discordExecutable) throw new Error('Cannot find Discord')

  const PORT = Math.floor((Math.random() * 20000) + 10000)
  const discordProcess = spawn(discordExecutable, [ '--multi-instance', `--remote-debugging-port=${PORT}` ])

  const endpoint = await getDevToolsEndpoint(discordProcess)
  const browser = await puppeteer.connect({ browserWSEndpoint: endpoint, defaultViewport: null });
  const page = await getMainWindow(browser)

  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (/^https:\/\/([a-z]+\.)?discord\.com\/api/.test(request.url())) {
      const requestUrl = new URL(request.url())
      requestUrl.protocol = 'http:'
      requestUrl.hostname = 'discord.localhost'
      requestUrl.port = String(apiPort)
      console.log('api', requestUrl.href)
    }

    if (/^https:\/\/gateway\.discord\.gg/.test(request.url())) {
      console.log('gateway', request.url())
    }

    if (/^https:\/\/remote-auth-gateway\.discord\.gg/.test(request.url())) {
      console.log('RAG', request.url())
    }

    // match gateway
    // match RA
    request.continue()
  })

  await page.setViewport({ width: 1280, height: 720 })

  return {
    process: discordProcess,
    browser: browser,
    page: page
  }
}
