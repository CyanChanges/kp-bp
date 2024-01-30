import { Context, Schema } from 'koishi'
import { resolve } from 'path'
import Providers from "./result";
import Checker from "./checker";

export const name = 'is-kon'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.inject(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../../client/index.ts'),
      prod: resolve(__dirname, '../../dist'),
    })
  })

  ctx.plugin(Checker)
  ctx.plugin(Providers)

}
