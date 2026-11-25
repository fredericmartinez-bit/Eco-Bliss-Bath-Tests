// Cinq cas : affichage, connexion réelle, refus et champs obligatoires.
// Je teste une connexion réelle et les refus attendus, pas seulement l'affichage du formulaire.
// Repères : get trouve un champ ; type le remplit ; click appuie ; expect et should vérifient.
describe('Test fonctionnel - Connexion', () => {
  // beforeEach ouvre la page de connexion avant chacun des cinq tests.
  beforeEach(() => { cy.visit('/#/login'); });
  it('affiche les champs et le bouton du formulaire', () => {
    // forEach répète le même contrôle de visibilité pour les quatre éléments du formulaire.
    ['login-form', 'login-input-username', 'login-input-password', 'login-submit']
      .forEach((selector) => cy.get(`[data-cy="${selector}"]`).should('be.visible'));
  });
  it('connecte réellement l’utilisateur avec les bons identifiants', () => {
    // intercept surveille la demande POST de connexion ; as lui donne le nom login.
    cy.intercept('POST', '**/login').as('login');
    // Je saisis les bons identifiants. log:false masque le mot de passe dans le journal Cypress.
    cy.get('[data-cy="login-input-username"]').type('test2@test.fr');
    cy.get('[data-cy="login-input-password"]').type('testtest', { log: false });
    cy.get('[data-cy="login-submit"]').click();
    // wait attend la réponse nommée login ; then me permet de lire cette réponse.
    cy.wait('@login').then(({ response }) => {
      // Je vérifie 200, puis je compare le token du navigateur à celui renvoyé par le serveur.
      expect(response.statusCode).to.eq(200);
      const token = response.body.token;
      cy.window().its('localStorage').invoke('getItem', 'user').should('eq', token);
    });
    // Je contrôle aussi la sortie de la page de connexion et la visibilité du lien vers le panier.
    cy.location('hash').should('not.include', '/login');
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
  });
  // Avec de mauvais identifiants, j'attends 401, un message d'erreur et aucune connexion enregistrée.
  it('affiche une erreur et refuse les mauvais identifiants', () => {
    cy.intercept('POST', '**/login').as('login');
    cy.get('[data-cy="login-input-username"]').type('fake@test.fr');
    cy.get('[data-cy="login-input-password"]').type('wrongpass', { log: false });
    cy.get('[data-cy="login-submit"]').click();
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    // Je vérifie le message affiché, l'absence de token et l'absence du lien vers le panier.
    cy.get('[data-cy="login-errors"]').should('contain', 'Identifiants incorrects');
    cy.window().its('localStorage').invoke('getItem', 'user').should('be.null');
    cy.get('[data-cy="nav-link-cart"]').should('not.exist');
  });
  it('refuse les champs vides sans envoyer de connexion', () => {
    // spy sert de témoin : l'interception l'appelle seulement si la demande de connexion est envoyée.
    const calls = cy.spy().as('loginCalls');
    cy.intercept('POST', '**/login', calls);
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-errors"]').should('contain', 'Merci de remplir');
    // Les champs vides doivent empêcher l'envoi au serveur ; le témoin ne doit pas avoir été appelé.
    cy.get('@loginCalls').should('not.have.been.called');
    cy.get('[data-cy="nav-link-cart"]').should('not.exist');
  });
  it('utilise le token retourné par l’API pour accéder au panier', () => {
    // cy.login est une commande du projet, définie dans cypress/support/commands.js.
    // Elle demande une connexion à l'API et renvoie le token, sans remplir le formulaire.
    cy.login().then((token) => {
      // Je surveille la lecture du panier ; le token sera stocké seul dans localStorage.user.
      cy.intercept('GET', '**/orders').as('cart');
      // La page de connexion est déjà ouverte sur la bonne origine.
      cy.window().then((win) => win.localStorage.setItem('user', token));
      // Recharge le menu après la préparation de la connexion API.
      cy.reload();
      cy.visit('/#/cart');
      // Après l'ouverture du panier, j'attends 200, je contrôle le token conservé et le lien du panier.
      cy.wait('@cart').its('response.statusCode').should('eq', 200);
      cy.window().its('localStorage').invoke('getItem', 'user').should('eq', token);
      cy.get('[data-cy="nav-link-cart"]').should('be.visible');
    });
  });
});
