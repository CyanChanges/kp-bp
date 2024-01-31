import { Context } from '@koishijs/client'
import Page from './result.vue'

export default (ctx: Context) => {
  ctx.page({
    name: '扩展页面',
    path: '/custom-page',
    component: Page,
    order: 900
  })
  console.log('hello')
}
