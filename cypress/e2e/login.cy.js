// Cinq cas : affichage, connexion réelle, refus et champs obligatoires.
describe('Test fonctionnel - Connexion', () => {
  beforeEach(() => { cy.visit('/#/login'); });
  it('affiche les champs et le bouton du formulaire', () => {
    ['login-form', 'login-input-username', 'login-input-password', 'login-submit']
      .forEach((selector) => cy.get(`[data-cy="${selector}"]`).should('be.visible'));
  });
  it('connecte réellement l’utilisateur avec les bons identifiants', () => {
    cy.intercept('POST', '**/login').as('login');
    cy.get('[data-cy="login-input-username"]').type('test2@test.fr');
    cy.get('[data-cy="login-input-password"]').type('testtest', { log: false });
    cy.get('[data-cy="login-submit"]').click();
    cy.wait('@login').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      const token = response.body.token;
      cy.window().its('localStorage').invoke('getItem', 'user').should('eq', token);
    });
    cy.location('hash').should('not.include', '/login');
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
  });
  it('affiche une erreur et refuse les mauvais identifiants', () => {
    cy.intercept('POST', '**/login').as('login');
    cy.get('[data-cy="login-input-username"]').type('fake@test.fr');
    cy.get('[data-cy="login-input-password"]').type('wrongpass', { log: false });
    cy.get('[data-cy="login-submit"]').click();
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.get('[data-cy="login-errors"]').should('contain', 'Identifiants incorrects');
    cy.window().its('localStorage').invoke('getItem', 'user').should('be.null');
    cy.get('[data-cy="nav-link-cart"]').should('not.exist');
  });
  it('refuse les champs vides sans envoyer de connexion', () => {
    const calls = cy.spy().as('loginCalls');
    cy.intercept('POST', '**/login', calls);
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-errors"]').should('contain', 'Merci de remplir');
    cy.get('@loginCalls').should('not.have.been.called');
    cy.get('[data-cy="nav-link-cart"]').should('not.exist');
  });
  it('utilise le token retourné par l’API pour accéder au panier', () => {
    cy.login().then((token) => {
      cy.intercept('GET', '**/orders').as('cart');
      // La page de connexion est déjà ouverte sur la bonne origine.
      cy.window().then((win) => win.localStorage.setItem('user', token));
      // Recharge le menu après la préparation de la connexion API.
      cy.reload();
      cy.visit('/#/cart');
      cy.wait('@cart').its('response.statusCode').should('eq', 200);
      cy.window().its('localStorage').invoke('getItem', 'user').should('eq', token);
      cy.get('[data-cy="nav-link-cart"]').should('be.visible');
    });
  });
});
