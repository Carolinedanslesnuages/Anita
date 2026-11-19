# Story #3 — Afficher le réseau des rivières, en amont et en aval

## Critères d'acceptation et preuves

| Critère | Test qui le prouve |
|---|---|
| Une case « Rivières et affluents » affiche ou masque les cours d'eau du bassin | `CoursEau.spec.ts` : « propose une case… décochée au départ » et « cocher affiche… décocher masque » (le tracé lui-même sur la carte est à vérifier dans le navigateur) |
| Les cours d'eau principaux portent leur nom, en texte, dans une liste | `CoursEau.spec.ts` : « liste les noms… » ; `coursEau.spec.ts` (lib) : tri par longueur, regroupement des tronçons, vingtaine au plus |
| Le sens d'écoulement est indiqué, pas seulement par la couleur | `CoursEau.spec.ts` : chaque ligne dit « de l'amont vers l'aval, vers le … » ; `coursEau.spec.ts` : calcul du sens ; flèches sur la carte : à vérifier dans le navigateur |

Cas testés : aucun bassin affiché, service en panne, réponse inattendue.

## Choix appliqués
- « Principaux » = les 20 cours d'eau nommés les plus longs du bassin (hypothèse validée avec le plan).
- Sens écrit en points cardinaux (« vers le sud-est »), calculé de la source à l'embouchure.
- Données : service Sandre (couche des cours d'eau), rien n'est stocké dans le projet.

## Accessibilité
- Case à cocher native avec étiquette visible ; liste en vraie liste ; titres h2 puis h3 sans saut.
- Annonce « X cours d'eau affichés » en `role="status"`.
- Sens en texte + flèches blanches cernées de bleu foncé sur la carte : pas la couleur seule.
- Test automatique axe-core, case cochée et liste affichée.

**À vérifier par un humain**
- Dans le navigateur : cocher la case, voir les tracés et les flèches orientées de l'amont vers l'aval.
- **Réponse réelle du service Sandre** : je n'ai pas pu l'interroger depuis mon environnement. La couche (`CoursEau_FXX`) et le champ du nom (`NomEntiteHydrographique`) viennent de la documentation du service : à confirmer sur un vrai bassin.
- Clavier, lecteur d'écran, contraste du bleu des tracés sur le fond IGN, zoom 200 %.

## Périmètre
- Ajouts : lecture des cours d'eau (lib + service), store `coursEau`, composant `CoursEauDuBassin`, tracés et flèches dans la carte, deux fichiers de tests.
- Le sens « vers … » est une direction (points cardinaux), pas le nom du cours d'eau suivant : le nom de la rivière réceptrice n'est pas fourni par le service.
- Les tracés ne sont cherchés que sur le bassin affiché, pas hors de celui-ci (« en amont » hors bassin non traité).

## Résultat des contrôles
oxlint, eslint, type-check, tests (38 réussis) et build : tous OK.
