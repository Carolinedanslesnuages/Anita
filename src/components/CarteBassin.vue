<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import type { Map as CarteMapLibre, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// Le worker de MapLibre, construit par Vite (sinon introuvable une fois le site construit).
import adresseWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { Bassin, ContourSet, Position } from '@/lib/bassins'
import type { CoursEau, Limites } from '@/lib/coursEau'
import { ADRESSE_TUILES_ZONES_INONDABLES, NIVEAUX_CRUE, ZOOM_MINIMUM_ZONES_INONDABLES, type ZoneInondable } from '@/lib/zonesInondables'
import { dessinerMotif, nomImageMotif } from '@/components/motifsZonesInondables'

/**
 * Carte MapLibre, fond « Plan IGN » de la Géoplateforme (data.geopf.fr), avec le contour du bassin
 * et son nom écrit sur la carte. Le texte à côté de la carte (InfosBassin) reste l'alternative accessible.
 */
const props = defineProps<{ point: Position | null; bassin: Bassin | null; coursEau: CoursEau[]; zonesInondables: ZoneInondable[]; zonesAffichees: boolean }>()
const emit = defineEmits<{ choisirPoint: [position: Position]; changerZoneVisible: [limites: Limites, zoom: number] }>()

const conteneur = useTemplateRef<HTMLDivElement>('conteneur')
let carte: CarteMapLibre | null = null
let marqueur: Marker | null = null
let etiquette: Popup | null = null
let maplibre: typeof import('maplibre-gl') | null = null

const FOND_PLAN_IGN =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' +
  '&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png'
const SOURCE_CONTOUR = 'contour-bassin'
const SOURCE_COURS_EAU = 'cours-eau'
const SOURCE_ZONES_INONDABLES = 'zones-inondables'
const SOURCE_ZONES_DE_LOIN = 'zones-inondables-de-loin'
const IMAGE_FLECHE = 'fleche-ecoulement'
const CONTOURS_VIDES: ContourSet = { type: 'FeatureCollection', features: [] }

/** Une flèche blanche cernée de bleu foncé, qui pointe vers la droite : MapLibre la tourne dans le sens du tracé (amont → aval). */
function dessinerFleche(): ImageData {
  const taille = 24
  const toile = document.createElement('canvas')
  toile.width = taille
  toile.height = taille
  const contexte = toile.getContext('2d')
  if (!contexte) return new ImageData(taille, taille)
  contexte.beginPath()
  contexte.moveTo(4, 4)
  contexte.lineTo(21, 12)
  contexte.lineTo(4, 20)
  contexte.lineTo(8, 12)
  contexte.closePath()
  contexte.fillStyle = '#ffffff'
  contexte.strokeStyle = '#00205b'
  contexte.lineWidth = 2
  contexte.stroke()
  contexte.fill()
  return contexte.getImageData(0, 0, taille, taille)
}

function afficherCoursEau(): void {
  if (!carte) return
  const source = carte.getSource(SOURCE_COURS_EAU) as { setData: (donnees: ContourSet) => void } | undefined
  source?.setData({ type: 'FeatureCollection', features: props.coursEau.map((cours) => cours.trace) })
}

function afficherZonesInondables(): void {
  if (!carte) return
  if (carte.getLayer('zones-inondables-de-loin')) {
    carte.setLayoutProperty('zones-inondables-de-loin', 'visibility', props.zonesAffichees ? 'visible' : 'none')
  }
  const source = carte.getSource(SOURCE_ZONES_INONDABLES) as { setData: (donnees: ContourSet) => void } | undefined
  source?.setData({ type: 'FeatureCollection', features: props.zonesInondables.map((zone) => zone.trace) })
}

/** Étend les limites avec toutes les coordonnées d'un contour. */
function etendreLimites(limites: InstanceType<typeof import('maplibre-gl').LngLatBounds>, coordonnees: unknown): void {
  if (Array.isArray(coordonnees) && typeof coordonnees[0] === 'number') {
    limites.extend(coordonnees as [number, number])
  } else if (Array.isArray(coordonnees)) {
    coordonnees.forEach((element) => etendreLimites(limites, element))
  }
}

function afficherPoint(): void {
  if (!carte || !maplibre) return
  marqueur?.remove()
  marqueur = null
  if (!props.point) return
  marqueur = new maplibre.Marker({ color: '#000091' }).setLngLat(props.point).addTo(carte)
  marqueur.getElement().setAttribute('aria-label', 'Point choisi')
}

function afficherBassin(): void {
  if (!carte || !maplibre) return
  const source = carte.getSource(SOURCE_CONTOUR) as { setData: (donnees: ContourSet) => void } | undefined
  etiquette?.remove()
  etiquette = null
  if (!props.bassin) {
    source?.setData(CONTOURS_VIDES)
    return
  }
  source?.setData({ type: 'FeatureCollection', features: [props.bassin.contour] })
  const limites = new maplibre.LngLatBounds()
  etendreLimites(limites, (props.bassin.contour.geometry as { coordinates?: unknown }).coordinates)
  carte.fitBounds(limites, { padding: 40, maxZoom: 13, duration: 0 })
  // Le nom du bassin est écrit sur la carte, au point choisi (en texte, pas seulement en couleur).
  if (props.point) {
    etiquette = new maplibre.Popup({ closeButton: false, closeOnClick: false, offset: 28 })
      .setLngLat(props.point)
      .setText(`Bassin : ${props.bassin.nom}`)
      .addTo(carte)
  }
}

/** Dit quelle partie de la carte est visible, pour ne demander que les zones inondables de cette partie. */
function annoncerZoneVisible(): void {
  if (!carte) return
  const limites = carte.getBounds()
  emit('changerZoneVisible', [limites.getWest(), limites.getSouth(), limites.getEast(), limites.getNorth()], carte.getZoom())
}

function centrerSurPoint(): void {
  if (carte && props.point && !props.bassin) carte.flyTo({ center: props.point, zoom: 12, essential: false })
}

function choisirCentreDeLaCarte(): void {
  if (!carte) return
  const centre = carte.getCenter()
  emit('choisirPoint', [centre.lng, centre.lat])
}

onMounted(async () => {
  // Chargé à la demande : MapLibre a besoin de WebGL (absent des tests, présent dans le navigateur).
  maplibre = await import('maplibre-gl')
  maplibre.setWorkerUrl(adresseWorker)
  if (!conteneur.value) return
  carte = new maplibre.Map({
    container: conteneur.value,
    style: {
      version: 8,
      sources: {
        planIgn: { type: 'raster', tiles: [FOND_PLAN_IGN], tileSize: 256, attribution: '© IGN – Géoplateforme' },
        [SOURCE_CONTOUR]: { type: 'geojson', data: CONTOURS_VIDES },
        [SOURCE_COURS_EAU]: { type: 'geojson', data: CONTOURS_VIDES },
        [SOURCE_ZONES_INONDABLES]: { type: 'geojson', data: CONTOURS_VIDES },
        [SOURCE_ZONES_DE_LOIN]: { type: 'raster', tiles: [ADRESSE_TUILES_ZONES_INONDABLES], tileSize: 256, attribution: '© Géorisques' },
      },
      layers: [
        { id: 'plan-ign', type: 'raster', source: 'planIgn' },
        // De loin : l'ensemble des zones en une seule couleur foncée (les niveaux se distinguent de près, par leurs motifs).
        {
          id: 'zones-inondables-de-loin',
          type: 'raster',
          source: SOURCE_ZONES_DE_LOIN,
          maxzoom: ZOOM_MINIMUM_ZONES_INONDABLES,
          layout: { visibility: 'none' },
          paint: { 'raster-brightness-max': 0.45, 'raster-saturation': 0.6, 'raster-contrast': 0.4 },
        },
        // De près : un voile bleu foncé sous les motifs, pour que les zones ressortent du fond de carte.
        {
          id: 'zones-inondables-voile',
          type: 'fill',
          source: SOURCE_ZONES_INONDABLES,
          minzoom: ZOOM_MINIMUM_ZONES_INONDABLES,
          paint: { 'fill-color': '#00205b', 'fill-opacity': 0.3 },
        },
        // Du niveau le plus fort au plus fréquent : chaque niveau a son motif (pas la couleur seule).
        ...[...NIVEAUX_CRUE].reverse().map((niveau) => ({
          id: `zones-inondables-${niveau.id}`,
          type: 'fill' as const,
          source: SOURCE_ZONES_INONDABLES,
          minzoom: ZOOM_MINIMUM_ZONES_INONDABLES,
          filter: ['==', ['get', 'niveau'], niveau.id] as unknown as boolean,
          paint: { 'fill-pattern': nomImageMotif(niveau.id) },
        })),
        { id: 'bassin-remplissage', type: 'fill', source: SOURCE_CONTOUR, paint: { 'fill-color': '#000091', 'fill-opacity': 0.12 } },
        { id: 'bassin-trait', type: 'line', source: SOURCE_CONTOUR, paint: { 'line-color': '#000091', 'line-width': 3, 'line-dasharray': [4, 2] } },
        { id: 'cours-eau-trait', type: 'line', source: SOURCE_COURS_EAU, paint: { 'line-color': '#0a5fa8', 'line-width': 3 } },
        {
          id: 'cours-eau-fleches',
          type: 'symbol',
          source: SOURCE_COURS_EAU,
          layout: { 'symbol-placement': 'line', 'symbol-spacing': 90, 'icon-image': IMAGE_FLECHE, 'icon-size': 0.7, 'icon-allow-overlap': true },
        },
      ],
    },
    center: [2.35, 46.6],
    zoom: 5,
    cooperativeGestures: true,
  })
  carte.addControl(new maplibre.NavigationControl({ showCompass: false }))
  carte.on('click', (evenement) => emit('choisirPoint', [evenement.lngLat.lng, evenement.lngLat.lat]))
  carte.on('load', () => {
    carte?.addImage(IMAGE_FLECHE, dessinerFleche())
    NIVEAUX_CRUE.forEach((niveau) => carte?.addImage(nomImageMotif(niveau.id), dessinerMotif(niveau.motif)))
    afficherPoint()
    afficherBassin()
    afficherCoursEau()
    afficherZonesInondables()
    annoncerZoneVisible()
  })
  carte.on('moveend', annoncerZoneVisible)
})

watch(() => props.point, () => {
  afficherPoint()
  centrerSurPoint()
})
watch(() => props.bassin, afficherBassin)
watch(() => props.coursEau, afficherCoursEau)
watch(() => [props.zonesInondables, props.zonesAffichees], afficherZonesInondables)
onUnmounted(() => carte?.remove())
</script>

<template>
  <div>
    <div
      ref="conteneur"
      class="carte"
      role="region"
      aria-label="Carte du bassin versant (le texte à côté de la carte donne les mêmes informations)"
    />
    <button class="bouton bouton--secondaire bouton-centre" type="button" @click="choisirCentreDeLaCarte">
      Choisir le point au centre de la carte
    </button>
    <p class="aide-texte">
      Au clavier : placez-vous sur la carte, déplacez-la avec les flèches, puis activez ce bouton.
    </p>
  </div>
</template>

<style scoped>
.bouton-centre {
  margin-top: 1rem;
}
.carte {
  width: 100%;
  height: 32rem;
  min-height: 20rem;
}
@media (prefers-reduced-motion: reduce) {
  .carte :deep(*) {
    transition: none !important;
  }
}
</style>
