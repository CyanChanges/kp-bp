import { Context, Schema } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-console'
import { music } from "../shared";

export const name = 'youareanidiot'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = ctx.logger('you~are~a idiot~')
  ctx.inject(['console'], (ctx) => {
    ctx.console.addEntry(process.env.KOISHI_BASE ? [
      process.env.KOISHI_BASE + '/dist/index.js',
      process.env.KOISHI_BASE + '/dist/style.css',
    ] : process.env.KOISHI_ENV === 'browser' ? [
      // @ts-ignore
      import.meta.url.replace(/\/src\/[^/]+$/, '/client/index.ts'),
    ] : {
      dev: resolve(__dirname, '../../client/index.ts'),
      prod: resolve(__dirname, '../../dist'),
    })
  })
  logger.info('You are a idiot https://youareanidiot.cc/')
  logger.info('You are a idiot https://youareanidiot.cc/')
  logger.info('You are a idiot https://youareanidiot.cc/')
  music()
}
