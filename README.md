# Anita

Une carte interactive qui efface les limites administratives habituelles (communes, départements, régions) pour révéler le territoire naturel auquel on appartient réellement : celui de l'eau.

Le nom rend hommage à Anita Conti (1899-1997), première femme océanographe française, qui a
dressé les premières cartes de pêche et montré que la mer n'est pas une ressource inépuisable.

## Ce que montre la carte

- **Votre bassin versant.** Cherchez votre commune ou cliquez sur la carte : Anita trace le
  contour du bassin où s'écoule l'eau qui tombe chez vous, et le nomme. Trois échelles au choix :
  le grand bassin, le bassin de la rivière principale ou le petit bassin local.
- **Les rivières, en amont et en aval.** Le réseau des cours d'eau du bassin, tracé avec le sens
  de l'écoulement.
- **Les zones inondables.** Trois niveaux de crue (fréquente, moyenne, de faible probabilité),
  chacun avec son propre motif, et la liste des communes concernées.

Tout ce que dit la carte est aussi écrit à côté, en texte : le nom du bassin, les cours d'eau et
leur sens, les communes en zone inondable. On peut tout faire au clavier, sans voir la carte.

## Les données

Des données publiques, interrogées à chaque recherche :

| Donnée | Source |
| --- | --- |
| Communes | [API Géo](https://geo.api.gouv.fr) |
| Bassins versants et cours d'eau | [Sandre](https://www.sandre.eaufrance.fr), référentiel des données sur l'eau |
| Zones inondables | [Géorisques](https://www.georisques.gouv.fr) |
| Fond de carte | [Géoplateforme de l'IGN](https://geoservices.ign.fr) |

## Lancer le projet

Node 20 ou plus :

```sh
npm ci
npm run dev        # la carte sur http://localhost:5173
npm run test:unit  # les tests
npm run build      # vérification des types et construction dans dist/
```

Vue 3 et MapLibre. Fiche projet : [PROJET.md](PROJET.md) ; consignes pour les agents de code :
[AGENTS.md](AGENTS.md) ; décisions : [docs/adr/](docs/adr/0001-choix-de-la-stack.md).
