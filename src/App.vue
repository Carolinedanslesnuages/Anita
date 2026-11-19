<script setup lang="ts">
import { RouterView } from 'vue-router'
import EnTeteAnita from '@/components/EnTeteAnita.vue'
import PiedDePageAnita from '@/components/PiedDePageAnita.vue'
</script>

<template>
  <a class="lien-evitement" href="#contenu">Aller au contenu</a>
  <EnTeteAnita />
  <main id="contenu" class="conteneur contenu-principal">
    <RouterView />
  </main>
  <PiedDePageAnita />
</template>

<style scoped>
.contenu-principal {
  padding-top: 1.5rem;
}
</style>
