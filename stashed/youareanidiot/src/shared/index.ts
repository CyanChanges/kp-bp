import play from 'audio-play'
import asBuffer from 'audio-loader'
import {resolve} from 'path'

export function music() {
  return asBuffer(
    // @ts-ignore
    resolve(__dirname ?? import.meta.url, './youare.mp3')
  )
    .then(buffer => {
      (play as any)(buffer)
    })
}

