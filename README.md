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

git clone https://github.com/fredericmartinez-bit/Eco-Bliss-Bath-Tests.git

Entrer dans le dossier du projet :

cd Eco-Bliss-Bath-Tests

Installer les dépendances :

npm install

## Lancer le projet

Lancer l’API avec Docker :

docker compose up -d

Lancer le front-end :

cd frontend
npm install
npm start

Le front-end est accessible à l’adresse :

http://localhost:4200

Le back-end est accessible à l’adresse :

http://localhost:8081

## Lancer Cypress

Depuis la racine du projet, ouvrir Cypress en mode interactif :

npx cypress open

Puis choisir E2E Testing.

Ensuite, lancer les fichiers de tests depuis le dossier cypress/e2e.

## Lancer les tests en ligne de commande

Exécuter tous les tests :

npx cypress run --browser electron

Exécuter un fichier de test précis :

npx cypress run --spec cypress/e2e/api.cy.js --browser electron

npx cypress run --spec cypress/e2e/smoke.cy.js --browser electron

npx cypress run --spec cypress/e2e/xss.cy.js --browser electron

npx cypress run --spec cypress/e2e/login.cy.js --browser electron

npx cypress run --spec cypress/e2e/cart.cy.js --browser electron

## Structure des tests

Les fichiers de tests se trouvent dans le dossier cypress/e2e.

- api.cy.js : tests des endpoints API, notamment la connexion, les produits, le panier et les avis.
- smoke.cy.js : smoke tests pour vérifier rapidement les éléments essentiels du site.
- xss.cy.js : tests de sécurité pour vérifier l’absence de faille XSS dans l’espace commentaire.
- login.cy.js : tests fonctionnels du scénario de connexion.
- cart.cy.js : tests fonctionnels du scénario panier.

## Résultats des tests

Les tests automatisés exécutés sont les suivants :

- api.cy.js : 12 tests
- smoke.cy.js : 5 tests
- xss.cy.js : 2 tests
- login.cy.js : 5 tests
- cart.cy.js : 7 tests

Au total, 31 tests automatisés ont été exécutés.

Résultat :

- 31 tests réussis
- 0 test échoué

## Technologies utilisées

- JavaScript
- Cypress
- Docker
- Angular pour le front-end
- Symfony pour le back-end
