# Agile Toolkit

Ressources personnelles utilisées pour la chaîne YouTube [Agile Toolkit](https://www.youtube.com/@AgileToolkit) et pour les outils qui l'accompagnent.

Ce dépôt est destiné uniquement à mon usage dans le cadre de la chaîne Agile Toolkit. Il n'est pas conçu comme un projet générique ni comme un package à installer par d'autres personnes.

## 📦 Contenu du dépôt

### 🎨 Identité visuelle

- `favicon/favicon.ico` : favicon commune aux sites et outils Agile Toolkit.
- `logo/Agile-Toolkit-Logo-fond-bleu-682.png` : logo Agile Toolkit sur fond bleu.
- `logo/logo_fondblanc_800.png` : logo Agile Toolkit sur fond blanc.

### 🧭 Menu de navigation partagé

- `menu/menu.js` : menu flottant réutilisable en JavaScript. Il affiche le logo, les liens vers les outils Agile Toolkit, l'état actif et ouvre les liens YouTube dans un nouvel onglet.
- `menu/menu-items.js` : liste des outils affichés par le menu (`AGILE_TOOLKIT_TOOLS`).
- `menu/assets/logo_fondblanc_800.png` : copie du logo utilisée directement par `menu.js`.
- `menu/demo.html` : page de démonstration permettant de tester le menu partagé.

### 📊 Éditeur de métadonnées vidéo

- `videos-metadata/index.html` : interface HTML de l'éditeur de métadonnées.
- `videos-metadata/styles.css` : styles de l'interface de l'éditeur.
- `videos-metadata/app.js` : logique de chargement, modification, ajout, export et sauvegarde des métadonnées.
- `videos-metadata/videos-metadata.json` : fichier principal contenant les séries et les métadonnées des vidéos.
- `videos-metadata/videos-metadata.json.bak` : copie de sauvegarde du fichier de métadonnées.
- `videos-metadata/save.php` : endpoint PHP utilisé pour enregistrer le fichier JSON depuis l'éditeur.

## Utilisation rapide

- Pour tester le menu, ouvrir `menu/demo.html` depuis un serveur web local.
- Pour utiliser l'éditeur, servir le dossier `videos-metadata/` avec un serveur compatible PHP afin que la sauvegarde fonctionne.
- Les fichiers sont ensuite copiés ou intégrés manuellement dans les sites et outils Agile Toolkit concernés.
