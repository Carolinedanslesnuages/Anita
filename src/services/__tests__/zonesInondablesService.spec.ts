import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContourGeoJson } from '@/lib/bassins'
import { chercherZonesInondablesDuBassin } from '../zonesInondablesService'

const contour: ContourGeoJson = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [[[-2, 47], [-1, 47], [-1, 48], [-2, 47]]] },
}

const surfaceFrequente = { type: 'Feature', properties: { scenario: '01For' }, geometry: { type: 'Polygon', coordinates: [] } }

describe('service des zones inondables', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('demande les trois niveaux de crue et accepte une page vide quand il n’y a aucune surface', async () => {
    const fetchSimule = vi
      .fn<(adresse: string) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [surfaceFrequente] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [] })))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchSimule)
    const zones = await chercherZonesInondablesDuBassin(contour)
    expect(fetchSimule).toHaveBeenCalledTimes(3)
    expect(zones.map((zone) => zone.niveau)).toEqual(['frequente'])
  })

  it('signale une panne du service', async () => {
    vi.stubGlobal('fetch', vi.fn<() => Promise<Response>>().mockResolvedValue(new Response('', { status: 503 })))
    await expect(chercherZonesInondablesDuBassin(contour)).rejects.toThrow('indisponible')
  })
})
