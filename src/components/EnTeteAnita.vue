<script setup lang="ts">
import { RouterLink } from 'vue-router'

/** Barre du haut : nom du service, devise et navigation principale. */
</script>

<template>
  <header class="entete">
    <div class="conteneur entete__contenu">
      <p class="entete__nom">
        <RouterLink to="/" class="entete__lien-accueil">Anita</RouterLink>
        <span class="entete__devise">Votre territoire, dessiné par l’eau</span>
      </p>
      <nav aria-label="Navigation principale">
        <ul class="entete__menu">
          <li><RouterLink to="/" class="entete__lien">Ma carte</RouterLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.entete {
  background: var(--couleur-eau-fonce);
  color: #ffffff;
}
.entete__contenu {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.entete__nom {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.75rem;
}
.entete__lien-accueil {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
}
.entete__devise {
  font-size: 0.9375rem;
}
.entete__menu {
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.entete__lien {
  color: #ffffff;
  font-weight: 600;
}
</style>
