# Anita — Votre territoire, dessiné par l'eau

**Objectif :** Une carte interactive qui efface les limites administratives habituelles (communes, départements, régions) pour révéler le territoire naturel auquel on appartient réellement : celui de l'eau.
**Type :** carte interactive (lieux sur fond IGN, liste accessible, filtres)
**Stack :** Vue 3, MapLibre, styles maison sobres (pas de DSFR : le projet n'est pas un service public)
**Lieux :** `src/donnees/lieux.json`
**Créé le :** 2026-11-19 par Carolinedanslesnuages

## Lancer le projet
| Action | Commande |
|---|---|
| Lancer | `npm run dev` |

## Stories réalisées
- #2 — Trouver sa commune et voir son bassin versant (recherche de commune, clic sur la carte, contour et nom du bassin, texte à côté de la carte)
- #3 — Afficher le réseau des rivières, en amont et en aval (case « Rivières et affluents », tracés avec flèches, liste en texte avec sens d'écoulement)
