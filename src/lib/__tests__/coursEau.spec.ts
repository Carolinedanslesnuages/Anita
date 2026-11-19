import { describe, it, expect } from 'vitest'
import { adresseCoursEau, formaterLongueur, limitesDuContour, lireCoursEau, sensEcoulement } from '../coursEau'

const VERS_LE_SUD_EST = { type: 'LineString', coordinates: [[0, 1], [0.5, 0.5], [1, 0]] }
const VERS_LE_NORD = { type: 'LineString', coordinates: [[0, 0], [0, 1]] }

function troncon(nom: string | null, code: string, geometry: { type: string; coordinates: unknown }) {
  return { type: 'Feature', properties: { NomEntiteHydrographique: nom, CdEntiteHydrographique: code }, geometry }
}

describe('cours d’eau d’un bassin', () => {
  it('demande la couche des cours d’eau sur les limites du bassin', () => {
    const adresse = adresseCoursEau([-2, 48, -1, 49])
    expect(adresse).toContain('TYPENAMES=sa%3ACoursEau_FXX')
    expect(adresse).toContain('48%2C-2%2C49%2C-1')
  })

  it('trouve les limites d’un contour', () => {
    const contour = { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 1], [4, 1], [4, 5], [0, 1]]] } }
    expect(limitesDuContour(contour)).toEqual([0, 1, 4, 5])
    expect(limitesDuContour({ ...contour, geometry: { type: 'Polygon', coordinates: [] } })).toBeNull()
  })

  it('écrit le sens d’écoulement en texte, de l’amont vers l’aval', () => {
    expect(sensEcoulement(VERS_LE_SUD_EST)).toBe('vers le sud-est')
    expect(sensEcoulement(VERS_LE_NORD)).toBe('vers le nord')
    expect(sensEcoulement({ type: 'Point', coordinates: [0, 0] })).toBe('sens inconnu')
  })

  it('garde les cours d’eau nommés, les plus longs d’abord, et regroupe les tronçons', () => {
    const reponse = {
      features: [
        troncon('la petite', 'A', VERS_LE_NORD),
        troncon(null, 'B', VERS_LE_NORD),
        troncon('LA GRANDE', 'C', VERS_LE_SUD_EST),
        troncon('LA GRANDE', 'C', VERS_LE_SUD_EST),
      ],
    }
    const coursEau = lireCoursEau(reponse)
    expect(coursEau.map((cours) => cours.nom)).toEqual(['La grande', 'La petite'])
    expect(coursEau[0]?.longueurKm).toBeGreaterThan(2 * (coursEau[1]?.longueurKm ?? 0) * 0.9)
    expect(coursEau[0]?.sens).toBe('vers le sud-est')
  })

  it('limite le nombre de cours d’eau et accepte une réponse inattendue', () => {
    const reponse = { features: [1, 2, 3].map((numero) => troncon(`rivière ${numero}`, String(numero), VERS_LE_NORD)) }
    expect(lireCoursEau(reponse, 2)).toHaveLength(2)
    expect(lireCoursEau(null)).toEqual([])
    expect(lireCoursEau({ features: [{ properties: {}, geometry: null }] })).toEqual([])
  })

  it('met en forme les longueurs', () => {
    expect(formaterLongueur(3.44)).toBe('3,4 km')
    expect(formaterLongueur(123.4)).toBe('123 km')
  })
})
