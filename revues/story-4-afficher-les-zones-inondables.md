# Story #4 — Afficher les zones inondables

## Critères d'acceptation et preuves
- Case « Zones inondables » qui affiche ou masque les zones : `src/views/__tests__/ZonesInondables.spec.ts` (case décochée au départ ; cocher puis décocher ; seul le bassin choisi est demandé).
- Zones distinguées par un motif (hachures, points, quadrillage), pas par la couleur seule : légende en texte testée dans le même fichier ; trois motifs distincts testés dans `src/lib/__tests__/zonesInondables.spec.ts`.
- Liste alternative : communes concernées par niveau de crue, en texte (test de la liste).
- Panne du service et absence de bassin : messages testés.

## Accessibilité
- Automatique : test axe-core, case cochée avec légende et liste.
- Case à étiquette visible, clavier natif ; message de statut (`role="status"`) pour chargement et erreurs ; légende et liste en texte.
- **À vérifier par un humain** : lisibilité des trois motifs sur le fond de carte (zoom, contraste) ; lecture au lecteur d'écran de la case et de la légende.

## Point d'attention important
- **Je n'ai pas pu joindre Géorisques depuis mon environnement** : le nom de la couche (`ms:surface_inondable`), les valeurs du champ « scénario » et le champ des communes sont des **hypothèses** à confirmer sur le vrai service. Ils sont regroupés dans `src/lib/zonesInondables.ts`. Si le format diffère, l'application affiche le message d'erreur et n'invente aucune zone.
- Les communes viennent d'une propriété de la source ; si elle est absente, la liste le dit (« communes non précisées »).

## Périmètre
- Ajoutés : lecture des zones, service, store, composant case + légende + liste, motifs de carte, tests.
- Modifiés : carte (couches de zones) et écran de la carte (branchement).
- Rien d'autre.

## Contrôles
Voir le résultat ci-dessous.
