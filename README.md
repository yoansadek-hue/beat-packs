# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Boutique** : packs Bronze, Argent, Or, packs pays (US, UK, FR) et pack Icône. On ouvre un pack comme dans FIFA 21 : tunnel, puis walkout si la meilleure carte est Platine, Diamant ou Icône.
- **Cartes** : une carte par titre, avec la pochette de l'album. La note vient du nombre de streams (10 M → 67, 100 M → 79, 1 Md → 91).
  - Bronze, Argent, Or, Platine selon la note
  - **Diamant** : version spéciale d'un titre (+4)
  - **Icône** : carte spéciale d'un artiste
- **Collection** (bouton en haut) : les cartes sont rangées par album, avec filtres par pays et recherche.
- **Marché** : acheter les offres des autres joueurs, mettre ses cartes en vente (5 % de taxe).
- **Amis** : offrir une carte à un ami avec un code, recevoir les siennes.
- **Défis** : défis du jour, primes d'album complet et objectifs. Ils rapportent des pièces.
- **Paramètres** : pseudo, vibrations, passer les walkouts, recommencer.

## Fichiers
- `data.js` : le catalogue (albums, titres, streams). Pour ajouter un album, copie une ligne.
- `covers.js` : l'adresse de la pochette de chaque album (trouvée sur iTunes). Un album ajouté sans pochette ici est cherché en ligne automatiquement.
- `index.html`, `style.css`, `script.js` : la page, le style et le jeu.

## À savoir
- Les streams sont des ordres de grandeur, pas des chiffres exacts : corrige-les dans `data.js` si besoin.
- Le marché et ses vendeurs sont simulés sur ton appareil (pas de serveur).
- Les codes cadeau marchent entre deux appareils, mais rien n'empêche de tricher : c'est un jeu entre amis.
