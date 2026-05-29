# Eco Bliss Bath - Tests automatises avec Cypress

## Description

Tests automatises pour le site e-commerce Eco Bliss Bath. Les tests sont ecrits en JavaScript avec Cypress.

## Prerequis

- Node.js (version LTS)
- Docker Desktop
- Git

## Installation

1. Cloner le projet
   git clone https://github.com/fredericmartinez-bit/Eco-Bliss-Bath-Tests.git

2. Lancer l'API avec Docker
   docker compose up -d

3. Lancer le frontend
   cd frontend
   npm install
   npm start
   Le site est accessible sur http://localhost:4200

4. Installer Cypress
   cd ..
   npm install cypress --save-dev

## Lancer les tests

Executer tous les tests :
   npx cypress run --browser electron

Executer un test specifique :
   npx cypress run --spec cypress/e2e/api.cy.js --browser electron
   npx cypress run --spec cypress/e2e/smoke.cy.js --browser electron
   npx cypress run --spec cypress/e2e/xss.cy.js --browser electron
   npx cypress run --spec cypress/e2e/login.cy.js --browser electron
   npx cypress    npx cypress    npx cypressy.js --browser electron

Ouvrir Cypress en mode interactif :
   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c   npx c  ion   nnpx cypress run.
Les captures d'ecran des tests echoues sont sauvegardees dans cypress/screenshots/.

## Structure des tests

- cypress/e2e/api.cy.js : Tests des endpoints API
- cypress/e2e/smoke.cy.js : Smoke tests
- cypress/e- cypress/e- cypressde faille XSS
- c- c- c- c- c-gin.cy.js : Test fonctionnel connexion
- cypress/e2e/cart.cy.js : Test fonctionnel panier
- cypres- cypres- cypres- cypres- cyprees r- cypres- cypres-Tech- cypres- cypres- cypr5.14.2
- JavaScript
- Docker
- Angular (fro- Angular (fro- Angular (f
