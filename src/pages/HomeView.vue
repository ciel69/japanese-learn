<script setup lang="ts">
const optionsMenu = [
  {
    url: '/draw',
    label: 'Иероглифы',
  },
  {
    url: '/grammar',
    label: 'Грамматика',
  },
]
</script>

<template>
  <main>
    <ul>
      <li v-for="(option, index) in optionsMenu" :key="index" class="text-center">
        <router-link :to="option.url">{{ option.label }}</router-link>
      </li>
    </ul>
  </main>
</template>
