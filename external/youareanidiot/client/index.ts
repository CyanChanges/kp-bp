import { Context, icons } from '@koishijs/client'
import * as music from "koishi-plugin-youareanidiot/shared";
import Page from './page.vue'
import Smile from './smile.vue'

export default (ctx: Context) => {
  icons.register('smile', Smile)
  ctx.page({
    name: 'You are an idiot',
    path: '/uraidt',
    component: Page,
    icon: 'smile'
  })
  music.music()
}
