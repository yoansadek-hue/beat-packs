# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Cartes** : une carte par titre, pour **toute la discographie** de 69 artistes de rap US, UK et FR (770 albums, environ 11 500 titres). Sur la carte : la note, la pochette (Apple Music), le titre, l'artiste et les streams.
  - **Disques** : chaque titre reçoit un disque (Or, Platine, Diamant) selon ses streams et les seuils de certification de son pays.
  - **Note** : selon les streams (1 M → 68, 10 M → 76, 100 M → 84, 1 Md → 92), plus un bonus de disques de platine. Une Icône vaut de 85 à 99 selon le total des streams de l'artiste.
  - **Valeur** au marché : comme les prix moyens de FIFA selon la note (~400 à 75, ~9 000 à 86, ~55 000 à 90, ~1,3 M à 99) ; Holo ×1,5, Icône ×2. La vente rapide rapporte 25 % de la valeur.
  - Raretés, au code couleur des disques : **Vinyle** (noir), **Or**, **Platine**, **Diamant**. Spéciales : **Icône** (la carte d'un artiste, de 85 à 99) et **Holo** (version brillante, +1, des 5 titres les plus streamés de chaque album, en plus de leur carte normale).
- **Boutique** : 3 packs, seul le nombre de cartes change (3, 6, 12). Ouverture : le pack se déchire vraiment (le haut s'arrache, les cartes sortent), puis on plonge dans un tunnel en 2D fait des sillons d'un vinyle, entre deux égaliseurs. Les indices, un peu comme sur FIFA : égaliseurs bas pour une carte simple, hauts et blancs pour un Platine ; pour une walkout ils saturent puis le disque du fond s'allume à la couleur de la carte ; pour une double walkout, un second disque sort de derrière le premier, puis walkout (pays, artiste, album) pour une carte 86+, une Holo 83+ ou une Icône. S'il y en a deux, la carte se retourne toute seule sur la meilleure au bout de 2 s ; on touche la dernière pour voir tout le pack. Chaque carte révélée joue un extrait de 30 s du titre (le plus gros titre de l'artiste pour une Icône).
- **Collection** (bouton en haut) : onglet **Artistes** (tes artistes → tous leurs albums → toutes les cartes de l'album, y compris celles qui manquent) et onglet **Classeur** (toutes tes cartes, avec le nombre de doublons). Tri par note, streams, valeur, titre, artiste ou doublons. Toucher une carte joue l'extrait du titre.
- **Défis** : défis de cartes (on donne des cartes pour gagner un pack spécial) et défis du jour.
- **Marché** : acheter les offres des autres joueurs, mettre ses cartes en vente (5 % de taxe).
- **Amis** : offrir une carte à un ami avec un code, recevoir les siennes.
- **Bruitages** : pack qui tremble, souffle, montée du tunnel, impact de la walkout, carillon de révélation, retournement, pièces… fabriqués à la volée (Web Audio), sans fichier.
- **Paramètres** : pseudo, vibrations, bruitages, extraits audio, passer les walkouts, recommencer.

## Fichiers
- `data.js` : le catalogue généré (artistes, albums, titres, streams, pochettes).
- `index.html`, `style.css`, `script.js` : la page, le style et le jeu.

## À savoir
- Discographies et extraits audio : Deezer. Pochettes : Apple Music (sinon Deezer pour ~8 % des albums).
- Streams : nombre d'écoutes **Spotify** relevé sur kworb.net (environ 82 % des titres) ; les titres introuvables sont estimés d'après les chiffres Spotify de l'artiste. Les disques sont calculés à partir de ces streams, ce ne sont pas les certifications officielles.
- Le marché et ses vendeurs sont simulés sur ton appareil (pas de serveur).
- Les codes cadeau marchent entre deux appareils, mais rien n'empêche de tricher : c'est un jeu entre amis.
