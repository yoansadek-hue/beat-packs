# Beat Packs

Un jeu de packs de cartes de rap US, UK et FR, inspiré de FIFA Ultimate Team.

## Lancer le jeu
Version téléphone, tablette et ordinateur (plein écran sur grand écran).
Ouvre `index.html` dans ton navigateur (ou utilise l'extension Live Server dans VS Code).

## Le jeu
- **Taux de drop** : plus la note est haute, plus la carte est rare (Vinyle 70 %, Or 24 %, Platine 5,5 %, Diamant 0,5 %, et dans chaque rang les meilleures notes sont plus rares) ; environ 1 pack de 12 sur 6 a une walkout.
- **Choix de carte** : une fois ouvert, on ne peut pas le fermer sans choisir.
- **Cartes** : une carte par titre, pour **toute la discographie** de 199 artistes de rap US, UK et FR (2 050 albums, environ 29 500 titres). Sur la carte : la note et le pays en surimpression sur la pochette (Apple Music), le titre, l'artiste, la rareté et les streams. Pas de stats sur la carte.
  - **Disques** : chaque titre reçoit un disque (Or, Platine, Diamant) selon ses streams et les seuils de certification de son pays.
  - **Note** : selon les streams (1 M → 68, 10 M → 76, 100 M → 84, 1 Md → 92), plus un bonus de disques de platine. Une Icône vaut de 85 à 99 selon le total des streams de l'artiste.
  - **Valeur** au marché : comme les prix moyens de FIFA selon la note (~400 à 75, ~9 000 à 86, ~55 000 à 90, ~1,3 M à 99) ; Holo ×1,5, Icône ×2. La vente rapide rapporte 25 % de la valeur.
  - **Stats** façon FIFA : FLO (flow), TXT (textes), PRD (prod), VOX (voix), HYP (hype), STR (streams). Elles sont calculées à partir de la note, des streams et de l'année de sortie, et ne s'affichent que dans la fiche de la carte, le Draft et les Matchs.
  - Raretés, au code couleur des disques : **Vinyle** (noir), **Or**, **Platine**, **Diamant**. Spéciales : **Icône** (la carte d'un artiste, de 85 à 99) et **Holo** (version brillante, +1, des 5 titres les plus streamés de chaque album, en plus de leur carte normale).
- **Barre du bas** : Boutique, Marché, Menu, Défis, Classeur.
- **Menu** (écran d'accueil) : panneau « à la une », **Actualité** (à faire glisser de gauche à droite) et les tuiles Draft, Match, SBC et Paramètres.
- **Actualité** (à faire glisser) :
  - **TOTW** : les cartes qui **changent de rang** dans la semaine grâce à leurs streams (Vinyle › Or › Platine › Diamant), les plus écoutées de la semaine en premier (classements Spotify FR, US, UK). Carte noire et or avec des éclats qui sortent du cadre ; tunnel noir sur fond or. Dans les packs toute la semaine.
  - **Équipe du mois** : en novembre, les **Underdogs**, les 20 titres les moins écoutés des 60 plus grands artistes, notés de 83 à 89 (carte néon avec éclairs et pochette qui dépasse). Dans les packs jusqu'au 30 novembre et en choix 1 parmi 3 avec le SBC « Underdogs ».
  - **Sorties** : les albums et EP sortis ces 4 dernières semaines par les artistes du jeu.
- **Catalogue** : raccourcis Icônes, Albums à finir, Sorties, Mes meilleures ; la recherche trouve aussi les titres et les albums.
- **Catalogue › Cartes spéciales** : toutes les TOTW (semaine par semaine) et les équipes du mois, obtenues ou non ; elles apparaissent aussi dans la page de leur album.
- **Blind test** (Menu) : 10 extraits pris au milieu du son, 4 titres proches au choix (même artiste, même époque) sans voir l'artiste, 10 s par manche ; plus on répond vite, plus on marque. 300 pièces par bonne réponse, 5 parties récompensées par jour. Filtre Tout, Rap FR, US, UK.
- **Notifications** (cloche en haut) : nouvelle TOTW, équipe du mois, sorties, cartes vendues, albums complétés. Option « Notifications sur l'appareil » dans les paramètres.
- **Profil** (rond en haut à droite) : stats, Amis, Paramètres, notifications et **connexion Google** (Firebase, même projet que Quizly) avec sauvegarde de la partie en ligne.
- **Carte album** : compléter un album d'au moins 4 titres donne sa carte album (note selon ses meilleurs titres), en plus de la prime.
- **Mise à jour chaque vendredi** (GitHub Actions, `tools/weekly.js`) : streams Spotify de tous les titres, nouvelles sorties, dates de sortie, TOTW. Le fichier `live.js` garde la TOTW et l'historique des semaines.
- **Tactiques** (Draft et Match) : Pentagone, Étoile, Pyramide, Chaîne ; chacune place les postes autrement et trace ses propres liens d'alchimie. On peut échanger deux cartes en touchant l'une puis l'autre poste.
- **Draft** (15 000 pièces ; on touche n'importe quel poste vide, dans l'ordre qu'on veut, pour choisir son artiste parmi 5 en plein écran) : on fonde sa **maison de disque** et on signe un artiste par poste (Tête d'affiche HYP, Plume TXT, Flow FLO, Beatmaker PRD, Refrain VOX), en choisissant 1 carte parmi 5. Les postes voisins sont reliés : même artiste ou même pays donne de l'**alchimie**, qui augmente les stats. Puis 4 combats contre des labels de plus en plus forts (76, 82, 87, 92) : 5 duels poste contre poste. On peut abandonner à tout moment (on garde la récompense des victoires déjà gagnées). Récompenses : de 1 000 pièces (0 victoire) à 12 000 pièces + Pack 12 + Pack Spécial (4 victoires), affichées sur un écran de récompenses.
- **Match** : ton label contre l'ordinateur ; tu choisis la carte de chaque poste dans ta collection (ou « Composer automatiquement »), la tactique et les places ; 4 niveaux (de +1 500 à +12 000 pièces), 10 victoires récompensées par jour. Un combat peut être abandonné (il compte comme une défaite).
- **Animations** : aucune ne peut être passée (ouverture de pack, walkouts, combats).
- **Mes packs** (onglet de la Boutique) : toutes les récompenses de SBC, de Draft et d'albums y attendent d'être ouvertes. Après un SBC ou un Draft, un écran montre les récompenses, avec « Ouvrir maintenant » ou « Plus tard ».
- **Boutique** : un pack gratuit par jour (3 cartes), un **pack infini** (1 carte, gratuit et illimité, avec de petites chances : Platine 2,5 %, Diamant 0,1 %), puis Classiques (Pack 3, 6, 12), Premium (Or, Platine, Prisme, Prime) et Événements (TOTW et équipe du mois, 12 cartes). Plus un pack est cher, plus les Platine, Diamant, Holo, Icônes et cartes spéciales sont fréquents ; les cotes sont affichées sur chaque pack. Aucun pack ne garantit une carte spéciale : les packs d'événement augmentent seulement les chances (×6). Ouverture : le pack se déchire (1 carte sort sans walkout, 3 pour une walkout ou une double walkout), tunnel en 2D, walkout pour une carte 86+, une Holo ou TOTW 83+, une Icône, une carte de l'équipe du mois ou une carte album.
- **Catalogue** (onglet du bas) : tous les artistes et toutes les cartes du jeu, y compris celles qu'on n'a pas (grisées, avec leur note, Holo et Icône comprises). Onglet **Classeur** : toutes tes cartes, avec le nombre de doublons. Tri par note, streams, valeur, titre, artiste ou doublons. Toucher une carte joue l'extrait du titre.
- **Prime d'album** : finir un album d'au moins 4 titres rapporte des pièces et un pack offert (à ouvrir dans la Boutique).
- **Défis** : côté **SBC** (22 défis de cartes plus durs, et des **défis de groupe** comme sur FIFA : plusieurs équipes à rendre, chacune rapporte un pack, toutes ensemble une Icône ou une carte de l'équipe du mois au choix, une seule fois ; beaucoup avec plusieurs conditions façon FIFA : nombre de cartes d'un pays ou d'une rareté, maximum de Vinyles, note moyenne, nombre de pays ou d'artistes différents ; « Remplir auto » trouve les cartes les moins chères qui valident tout ; les packs spéciaux sont petits, et certains SBC donnent un **choix** : 1 carte parmi 3) et côté **Défis** (défis du jour, albums presque finis).
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
