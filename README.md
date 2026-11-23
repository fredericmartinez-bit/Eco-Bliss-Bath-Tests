# Eco Bliss Bath - Tests automatisés avec Cypress

Ce dépôt contient les tests JavaScript/Cypress du site e-commerce Eco Bliss Bath : tests API, contrôles rapides de l’interface, connexion, panier et essais d’injection XSS dans les avis.

## 1. Prérequis

- Git.
- Node.js 24.x avec npm. Les vérifications du 23 novembre 2026 utilisent Node.js 24.12.0 et npm 11.6.2 sur macOS.
- Docker Desktop installé **et démarré**.
- Une connexion Internet pour télécharger les dépendances, Cypress et les images Docker.
- Les ports `4200` (Angular) et `8081` (API Symfony) disponibles.

Vérifier les outils dans un terminal :

```bash
git --version
node --version
npm --version
docker --version
docker compose version
docker info
```

`docker info` doit afficher les informations du serveur Docker, sans erreur de connexion. Les avertissements de dépréciation npm ne constituent pas à eux seuls un échec d’installation.

## 2. Télécharger le projet

```bash
git clone https://github.com/fredericmartinez-bit/Eco-Bliss-Bath-Tests.git
cd Eco-Bliss-Bath-Tests
```

Dans la suite, la **racine du dépôt** désigne ce dossier : il contient `README.md`, `docker-compose.yml`, `cypress.config.js`, `cypress/` et `frontend/`.

## 3. Préparer les données lors d’une première installation

Le dépôt contient déjà un dossier `mysql/`. Dans un **nouveau clone**, avant tout démarrage Docker, le conserver sous un autre nom pour que MariaDB initialise une base neuve à partir du fichier SQL fourni dans `data/`.

Sur macOS ou Linux, depuis la racine :

```bash
mv mysql mysql_fourni
```

Sous Windows PowerShell, depuis la racine :

```powershell
Rename-Item -Path mysql -NewName mysql_fourni
```

Cette opération conserve le dossier fourni. Au démarrage, Docker crée un nouveau dossier `mysql/` et importe les données SQL. Sur une installation déjà utilisée, conserver les données existantes et passer cette étape ; ne pas déplacer un dossier de base de données pendant que MariaDB fonctionne.

## 4. Installer les dépendances du front et Cypress

Depuis la racine du dépôt :

```bash
cd frontend
npm ci
npx cypress install
npx cypress version
cd ..
```

`npm ci` utilise `frontend/package-lock.json` et installe les dépendances Angular ainsi que la version verrouillée de Cypress (15.15.0). L’installation de Cypress peut prendre quelques minutes au premier lancement.

Le front à lancer est **`frontend/`**, et non le sous-dossier `frontend/frontend/`.

## 5. Démarrer l’API et la base de données

Dans le **terminal 1**, depuis la racine :

```bash
docker compose up -d --wait --wait-timeout 120
docker compose ps
```

Attendre que les services MariaDB (`bliss-bath-bdd`) et Symfony (`bliss-bath-symfony`) soient indiqués `healthy`. Au premier lancement, le téléchargement des images et l’initialisation de la base peuvent prendre du temps.

Ouvrir ensuite <http://localhost:8081/api/health>. La réponse attendue est :

```json
{"status":"ok"}
```

Le back-end utilise une image préparée : aucune installation locale de PHP ou Composer n’est nécessaire pour cette procédure.

## 6. Démarrer le site Angular

Dans le **terminal 2**, ouvrir la racine du dépôt puis :

```bash
cd frontend
npm start
```

Garder ce terminal ouvert. Attendre `Compiled successfully`, puis ouvrir <http://localhost:4200>.

Compte de démonstration utilisé par les scripts, présent dans les données fournies :

- E-mail : `test2@test.fr`
- Mot de passe : `testtest`

## 7. Lancer Cypress avec la configuration du dépôt

Dans le **terminal 3**, ouvrir la **racine du dépôt**. Les tests et leur configuration se trouvent à la racine, alors que le paquet Cypress est installé dans `frontend/node_modules/`.

Configurer une fois le chemin des modules dans ce terminal.

Sur macOS ou Linux :

```bash
export NODE_PATH="$PWD/frontend/node_modules"
```

Sous Windows PowerShell :

```powershell
$env:NODE_PATH = (Resolve-Path "./frontend/node_modules").Path
```

Cela permet à `cypress.config.js` de charger le paquet Cypress installé dans `frontend/`, sans installer une autre version à la racine. Refaire ce réglage si un nouveau terminal est ouvert.

Les commandes suivantes s’exécutent depuis la racine, après ce réglage. Elles utilisent explicitement le Cypress installé et le projet racine ; elles ne sélectionnent pas la configuration secondaire `frontend/cypress.config.ts`.

### Mode visuel

```bash
node frontend/node_modules/cypress/bin/cypress open --project . --e2e
```

Choisir le navigateur, puis le fichier de tests à lancer.

### Campagne complète en terminal

```bash
node frontend/node_modules/cypress/bin/cypress run --project . --browser electron
```

### Un seul fichier

```bash
node frontend/node_modules/cypress/bin/cypress run --project . --spec "cypress/e2e/api.cy.js" --browser electron
```

Remplacer `api.cy.js` par le fichier souhaité. Une exécution peut modifier le panier, les avis et les stocks : utiliser les données locales de test.

## 8. Générer les rapports

Pour produire un rapport JUnit XML par fichier de tests, sans installer de reporter supplémentaire :

```bash
node frontend/node_modules/cypress/bin/cypress run --project . --browser electron --reporter junit --reporter-options "mochaFile=cypress/results/result-[hash].xml,toConsole=true"
```

