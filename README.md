# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Cartes** : une carte par titre, pour **toute la discographie** de 69 artistes de rap US, UK et FR (770 albums, environ 11 500 titres). Sur la carte : la note, la pochette (Apple Music), le titre, l'artiste et les streams.
  - **Disques** : chaque titre reçoit un disque (Or, Platine, Diamant) selon ses streams et les seuils de certification de son pays.
  - **Note** : selon les streams (1 M → 68, 10 M → 76, 100 M → 84, 1 Md → 92), plus un bonus de disques de platine. Une Icône vaut de 85 à 99 selon le total des streams de l'artiste.
  - **Valeur** (pour vendre) : selon les disques.
  - Raretés, au code couleur des disques : **Vinyle** (noir), **Or**, **Platine**, **Diamant**. Spéciales : **Icône** (la carte d'un artiste, de 85 à 99) et **Holo** (version brillante, +1, des 5 titres les plus streamés de chaque album, en plus de leur carte normale).
- **Boutique** : 3 packs, seul le nombre de cartes change (3, 5, 10). Ouverture façon FIFA 21 : un couloir de lumières avec un indice discret au bout (une carte simple, une carte à cadre pour un Platine, une porte de lumière pour une walkout), puis walkout (pays, artiste, album) pour un Diamant, une Holo ou une Icône. S'il y en a plusieurs, toucher la carte la retourne sur une meilleure ; ensuite on voit toutes les cartes du pack.
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
