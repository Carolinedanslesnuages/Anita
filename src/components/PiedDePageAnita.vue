<template>
  <footer class="pied">
    <div class="conteneur">
      <p class="pied__texte">Anita — Votre territoire, dessiné par l’eau.</p>
      <p class="pied__texte">Fond de carte © IGN – Géoplateforme.</p>
    </div>
  </footer>
</template>

<style scoped>
.pied {
  margin-top: 3rem;
  padding: 1.5rem 0;
  background: var(--couleur-fond-doux);
  border-top: 2px solid var(--couleur-bordure);
}
.pied__texte {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
}
</style>
