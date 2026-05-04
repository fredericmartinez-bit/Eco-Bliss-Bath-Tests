# Eco Bliss Bath - Tests automatises avec Cypress

## Description du projet

Ce projet contient les tests automatises pour le site e-commerce Eco Bliss Bath, une start-up de produits de beaute ecoresponsables. Les tests sont ecrits en JavaScript avec le framework Cypress.

## Prerequis

- Node.js (version LTS recommandee) : https://nodejs.org
- Docker Desktop : https://www.docker.com/products/docker-desktop
- Git : https://git-scm.com

## Installation

### 1. Cloner le projet

git clone https://github.com/fredericmartinez-bit/Eco-Bliss-Bath-Tests.git
cd Eco-Bliss-Bath-Tests

### 2. Lancer l'application avec Docker

docker compose up -d

Verifiez que les conteneurs tournent :

docker ps

Vous devriez voir bliss-bath-symfony (API) sur le port 8081 et bliss-bath-bdd (BDD) sur le port 3306.

### 3. Lancer le frontend

cd frontend
npm install
npm start

Le frontend sera accessible sur http://localhost:4200

### 4. Installer Cypress

cd ..
npm install
npm install cypress --save-dev

## Lancer les tests

### Executer tous les tests (mode headless)

npx cypress run

### Executer un fichier de test specifique

npx cypress run --spec cypress/e2e/api.cy.js
npx cypress run --spec cypress/e2e/smoke.cy.js
npx cypress run --spec cypress/e2e/xss.cy.js
npx cypress run --spec cypress/e2e/login.cy.js
npx cypress run --spec cypress/e2e/cart.cy.js

### Ouvrir Cypress en mode interactif

npx cypress open

Selectionnez E2E Testing puis le navigateur Electron.

## Structure des tests

- cypress/e2e/api.cy.js : Tests des endpoints API (GET, POST, PUT)
- cypress/e2e/smoke.cy.js : Smoke tests - verification des elements essentiels
- cypress/e2e/xss.cy.js : Test de faille XSS sur l'espace commentaire
- cypress/e2e/login.cy.js : Test fonctionnel - Connexion utilisateur
- cypress/e2e/cart.cy.js : Test fonctionnel - Gestion du panier
- cypress/support/commands.js : Commandes Cypress reutilisables

## Generation du rapport

Les resultats des tests s'affichent dans le terminal apres l'execution de npx cypress run.
Les captures d'ecran des tests echoues sont sauvegardees dans cypress/screenshots/.

## Technologies utilisees

- Cypress v15.14.2 - Framework de tests E2E
- JavaScript - Langage des scripts de test
- Docker - Conteneurisation de l'application
- Angular - Framework frontend
- Symfony - Framework backend API
