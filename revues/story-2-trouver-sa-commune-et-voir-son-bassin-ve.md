# Story #2 — Trouver sa commune et voir son bassin versant

## Critères d'acceptation et preuves

| Critère | Test qui le prouve |
|---|---|
| Je tape un nom, je choisis une suggestion, la carte se centre dessus | `CarteView.spec.ts` : « propose des communes… » et « choisir une suggestion… » (le centrage de la carte elle-même est à vérifier dans le navigateur) |
| Je peux cliquer sur la carte pour choisir un point | `CarteView.spec.ts` : « cliquer sur la carte… » ; `bassin.spec.ts` (store) |
| Le contour s'affiche avec le nom du bassin en texte | `bassins.spec.ts` (lecture du bassin) ; dessin du contour et nom sur la carte : à vérifier dans le navigateur (WebGL absent des tests) |
| Tout au clavier ; nom et surface en texte à côté de la carte | `CarteView.spec.ts` : champ + bouton + suggestions (boutons), niveau en boutons radio, texte « Votre bassin versant » ; `bassins.spec.ts` (surface) |

Cas d'erreur testés : commune inconnue, point sans bassin, service en panne, réponse périmée ignorée.

## Choix du PO appliqués
- Données réelles : communes (API Géo), bassins (Sandre, découpage hydrographique).
- Niveaux : grand bassin (région hydrographique), **rivière principale par défaut** (secteur), petit bassin local (zone).
- Commune : bassin du centre de la commune.

## Accessibilité
- Composants DSFR (champ, boutons, boutons radio) ; un seul h1, titres sans saut ; messages en `role="status"`.
- Test automatique axe-core sur l'écran, avant et après l'affichage d'un bassin.
- Contour : trait pointillé épais + remplissage léger + nom écrit (pas la couleur seule). Mouvement réduit respecté.
- Choix d'un point au clavier : bouton « Choisir le point au centre de la carte » (la carte se déplace aux flèches).

**À vérifier par un humain**
- Navigation au clavier complète et ordre de tabulation, focus visible.
- Lecteur d'écran : annonces des suggestions et du bassin trouvé.
- Contrastes du contour sur le fond IGN ; zoom 200 % et affichage mobile.
- Carte : centrage sur la commune, contour et nom affichés, clic sur la carte (nécessite WebGL).

## Périmètre
- Ajouts : recherche de commune, carte du bassin, texte du bassin, choix du niveau, store `bassin`, deux services en ligne.
- L'écran principal ne montre plus les lieux d'exemple. Leurs fichiers (carte, liste, store, données) sont conservés, non utilisés : à supprimer dans une prochaine demande si le PO le confirme.
- Point d'attention : le « grand bassin » pèse environ 1,5 Mo à charger ; la première réponse peut être lente. Un point en bordure de bassin prend le premier bassin renvoyé par le service.

## Résultat des contrôles
oxlint, eslint, type-check, tests (24 réussis) et build : tous OK.
