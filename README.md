# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Version téléphone, tablette et ordinateur (plein écran sur grand écran).
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Cartes** : une carte par titre, pour **toute la discographie** de 199 artistes de rap US, UK et FR (2 050 albums, environ 29 500 titres). Sur la carte : la note, la pochette (Apple Music), le titre, l'artiste et les streams.
  - **Disques** : chaque titre reçoit un disque (Or, Platine, Diamant) selon ses streams et les seuils de certification de son pays.
  - **Note** : selon les streams (1 M → 68, 10 M → 76, 100 M → 84, 1 Md → 92), plus un bonus de disques de platine. Une Icône vaut de 85 à 99 selon le total des streams de l'artiste.
  - **Valeur** au marché : comme les prix moyens de FIFA selon la note (~400 à 75, ~9 000 à 86, ~55 000 à 90, ~1,3 M à 99) ; Holo ×1,5, Icône ×2. La vente rapide rapporte 25 % de la valeur.
  - **Stats** façon FIFA : FLO (flow), TXT (textes), PRD (prod), VOX (voix), HYP (hype), STR (streams). Elles sont calculées à partir de la note, des streams et de l'année de sortie.
  - Raretés, au code couleur des disques : **Vinyle** (noir), **Or**, **Platine**, **Diamant**. Spéciales : **Icône** (la carte d'un artiste, de 85 à 99) et **Holo** (version brillante, +1, des 5 titres les plus streamés de chaque album, en plus de leur carte normale).
- **Accueil / Boutique** : un panneau « à la une » et la carte du jour, façon menus FUT 21, puis 3 packs, seul le nombre de cartes change (3, 6, 12). Ouverture : le pack se déchire vraiment (le haut s'arrache ; il en sort 1 carte sans walkout, 3 cartes pour une walkout, 2 cartes pour une double walkout), puis on plonge dans un tunnel en 2D fait des sillons d'un vinyle, entre deux égaliseurs. Les indices, un peu comme sur FIFA : égaliseurs bas pour une carte simple, hauts et blancs pour un Platine ; pour une walkout ils saturent puis le disque du fond s'allume à la couleur de la carte ; pour une double walkout, un second disque sort de derrière le premier, puis walkout (pays, artiste, album) pour une carte 86+, une Holo 83+ ou une Icône. S'il y en a deux, la carte se retourne toute seule sur la meilleure au bout de 2 s ; on touche la dernière pour voir tout le pack. Chaque carte révélée joue un extrait de 30 s du titre (le plus gros titre de l'artiste pour une Icône).
- **Catalogue** (onglet du bas) : tous les artistes et toutes les cartes du jeu, y compris celles qu'on n'a pas (grisées, avec leur note, Holo et Icône comprises). Onglet **Classeur** : toutes tes cartes, avec le nombre de doublons. Tri par note, streams, valeur, titre, artiste ou doublons. Toucher une carte joue l'extrait du titre.
- **Prime d'album** : finir un album d'au moins 4 titres rapporte des pièces et un pack offert (à ouvrir dans la Boutique).
- **Défis** : côté **SBC** (15 défis de cartes ; les packs spéciaux sont petits, ex. 5 cartes Platine pour 1 Holo, et certains donnent un **choix** : 1 carte parmi 3), côté **Défis** (défis du jour, albums presque finis) et côté **Draft** (5 choix de cartes parmi 4, puis 4 combats carte contre carte sur une stat tirée au sort, récompenses selon les victoires).
- **Marché** : acheter les offres des autres joueurs, mettre ses cartes en vente (5 % de taxe).
- **Amis** (bouton en haut) : offrir une carte à un ami avec un code, recevoir les siennes.
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
