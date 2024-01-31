<script setup lang="ts">
import {store} from '@koishijs/client'

const konProb = store['env.kon'].probability
const isKON = store['env.kon'].isKON

</script>

<template>
  <k-layout>
    <h2>Koishi Online 检测</h2>
    当前环境{{ isKON ? '是' : '不是' }} Koishi Online ({{konProb}})
  </k-layout>
</template>

