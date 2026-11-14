# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Version téléphone, tablette et ordinateur (plein écran sur grand écran).
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Cartes** : une carte par titre, pour **toute la discographie** de 199 artistes de rap US, UK et FR (2 050 albums, environ 29 500 titres). Sur la carte : la note et le pays en surimpression sur la pochette (Apple Music), le titre, l'artiste, la rareté et les streams. Pas de stats sur la carte.
  - **Disques** : chaque titre reçoit un disque (Or, Platine, Diamant) selon ses streams et les seuils de certification de son pays.
  - **Note** : selon les streams (1 M → 68, 10 M → 76, 100 M → 84, 1 Md → 92), plus un bonus de disques de platine. Une Icône vaut de 85 à 99 selon le total des streams de l'artiste.
  - **Valeur** au marché : comme les prix moyens de FIFA selon la note (~400 à 75, ~9 000 à 86, ~55 000 à 90, ~1,3 M à 99) ; Holo ×1,5, Icône ×2. La vente rapide rapporte 25 % de la valeur.
  - **Stats** façon FIFA : FLO (flow), TXT (textes), PRD (prod), VOX (voix), HYP (hype), STR (streams). Elles sont calculées à partir de la note, des streams et de l'année de sortie, et ne s'affichent que dans la fiche de la carte, le Draft et les Matchs.
  - Raretés, au code couleur des disques : **Vinyle** (noir), **Or**, **Platine**, **Diamant**. Spéciales : **Icône** (la carte d'un artiste, de 85 à 99) et **Holo** (version brillante, +1, des 5 titres les plus streamés de chaque album, en plus de leur carte normale).
- **Barre du bas** : Boutique, Marché, Menu, Défis, Classeur.
- **Menu** (écran d'accueil) : panneau « à la une », **Actualité** (à faire glisser de gauche à droite) et les tuiles Draft, Match, SBC et Paramètres.
- **Actualité** :
  - **TOTW** (titres de la semaine) : les 10 titres du jeu les plus écoutés de la semaine sur Spotify (classements France, États-Unis, Royaume-Uni). Leur carte TOTW (noire et or) a +2 sur la note et peut tomber dans les packs toute la semaine.
  - **Sorties** : les albums et EP sortis ces 4 dernières semaines par les artistes du jeu, ajoutés automatiquement au catalogue.
  - **Anniversaires** : les albums qui fêtent leur sortie cette semaine. Leur carte anniversaire (+2 sur la carte album) peut tomber dans les packs.
- **Carte album** : compléter un album d'au moins 4 titres donne sa carte album (note selon ses meilleurs titres), en plus de la prime.
- **Mise à jour chaque vendredi** (GitHub Actions, `tools/weekly.js`) : streams Spotify de tous les titres, nouvelles sorties, dates de sortie, TOTW. Le fichier `live.js` garde la TOTW et l'historique des semaines.
- **Draft** (15 000 pièces) : on fonde sa **maison de disque** et on signe un artiste par poste (Tête d'affiche HYP, Plume TXT, Flow FLO, Beatmaker PRD, Refrain VOX), en choisissant 1 carte parmi 5. Les postes voisins sont reliés : même artiste ou même pays donne de l'**alchimie**, qui augmente les stats. Puis 4 combats contre des labels de plus en plus forts (76, 82, 87, 92) : 5 duels poste contre poste. On peut abandonner à tout moment (on garde la récompense des victoires déjà gagnées). Récompenses : de 1 000 pièces (0 victoire) à 12 000 pièces + Pack 12 + Pack Spécial (4 victoires), affichées sur un écran de récompenses.
- **Match** : ton meilleur label composé automatiquement contre l'ordinateur, 4 niveaux (de +1 500 à +12 000 pièces), 10 victoires récompensées par jour. Un combat peut être abandonné (il compte comme une défaite).
- **Animations** : aucune ne peut être passée (ouverture de pack, walkouts, combats).
- **Mes packs** (onglet de la Boutique) : toutes les récompenses de SBC, de Draft et d'albums y attendent d'être ouvertes. Après un SBC ou un Draft, un écran montre les récompenses, avec « Ouvrir maintenant » ou « Plus tard ».
- **Boutique** : un panneau « à la une » et la carte du jour, façon menus FUT 21, puis 3 packs, seul le nombre de cartes change (3, 6, 12). Ouverture : le pack se déchire vraiment (le haut s'arrache ; il en sort 1 carte sans walkout, 3 cartes pour une walkout, 2 cartes pour une double walkout), puis on plonge dans un tunnel en 2D fait des sillons d'un vinyle, entre deux égaliseurs. Les indices, un peu comme sur FIFA : égaliseurs bas pour une carte simple, hauts et blancs pour un Platine ; pour une walkout ils saturent puis le disque du fond s'allume à la couleur de la carte ; pour une double walkout, un second disque sort de derrière le premier, puis walkout (pays, artiste, album) pour une carte 86+, une Holo 83+ ou une Icône. S'il y en a deux, la carte se retourne toute seule sur la meilleure au bout de 2 s ; on touche la dernière pour voir tout le pack. Chaque carte révélée joue un extrait de 30 s du titre (le plus gros titre de l'artiste pour une Icône).
- **Catalogue** (onglet du bas) : tous les artistes et toutes les cartes du jeu, y compris celles qu'on n'a pas (grisées, avec leur note, Holo et Icône comprises). Onglet **Classeur** : toutes tes cartes, avec le nombre de doublons. Tri par note, streams, valeur, titre, artiste ou doublons. Toucher une carte joue l'extrait du titre.
- **Prime d'album** : finir un album d'au moins 4 titres rapporte des pièces et un pack offert (à ouvrir dans la Boutique).
- **Défis** : côté **SBC** (22 défis de cartes, beaucoup avec plusieurs conditions façon FIFA : nombre de cartes d'un pays ou d'une rareté, maximum de Vinyles, note moyenne, nombre de pays ou d'artistes différents ; « Remplir auto » trouve les cartes les moins chères qui valident tout ; les packs spéciaux sont petits, et certains SBC donnent un **choix** : 1 carte parmi 3) et côté **Défis** (défis du jour, albums presque finis).
- **Marché** : acheter les offres des autres joueurs, mettre ses cartes en vente (5 % de taxe).
- **Amis** (bouton en haut) : offrir une carte à un ami avec un code, recevoir les siennes.
- **Bruitages** : pack qui tremble, souffle, montée du tunnel, impact de la walkout, carillon de révélation, retournement, pièces… fabriqués à la volée (Web Audio), sans fichier.
- **Paramètres** : pseudo, vibrations, bruitages, extraits audio, recommencer.

## Fichiers
- `data.js` : le catalogue généré (artistes, albums, titres, streams, pochettes, dates de sortie).
- `live.js` : TOTW, sorties récentes, date de la dernière mise à jour (régénéré chaque semaine).
- `tools/weekly.js` et `.github/workflows/weekly.yml` : la mise à jour hebdomadaire.
- `index.html`, `style.css`, `script.js` : la page, le style et le jeu.

## À savoir
- Discographies et extraits audio : Deezer. Pochettes : Apple Music (sinon Deezer pour ~8 % des albums).
- Streams : nombre d'écoutes **Spotify** relevé sur kworb.net (environ 82 % des titres) ; les titres introuvables sont estimés d'après les chiffres Spotify de l'artiste. Les disques sont calculés à partir de ces streams, ce ne sont pas les certifications officielles.
- Le marché et ses vendeurs sont simulés sur ton appareil (pas de serveur).
- Les codes cadeau marchent entre deux appareils, mais rien n'empêche de tricher : c'est un jeu entre amis.
