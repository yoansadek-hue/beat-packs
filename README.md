# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Cartes** : une carte par titre, pour **toute la discographie** de 70 artistes de rap US, UK et FR (environ 11 500 titres). Sur la carte : la note, la pochette (Apple Music), le titre, l'artiste et les streams.
  - **Disques** : chaque titre reçoit un disque (Or, Platine, Diamant) selon ses streams et les seuils de certification de son pays.
  - **Note** : mélange des streams et des disques.
  - **Valeur** (pour vendre) : selon les disques.
  - Raretés : Commune, Rare, Épique, Légendaire. Spéciales : **Holo** (un titre, +3) et **Icône** (un artiste).
- **Boutique** : 3 packs, seul le nombre de cartes change (3, 5, 10). Ouverture façon FIFA 21 : tunnel, puis walkout (pays, artiste, album) pour une Légendaire, une Holo ou une Icône. On touche la carte pour voir les autres.
- **Collection** (bouton en haut) : tes artistes → tous leurs albums → toutes les cartes de l'album, y compris celles qui manquent.
- **Défis** : défis de cartes (on donne des cartes pour gagner un pack spécial), défis du jour et primes d'album complet.
- **Marché** : acheter les offres des autres joueurs, mettre ses cartes en vente (5 % de taxe).
- **Amis** : offrir une carte à un ami avec un code, recevoir les siennes.
- **Paramètres** : pseudo, vibrations, passer les walkouts, recommencer.

## Fichiers
- `data.js` : le catalogue généré (artistes, albums, titres, streams, pochettes).
- `index.html`, `style.css`, `script.js` : la page, le style et le jeu.

## À savoir
- Discographies : Deezer. Pochettes : Apple Music (sinon Deezer pour ~8 % des albums).
- Streams : ordres de grandeur pour les titres phares ; pour les autres, estimation d'après leur popularité sur Deezer, calée sur les titres phares de l'artiste. Les disques sont calculés à partir de ces streams, ce ne sont pas les certifications officielles.
- Le marché et ses vendeurs sont simulés sur ton appareil (pas de serveur).
- Les codes cadeau marchent entre deux appareils, mais rien n'empêche de tricher : c'est un jeu entre amis.