Les fichiers sont enregistrés dans `cypress/results/`. Le marqueur `[hash]` évite qu’un fichier écrase le rapport du précédent. Conserver la date, la commande, les résultats et les captures utiles pour chaque campagne. Les captures d’échec, lorsqu’elles sont produites, se trouvent dans `cypress/screenshots/`.

## 9. Organisation des tests

| Fichier | Nombre | Rôle |
| --- | ---: | --- |
| `api.cy.js` | 8 | Appels directs au serveur : connexion, produits, panier et avis |
| `smoke.cy.js` | 5 | Vérifications rapides de la présence des éléments essentiels |
| `xss.cy.js` | 2 | Essais d’injection dans le titre et le commentaire d’un avis |
| `login.cy.js` | 5 | Formulaire et API de connexion |
| `cart.cy.js` | 7 | Produits, ajout au panier, stock et quantités |
| **Total** | **27** | |

Ce travail se rapporte à l’ancien énoncé OpenClassrooms, antérieur à la mise à jour du 28 mai 2025 ; les tests XSS sont un complément dans ce périmètre.

## 10. Résultats de référence et anomalie A3

Le bilan de la **campagne de référence** rapporte **27 tests exécutés, 26 réussites et 1 échec dans `cart.cy.js`**. Ces chiffres décrivent cette campagne historique ; ils ne garantissent pas le résultat d’une nouvelle exécution.

Les contrôles ciblés ultérieurs ont confirmé A3 : un ajout de **21 articles** a été accepté avec seulement **3 disponibles**, et le stock est passé à **-18**. Le défaut concerne la validation des quantités côté serveur. Un ajout normal fait bien diminuer le stock : l’ancienne description d’un simple défaut de rafraîchissement ne correspond pas à l’anomalie confirmée.

Ces contrôles ciblés sont distincts de la campagne de référence. Les assertions des scripts ont été renforcées dans la campagne datée ci-dessous. Un test réussi ne prouve pas toute la conformité métier. Après correction de l’application ou des scripts, effectuer une nouvelle campagne et documenter ses résultats séparément.

### Campagne après correction des scripts le 23 novembre 2026

Les scripts ont été corrigés pour contrôler une authentification réelle, le produit et la quantité ajoutés, la diminution du stock et les refus attendus. Les attentes sur les routes API remplacent les pauses fixes. Les tests XSS soumettent un avis, vérifient sa persistance puis son réaffichage et observent les alertes dès le début.

Les 27 cas restent répartis dans les cinq mêmes fichiers :

| Fichier | Réussites | Échecs |
| --- | ---: | ---: |
| api.cy.js | 7 | 1 |
| cart.cy.js | 6 | 1 |
| login.cy.js | 5 | 0 |
| smoke.cy.js | 5 | 0 |
| xss.cy.js | 2 | 0 |
| **Total** | **25** | **2** |

Ces deux échecs détectent **A3**, sans créer une quatrième fiche d’anomalie :

- Le produit 4 en rupture (stock 0) accepte 1 unité avec une réponse 200 : stock -1 et quantité au panier de 1 à 2.
- Le produit 6 (stock 12) accepte 21 unités avec une réponse 200 : stock -9 et quantité au panier de 0 à 21.

Les tests attendent un refus (4xx) et des quantités inchangées. Les ajouts normaux et leur baisse de stock passent. Les cinq tests de connexion, les cinq smoke tests et les deux cas XSS passent. A1 et A2 restent des écarts avec les attentes initiales de Marie ; l’application n’a pas été modifiée.

Les quantités initiales du panier sont restaurées après chaque test API ou panier, y compris après un échec. Les avis de test, identifiés par des titres uniques, restent dans cette base locale. Utiliser uniquement un environnement et un compte de test ; ne pas exécuter cette campagne en production.

Ce passage a été réalisé avec Node.js 24.12.0, npm 11.6.2, Cypress 15.15.0 et Electron 138, sur une base séparée initialisée à partir du SQL fourni. Ses résultats sont distincts de la campagne historique à 26 réussites et 1 échec. Ils sont détaillés dans l’actualisation du bilan. La correction de la validation des quantités relève de l’équipe de développement ; les tests de refus devront être réexécutés après cette correction.

## 11. Arrêter les services

Arrêter le front avec `Ctrl+C` dans le terminal 2. Depuis la racine, arrêter l’API et la base :

```bash
docker compose stop
```

Les données de `mysql/` sont conservées. Pour redémarrer, relancer l’étape Docker et `npm start` dans `frontend/`.

## 12. Dépannage

- **Docker ne répond pas** : ouvrir Docker Desktop, attendre son démarrage et vérifier `docker info` avant de relancer la commande Compose.
- **Conteneur non sain** : consulter `docker compose logs --tail=100 bliss-bath-bdd bliss-bath-symfony`. Sur un nouveau clone, vérifier la préparation du dossier `mysql/` décrite à l’étape 3.
- **API indisponible** : vérifier que le port 8081 est libre et que `/api/health` répond avant les tests.
- **Site indisponible** : garder `npm start` ouvert et attendre la compilation sur le port 4200.
- **Module Cypress introuvable** : vérifier que `npm ci` a terminé dans `frontend/`, que le terminal est à la racine et que `NODE_PATH` a été défini dans ce terminal.
- **Binaire Cypress absent** : relancer `npx cypress install` depuis `frontend/`.
- **Port ou nom de conteneur déjà utilisé** : arrêter l’autre instance du même projet avant de démarrer celle-ci.

Références : [commandes Cypress](https://docs.cypress.io/app/references/command-line), [rapports Cypress](https://docs.cypress.io/app/tooling/reporters).
