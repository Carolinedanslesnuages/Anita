import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Bassin, ContourGeoJson, IdNiveau, Position } from '@/lib/bassins'
import type { ZoneInondable } from '@/lib/zonesInondables'
import { violationsAccessibilite } from '@/__tests__/accessibilite'

const { chercherBassinAuPoint, chercherZonesInondablesDuBassin } = vi.hoisted(() => ({
  chercherBassinAuPoint: vi.fn<(position: Position, niveau: IdNiveau) => Promise<Bassin | null>>(),
  chercherZonesInondablesDuBassin: vi.fn<(contour: ContourGeoJson) => Promise<ZoneInondable[]>>(),
}))
vi.mock('@/services/communesService', () => ({ chercherCommunes: vi.fn<() => Promise<never[]>>() }))
vi.mock('@/services/bassinsService', () => ({ chercherBassinAuPoint }))
vi.mock('@/services/zonesInondablesService', () => ({ chercherZonesInondablesDuBassin }))
vi.mock('@/services/coursEauService', () => ({ chercherCoursEauDuBassin: vi.fn<() => Promise<never[]>>().mockResolvedValue([]) }))

const { default: CarteView } = await import('../CarteView.vue')

const vilaine: Bassin = {
  code: 'J7',
  nom: 'La Vilaine',
  niveau: 'riviere',
  surfaceKm2: 3200,
  contour: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
}
const trace: ContourGeoJson = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } }
const zonesDuBassin: ZoneInondable[] = [
  { niveau: 'frequente', communes: ['Rennes'], trace },
  { niveau: 'moyenne', communes: ['Pacé', 'Rennes'], trace },
  { niveau: 'forte', communes: ['Vern-sur-Seiche'], trace },
]

// La carte (WebGL) est remplacée : elle reçoit les zones à tracer, qu'on lit ici.
const CarteRemplacee = {
  props: ['zonesInondables'],
  emits: ['choisirPoint'],
  template:
    '<div role="region" aria-label="Carte du bassin versant"><button type="button" id="clic-carte" @click="$emit(\'choisirPoint\', [-2, 48])">Cliquer sur la carte</button><span id="zones-sur-la-carte">{{ zonesInondables.length }}</span></div>',
}
const monter = () => mount(CarteView, { global: { stubs: { CarteBassin: CarteRemplacee } }, attachTo: document.body })

describe('Afficher les zones inondables', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    chercherBassinAuPoint.mockReset().mockResolvedValue(vilaine)
    chercherZonesInondablesDuBassin.mockReset().mockResolvedValue(zonesDuBassin)
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  async function afficherUnBassin(wrapper: ReturnType<typeof monter>) {
    await wrapper.find('#clic-carte').trigger('click')
    await flushPromises()
  }

  it('propose une case « Zones inondables », décochée au départ', () => {
    const wrapper = monter()
    expect(wrapper.find('label[for="afficher-zones-inondables"]').text()).toBe('Zones inondables')
    expect(wrapper.find<HTMLInputElement>('#afficher-zones-inondables').element.checked).toBe(false)
    expect(chercherZonesInondablesDuBassin).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cocher affiche les zones sur la carte, décocher les masque, et seul le bassin choisi est demandé', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    await flushPromises()
    expect(chercherZonesInondablesDuBassin).toHaveBeenCalledWith(vilaine.contour)
    expect(wrapper.find('#zones-sur-la-carte').text()).toBe('3')
    await wrapper.find('#afficher-zones-inondables').setValue(false)
    await flushPromises()
    expect(wrapper.find('#zones-sur-la-carte').text()).toBe('0')
    expect(wrapper.find('ul[aria-labelledby="titre-communes-zones"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('explique chaque motif dans une légende en texte', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    await flushPromises()
    const legende = wrapper.findAll('ul[aria-labelledby="titre-legende-zones"] li').map((ligne) => ligne.text())
    expect(legende).toEqual([
      'Crue fréquente : hachures obliques',
      'Crue moyenne : points',
      'Crue forte (probabilité faible) : quadrillage',
    ])
    wrapper.unmount()
  })

  it('liste en texte les communes concernées et le niveau de crue', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    await flushPromises()
    const lignes = wrapper.findAll('ul[aria-labelledby="titre-communes-zones"] li').map((ligne) => ligne.text())
    expect(lignes).toHaveLength(3)
    expect(lignes[0]).toContain('Crue fréquente')
    expect(lignes[0]).toContain('Rennes')
    expect(lignes[1]).toContain('Pacé, Rennes')
    expect(lignes[2]).toContain('Vern-sur-Seiche')
    wrapper.unmount()
  })

  it('demande d’abord un bassin quand aucun n’est affiché', async () => {
    const wrapper = monter()
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    await flushPromises()
    expect(wrapper.text()).toContain('Choisissez d’abord un bassin versant pour voir ses zones inondables')
    expect(chercherZonesInondablesDuBassin).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('dit clairement quand Géorisques ne répond pas', async () => {
    chercherZonesInondablesDuBassin.mockRejectedValueOnce(new Error('panne'))
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    await flushPromises()
    expect(wrapper.text()).toContain('Le service des zones inondables ne répond pas')
    expect(wrapper.find('#zones-sur-la-carte').text()).toBe('0')
    wrapper.unmount()
  })

  it('aucune violation d’accessibilité automatique, case cochée avec la liste', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-zones-inondables').setValue(true)
    await flushPromises()
    expect(await violationsAccessibilite(document.body)).toEqual([])
    wrapper.unmount()
  })
})
