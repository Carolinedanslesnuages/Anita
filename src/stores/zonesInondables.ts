import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

/** Afficher ou masquer les zones inondables : partagé par la carte et le texte. */
export const useZonesInondablesStore = defineStore('zonesInondables', () => {
  const affichees = ref(false)

  function basculer(valeur: boolean): void {
    affichees.value = valeur
  }

  return { affichees, basculer }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useZonesInondablesStore, import.meta.hot))
