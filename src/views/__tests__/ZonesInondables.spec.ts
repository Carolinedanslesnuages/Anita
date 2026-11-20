import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { violationsAccessibilite } from '@/__tests__/accessibilite'

vi.mock('@/services/communesService', () => ({ chercherCommunes: vi.fn<() => Promise<never[]>>() }))
vi.mock('@/services/bassinsService', () => ({ chercherBassinAuPoint: vi.fn<() => Promise<null>>() }))
vi.mock('@/services/coursEauService', () => ({ chercherCoursEauDuBassin: vi.fn<() => Promise<never[]>>().mockResolvedValue([]) }))

const { default: CarteView } = await import('../CarteView.vue')

// La carte (WebGL) est remplacée : elle dit si les zones inondables sont demandées.
const CarteRemplacee = {
  props: ['zonesAffichees'],
  emits: ['choisirPoint'],
  template: '<div role="region" aria-label="Carte du bassin versant"><span id="zones-sur-la-carte">{{ zonesAffichees }}</span></div>',
}
const monter = () => mount(CarteView, { global: { stubs: { CarteBassin: CarteRemplacee } }, attachTo: document.body })

describe('Afficher les zones inondables', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('propose une case « Zones inondables », décochée au départ', () => {
    const wrapper = monter()
    expect(wrapper.find('label[for="afficher-zones-inondables"]').text()).toBe('Zones inondables')
    expect(wrapper.find<HTMLInputElement>('#afficher-zones-inondables').element.checked).toBe(false)
    expect(wrapper.find('#zones-sur-la-carte').text()).toBe('false')
    wrapper.unmount()
  })

  it('cocher affiche les zones sur la carte, décocher les masque', async () => {
    const wrapper = monter()
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    expect(wrapper.find('#zones-sur-la-carte').text()).toBe('true')
    await wrapper.find('#afficher-zones-inondables').setValue(false)
    expect(wrapper.find('#zones-sur-la-carte').text()).toBe('false')
    expect(wrapper.find('ul[aria-labelledby="titre-legende-zones"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('explique chaque couleur dans une légende en texte', async () => {
    const wrapper = monter()
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    const legende = wrapper.findAll('ul[aria-labelledby="titre-legende-zones"] li').map((ligne) => ligne.text())
    expect(legende).toEqual([
      'Crue fréquente : vert-gris foncé',
      'Crue moyenne : vert d’eau',
      'Crue de faible probabilité : vert très pâle',
    ])
    wrapper.unmount()
  })

  it('annonce l’affichage des zones', async () => {
    const wrapper = monter()
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    expect(wrapper.findAll('[role="status"]').map((message) => message.text())).toContain(
      'Zones inondables affichées sur la carte. Zoomez pour les voir en détail.',
    )
    wrapper.unmount()
  })

  it('aucune violation d’accessibilité automatique, case cochée avec la légende', async () => {
    const wrapper = monter()
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    expect(await violationsAccessibilite(document.body)).toEqual([])
    wrapper.unmount()
  })
})
