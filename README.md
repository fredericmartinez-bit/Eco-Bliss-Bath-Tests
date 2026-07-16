# Eco Bliss Bath - Tests automatisés avec Cypress

## Description

Ce projet contient les tests automatisés du site e-commerce Eco Bliss Bath.
Les tests sont écrits en JavaScript avec Cypress. Ils permettent de vérifier les fonctionnalités principales du site, les endpoints API, les smoke tests et la sécurité XSS.

## Prérequis

Avant de lancer le projet, il faut avoir installé :

- Node.js
- Docker Desktop
- Git

## Installation

Cloner le projet :

```bash
git clone https://github.com/fredericmartinez-bit/Eco-Bliss-Bath-Tests.git
cd Eco-Bliss-Bath-Tests
```

Lancer le back-end (Docker) :

```bash
docker compose up -d
```

Lancer le front-end (Angular) :

```bash
cd frontend
npm start
```

Le site est accessible sur http://localhost:4200 une fois la compilation terminée ("Compiled successfully").

## Lancer les tests Cypress

Dans un nouveau terminal, à la racine du projet :

```bash
npx cypress run --browser electron
```

Pour lancer un seul fichier de tests :

```bash
npx cypress run --spec cypress/e2e/api.cy.js --browser electron
```

Pour ouvrir Cypress en mode visuel :

```bash
npx cypress open
```

## Structure des tests

| Fichier | Nombre de tests | Contenu |
| --- | --- | --- |
| api.cy.js | 8 | Endpoints API (connexion, produits, panier, avis) |
| smoke.cy.js | 5 | Présence des éléments essentiels du site |
| xss.cy.js | 2 | Sécurité contre les injections XSS dans les avis |
| login.cy.js | 5 | Connexion utilisateur (formulaire + API) |
| cart.cy.js | 7 | Panier via l'interface (ajout, stock, limites) |

## Résultats

27 tests exécutés, 26 réussis, 1 échec volontairement conservé (anomalie du stock non mis à jour après ajout au panier — voir le bilan de campagne pour le détail).
