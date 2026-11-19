import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VueDsfr from '@gouvminint/vue-dsfr'
import type { Bassin, Commune, IdNiveau, Position } from '@/lib/bassins'
import { violationsAccessibilite } from '@/__tests__/accessibilite'

const { chercherCommunes, chercherBassinAuPoint } = vi.hoisted(() => ({
  chercherCommunes: vi.fn<(nom: string) => Promise<Commune[]>>(),
  chercherBassinAuPoint: vi.fn<(position: Position, niveau: IdNiveau) => Promise<Bassin | null>>(),
}))
vi.mock('@/services/communesService', () => ({ chercherCommunes }))
vi.mock('@/services/bassinsService', () => ({ chercherBassinAuPoint }))

const { default: CarteView } = await import('../CarteView.vue')
const { useBassinStore } = await import('@/stores/bassin')

const rennes: Commune = { code: '35238', nom: 'Rennes', departement: 'Ille-et-Vilaine', centre: [-1.6884, 48.1159] }
const vilaine: Bassin = {
  code: 'J7',
  nom: 'La vilaine de sa source au canal de Nantes à Brest',
  niveau: 'riviere',
  surfaceKm2: 3200.4,
  contour: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
}

// La carte (WebGL) est remplacée : elle est vérifiée dans le navigateur ; ici, le texte et le formulaire.
const CarteRemplacee = {
  emits: ['choisirPoint'],
  template: '<div role="region" aria-label="Carte du bassin versant"><button type="button" id="clic-carte" @click="$emit(\'choisirPoint\', [-2, 48])">Cliquer sur la carte</button></div>',
}
const monter = () =>
  mount(CarteView, {
    global: { plugins: [VueDsfr], stubs: { CarteBassin: CarteRemplacee } },
    attachTo: document.body,
  })

describe('Trouver sa commune et voir son bassin versant', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    chercherCommunes.mockReset().mockResolvedValue([rennes])
    chercherBassinAuPoint.mockReset().mockResolvedValue(vilaine)
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  async function chercherRennes(wrapper: ReturnType<typeof monter>) {
    await wrapper.find('#recherche-commune').setValue('Renn')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('propose des communes quand je tape un nom, au clavier (champ + bouton)', async () => {
    const wrapper = monter()
    expect(wrapper.find('label[for="recherche-commune"]').text()).toContain('Nom de votre commune')
    await chercherRennes(wrapper)
    expect(chercherCommunes).toHaveBeenCalledWith('Renn')
    expect(wrapper.find('[role="status"]').text()).toBe('1 commune proposée.')
    expect(wrapper.find('ul[aria-label="Communes proposées"]').text()).toContain('Rennes (Ille-et-Vilaine)')
    wrapper.unmount()
  })

  it('choisir une suggestion cherche le bassin du centre de la commune et l’écrit à côté de la carte', async () => {
    const wrapper = monter()
    await chercherRennes(wrapper)
    await wrapper.find('ul[aria-label="Communes proposées"] button').trigger('click')
    await flushPromises()
    expect(useBassinStore().point).toEqual([-1.6884, 48.1159])
    expect(chercherBassinAuPoint).toHaveBeenCalledWith([-1.6884, 48.1159], 'riviere')
    const texte = wrapper.find('section[aria-labelledby="titre-infos-bassin"]').text()
    expect(texte).toContain('La vilaine de sa source au canal de Nantes à Brest')
    expect(texte).toMatch(/3\s200 km²/)
    expect(texte).toContain('Commune Rennes')
    wrapper.unmount()
  })

  it('cliquer sur la carte choisit un point et affiche son bassin', async () => {
    const wrapper = monter()
    await wrapper.find('#clic-carte').trigger('click')
    await flushPromises()
    expect(chercherBassinAuPoint).toHaveBeenCalledWith([-2, 48], 'riviere')
    expect(wrapper.find('section[aria-labelledby="titre-infos-bassin"]').text()).toContain('Point de la carte')
    wrapper.unmount()
  })

  it('permet de changer de niveau de bassin avec des boutons radio', async () => {
    const wrapper = monter()
    await wrapper.find('#clic-carte').trigger('click')
    await flushPromises()
    expect(wrapper.find<HTMLInputElement>('#niveau-riviere').element.checked).toBe(true)
    await wrapper.find('#niveau-local').trigger('click')
    await flushPromises()
    expect(chercherBassinAuPoint).toHaveBeenLastCalledWith([-2, 48], 'local')
    wrapper.unmount()
  })

  it('dit clairement quand aucune commune ne correspond', async () => {
    chercherCommunes.mockResolvedValue([])
    const wrapper = monter()
    await chercherRennes(wrapper)
    expect(wrapper.find('[role="status"]').text()).toBe('Aucune commune ne correspond à ce nom.')
    wrapper.unmount()
  })

  it('dit clairement quand le service des bassins est indisponible ou sans bassin', async () => {
    chercherBassinAuPoint.mockRejectedValueOnce(new Error('panne'))
    const wrapper = monter()
    await wrapper.find('#clic-carte').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Le service des bassins versants ne répond pas')
    chercherBassinAuPoint.mockResolvedValueOnce(null)
    await wrapper.find('#clic-carte').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Aucun bassin versant n’est connu à cet endroit')
    wrapper.unmount()
  })

  it('aucune violation d’accessibilité automatique, avec un bassin affiché', async () => {
    const wrapper = monter()
    expect(await violationsAccessibilite(document.body)).toEqual([])
    await chercherRennes(wrapper)
    await wrapper.find('ul[aria-label="Communes proposées"] button').trigger('click')
    await flushPromises()
    expect(await violationsAccessibilite(document.body)).toEqual([])
    wrapper.unmount()
  })
})
