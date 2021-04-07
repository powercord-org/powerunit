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
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdir, readdir } from 'fs/promises'
import { spawn } from 'child_process'
import puppeteer from 'puppeteer-core'
import { sleep } from '@util/misc'

export interface DiscordInstance {
  tmpFolder: string | null
  process: ChildProcessWithoutNullStreams
  browser: Browser
  page: Page
}

function filterEnv (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const res: NodeJS.ProcessEnv = {}
  for (const key in env) {
    if (!key.startsWith('POWERUNIT_') && Object.prototype.hasOwnProperty.call(env, key)) {
      res[key] = env[key]
    }
  }
  return res
}

async function findDiscord (): Promise<string | null> {
  let path = null

  if (process.platform === 'win32') {
    // get discord canary path
    const discordPath = join(process.env.LOCALAPPDATA!, 'DiscordCanary')

    const discordDirectory = await readdir(discordPath)
    // get the current build folder
    const currentBuild = discordDirectory
      .filter((appPath) => appPath.startsWith('app-'))
      .reverse()[0]

    // append discord canary Executable path
    path = join(discordPath, currentBuild, 'DiscordCanary')
  } else if (process.platform === 'linux') {
    path = '/opt/discord-canary/DiscordCanary'
  }
  return path
}

async function getDevToolsEndpoint (childProcess: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve) => {
    function processStdout (line: string): void {
      line = line.trim()
      if (line.startsWith('DevTools listening on')) {
        childProcess.stderr.off('data', processStdout)
        resolve(line.slice(22))
      }
    }

    // The devtools listening thing is sent to stderr
    childProcess.stderr.setEncoding('utf8')
    childProcess.stderr.on('data', processStdout)
  })
}

async function getMainWindow (browser: Browser): Promise<Page> {
  // If the page is loaded remotely, we can assume it's discord's main window.
  let discordPage = null
  do {
    const pages = await browser.pages()
    discordPage = pages.find((p) => p.url().startsWith('https:'))
    if (!discordPage) await sleep(10)
  } while (!discordPage)

  return discordPage
}

export default async function (apiPort: number): Promise<Readonly<DiscordInstance>> {
  const discordExecutable = await findDiscord()
  if (!discordExecutable) throw new Error('Cannot find Discord.')

  const envKey = process.platform === 'win32' ? 'APPDATA' : 'XDG_CONFIG_HOME'
  let tmpFolder = null
  if (!process.env.POWERUNIT_USER_DIR) {
    tmpFolder = join(tmpdir(), `powerunit-${Math.random().toString(36).slice(2)}`)
    await mkdir(tmpFolder)
  }

  // fixme: flags not applied after restart (modules update)
  const discordProcess = spawn(
    discordExecutable,
    [
      '--multi-instance', // Let Discord know we want multiple instances to run on the host computer
      `--remote-debugging-port=${Math.floor((Math.random() * 20000) + 10000)}`, // Enable Chrome DevTools remote controller for puppeteer
      `--host-rules=MAP *.discord.gg 127.0.0.1:${apiPort}`, // Mock DNS resolution - https://github.com/puppeteer/puppeteer/issues/2974
      '--ignore-certificate-errors', // Self-signed certs memes
    ],
    {
      env: {
        ...filterEnv(process.env),
        [envKey]: process.env.POWERUNIT_USER_DIR ?? tmpFolder!, // this cannot be null, but typescript doesn't know
        POWERUNIT: 'true',
      },
    }
  )

  const endpoint = await getDevToolsEndpoint(discordProcess)
  const browser = await puppeteer.connect({ browserWSEndpoint: endpoint, defaultViewport: null })
  const page = await getMainWindow(browser)

  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const requestUrl = new URL(request.url())
    if (/^https:\/\/([a-z]+\.)?discord(?:app)?\.com\/api/.test(request.url())) {
      requestUrl.hostname = 'discord.localhost'
      requestUrl.port = String(apiPort)
    }

    request.continue({ url: requestUrl.href })
  })

  const viewPort = process.env.POWERUNIT_VIEWPORT
  if (viewPort !== 'null') {
    let width = 1280
    let height = 720
    if (viewPort) {
      const result = viewPort.match(/^(\d+)x(\d+)$/)

      if (!result) {
        throw new Error('Environment variable "POWERUNIT_VIEWPORT" must be in format "{width}x{height}" or "null".')
      }

      const [ , widthStr, heightStr ] = result
      width = Number(widthStr)
      height = Number(heightStr)

      // Prevent viewport width & height from underflowing Discord's client minimum width & height
      if (width < 940 || height < 475) {
        throw new Error(`Viewport is set to "${viewPort}" but must at least be "940x475".`)
      }
    }

    await page.setViewport({ width: width, height: height })
  }

  return {
    tmpFolder: tmpFolder,
    process: discordProcess,
    browser: browser,
    page: page,
  }
}
