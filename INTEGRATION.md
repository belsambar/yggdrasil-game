# YGGDRASIL — Guide d'intégration

## Fichiers à uploader sur GitHub

| Fichier | Description |
|---|---|
| `index.html` | Écran titre + choix rôle |
| `yggdrasil-save.js` | Sauvegarde partagée |
| `yggdrasil-tutoriel.js` | Tutoriel interactif |
| `yggdrasil-carte.html` | Carte v2 |
| `yggdrasil-village.html` | Village |
| `yggdrasil-armee.html` | Armée & Combat |
| `yggdrasil-alliance.html` | Alliance |
| `yggdrasil-quetes.html` | Quêtes |

---

## Intégration de la sauvegarde dans chaque module

Ajouter **avant** le `<script>` principal de chaque page `.html` :

```html
<script src="yggdrasil-save.js"></script>
```

Puis dans le script de chaque module, au début de `init()` :

```javascript
// Charger la sauvegarde
YSaveInit(state); // injecte les données sauvegardées dans votre objet state

// Auto-save toutes les 30s
YSave.autoSaveHook(() => YSaveExtract(state), 30000);
```

Et à chaque action importante (victoire combat, construction bâtiment, etc.) :

```javascript
YSave.save(YSaveExtract(state));
```

---

## Intégration du tutoriel dans la carte

Ajouter dans `yggdrasil-carte.html`, après `yggdrasil-save.js` :

```html
<script src="yggdrasil-save.js"></script>
<script src="yggdrasil-tutoriel.js"></script>
```

Le tutoriel se déclenche **automatiquement** si `save.firstPlay !== false`.
Il peut être relancé manuellement avec :

```javascript
YTutorial.start('Ragnar');
```

---

## Flux de jeu complet

```
index.html
  ↓ (nouvelle partie ou continuer)
yggdrasil-carte.html  ←→  yggdrasil-village.html
        ↕                         ↕
yggdrasil-armee.html  ←→  yggdrasil-alliance.html
        ↕
yggdrasil-quetes.html
```

Toutes les pages lisent/écrivent dans `localStorage['yggdrasil_save']`
via `yggdrasil-save.js`.
