import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Bassin, ContourGeoJson, IdNiveau, Position } from '@/lib/bassins'
import type { CoursEau } from '@/lib/coursEau'
import { violationsAccessibilite } from '@/__tests__/accessibilite'

const { chercherBassinAuPoint, chercherCoursEauDuBassin } = vi.hoisted(() => ({
  chercherBassinAuPoint: vi.fn<(position: Position, niveau: IdNiveau) => Promise<Bassin | null>>(),
  chercherCoursEauDuBassin: vi.fn<(contour: ContourGeoJson) => Promise<CoursEau[]>>(),
}))
vi.mock('@/services/communesService', () => ({ chercherCommunes: vi.fn<() => Promise<never[]>>() }))
vi.mock('@/services/bassinsService', () => ({ chercherBassinAuPoint }))
vi.mock('@/services/coursEauService', () => ({ chercherCoursEauDuBassin }))

const { default: CarteView } = await import('../CarteView.vue')

const vilaine: Bassin = {
  code: 'J7',
  nom: 'La Vilaine',
  niveau: 'riviere',
  surfaceKm2: 3200,
  contour: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
}
const trace = (type: string, coordinates: unknown): ContourGeoJson => ({ type: 'Feature', properties: {}, geometry: { type, coordinates } })
const coursEauDuBassin: CoursEau[] = [
  { code: 'J7', nom: 'La Vilaine', longueurKm: 218, sens: 'vers le sud-ouest', trace: trace('LineString', [[0, 0], [1, 1]]) },
  { code: 'J72', nom: 'L’Ille', longueurKm: 12.5, sens: 'vers le nord', trace: trace('LineString', [[0, 0], [1, 1]]) },
]

// La carte (WebGL) est remplacée : elle reçoit les cours d'eau à tracer, qu'on lit ici.
const CarteRemplacee = {
  props: ['coursEau'],
  emits: ['choisirPoint'],
  template:
    '<div role="region" aria-label="Carte du bassin versant"><button type="button" id="clic-carte" @click="$emit(\'choisirPoint\', [-2, 48])">Cliquer sur la carte</button><span id="traces-sur-la-carte">{{ coursEau.length }}</span></div>',
}
const monter = () => mount(CarteView, { global: { stubs: { CarteBassin: CarteRemplacee } }, attachTo: document.body })

describe('Afficher le réseau des rivières, en amont et en aval', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    chercherBassinAuPoint.mockReset().mockResolvedValue(vilaine)
    chercherCoursEauDuBassin.mockReset().mockResolvedValue(coursEauDuBassin)
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  async function afficherUnBassin(wrapper: ReturnType<typeof monter>) {
    await wrapper.find('#clic-carte').trigger('click')
    await flushPromises()
  }

  it('propose une case à cocher « Rivières et affluents », décochée au départ', () => {
    const wrapper = monter()
    expect(wrapper.find('label[for="afficher-cours-eau"]').text()).toBe('Rivières et affluents')
    expect(wrapper.find<HTMLInputElement>('#afficher-cours-eau').element.checked).toBe(false)
    expect(chercherCoursEauDuBassin).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cocher affiche les cours d’eau sur la carte, décocher les masque', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-cours-eau').setValue(true)
    await flushPromises()
    expect(chercherCoursEauDuBassin).toHaveBeenCalledWith(vilaine.contour)
    expect(wrapper.find('#traces-sur-la-carte').text()).toBe('2')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('2 cours d’eau affichés.')
    await wrapper.find('#afficher-cours-eau').setValue(false)
    await flushPromises()
    expect(wrapper.find('#traces-sur-la-carte').text()).toBe('0')
    expect(wrapper.find('ul[aria-labelledby="titre-liste-cours-eau"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('liste les noms des cours d’eau principaux en texte, avec leur sens d’écoulement', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-cours-eau').setValue(true)
    await flushPromises()
    const lignes = wrapper.findAll('ul[aria-labelledby="titre-liste-cours-eau"] li').map((ligne) => ligne.text())
    expect(lignes).toHaveLength(2)
    expect(lignes[0]).toContain('La Vilaine')
    expect(lignes[0]).toContain('de l’amont vers l’aval, vers le sud-ouest')
    expect(lignes[1]).toContain('L’Ille')
    expect(lignes[1]).toContain('vers le nord')
    wrapper.unmount()
  })

  it('demande d’abord un bassin quand aucun n’est affiché', async () => {
    const wrapper = monter()
    await wrapper.find('#afficher-cours-eau').setValue(true)
    await flushPromises()
    expect(wrapper.text()).toContain('Choisissez d’abord un bassin versant')
    expect(chercherCoursEauDuBassin).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('dit clairement quand le service des cours d’eau est indisponible', async () => {
    chercherCoursEauDuBassin.mockRejectedValueOnce(new Error('panne'))
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-cours-eau').setValue(true)
    await flushPromises()
    expect(wrapper.text()).toContain('Le service des cours d’eau ne répond pas')
    wrapper.unmount()
  })

  it('aucune violation d’accessibilité automatique, case cochée avec la liste', async () => {
    const wrapper = monter()
    await afficherUnBassin(wrapper)
    await wrapper.find('#afficher-cours-eau').setValue(true)
    await flushPromises()
    expect(await violationsAccessibilite(document.body)).toEqual([])
    wrapper.unmount()
  })
})
