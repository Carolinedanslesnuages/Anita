import type { NiveauCrue } from '@/lib/zonesInondables'

/** Couleur des motifs : foncée, pour rester lisible sur le fond de carte. Le motif, lui, distingue les niveaux. */
const COULEUR_MOTIF = '#ffffff'
const TAILLE = 16

export function nomImageMotif(niveau: NiveauCrue['id']): string {
  return `motif-crue-${niveau}`
}

/** Dessine le motif d'un niveau de crue : hachures, points ou quadrillage, sur fond transparent. */
export function dessinerMotif(motif: NiveauCrue['motif']): ImageData {
  const toile = document.createElement('canvas')
  toile.width = TAILLE
  toile.height = TAILLE
  const contexte = toile.getContext('2d')
  if (!contexte) return new ImageData(TAILLE, TAILLE)
  contexte.strokeStyle = COULEUR_MOTIF
  contexte.fillStyle = COULEUR_MOTIF
  contexte.lineWidth = 3
  if (motif === 'hachures') {
    for (const decalage of [-TAILLE, 0, TAILLE]) {
      contexte.moveTo(decalage, TAILLE)
      contexte.lineTo(decalage + TAILLE, 0)
    }
    contexte.stroke()
  } else if (motif === 'points') {
    contexte.arc(TAILLE / 2, TAILLE / 2, 4.5, 0, Math.PI * 2)
    contexte.fill()
  } else {
    contexte.moveTo(0, 1)
    contexte.lineTo(TAILLE, 1)
    contexte.moveTo(1, 0)
    contexte.lineTo(1, TAILLE)
    contexte.stroke()
  }
  return contexte.getImageData(0, 0, TAILLE, TAILLE)
}
