// Cinq contrôles rapides de présence. Ils ne remplacent pas les tests métier.
describe('Smoke Tests', () => {
  it('affiche les champs et le bouton de connexion', () => {
    cy.visit('/#/login');
    ['login-input-username', 'login-input-password', 'login-form', 'login-submit']
      .forEach((name) => cy.get(`[data-cy="${name}"]`).should('be.visible'));
  });
  it('affiche les liens essentiels de navigation', () => {
    cy.visit('/');
    ['Accueil', 'Produits', 'Avis', 'Connexion']
      .forEach((text) => cy.contains('a', text).should('be.visible'));
  });
  it('affiche des produits et leurs images dans la sélection', () => {
    cy.intercept('GET', '**/products/random').as('products');
    cy.visit('/');
    cy.wait('@products').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="product-home"]').should('have.length.greaterThan', 0);
    cy.get('[data-cy="product-home-img"]').first().should('be.visible').and('have.attr', 'src');
    cy.get('[data-cy="product-home-name"]').first().invoke('text').should('not.be.empty');
  });
  it('affiche les boutons Consulter pour un utilisateur connecté', () => {
    cy.login().then((token) => cy.visitAsUser('/', token));
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
    cy.get('[data-cy="product-home-link"]').should('have.length.greaterThan', 0)
      .each(($button) => cy.wrap($button).should('be.visible').and('contain', 'Consulter'));
  });
  it('affiche le bouton d’ajout sur une fiche produit après connexion', () => {
    cy.login().then((token) => cy.visitAsUser('/#/products/6', token));
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
    cy.get('[data-cy="detail-product-add"]').should('be.visible').and('contain', 'Ajouter au panier');
  });
});
