// Cinq contrôles rapides de présence. Ils ne remplacent pas les tests métier.
// Ces cinq tests vérifient rapidement la présence des éléments essentiels.
// Repères : get sélectionne un élément avec data-cy ; should contrôle ce qui est attendu.
describe('Smoke Tests', () => {
  it('affiche les champs et le bouton de connexion', () => {
    // visit ouvre la page de connexion. La boucle vérifie chacun des quatre éléments listés.
    cy.visit('/#/login');
    ['login-input-username', 'login-input-password', 'login-form', 'login-submit']
      .forEach((name) => cy.get(`[data-cy="${name}"]`).should('be.visible'));
  });
  it('affiche les liens essentiels de navigation', () => {
    cy.visit('/');
    // contains cherche chaque lien grâce à son texte ; be.visible vérifie qu'il est affiché.
    ['Accueil', 'Produits', 'Avis', 'Connexion']
      .forEach((text) => cy.contains('a', text).should('be.visible'));
  });
  it('affiche des produits et leurs images dans la sélection', () => {
    // Je surveille la liste des produits et je lui donne le nom products avant d'ouvrir la page.
    cy.intercept('GET', '**/products/random').as('products');
    cy.visit('/');
    // J'attends la réponse et je contrôle son code 200, plutôt que de faire une pause fixe.
    cy.wait('@products').its('response.statusCode').should('eq', 200);
    // La sélection doit contenir au moins un produit ; first choisit le premier élément pour les contrôles suivants.
    cy.get('[data-cy="product-home"]').should('have.length.greaterThan', 0);
    cy.get('[data-cy="product-home-img"]').first().should('be.visible').and('have.attr', 'src');
    // invoke('text') lit le texte du nom ; celui-ci ne doit pas être vide.
    cy.get('[data-cy="product-home-name"]').first().invoke('text').should('not.be.empty');
  });
  it('affiche les boutons Consulter pour un utilisateur connecté', () => {
    // Les commandes login et visitAsUser sont dans cypress/support/commands.js.
    // Je prépare la connexion par l'API, puis j'ouvre le site avec le token obtenu.
    cy.login().then((token) => cy.visitAsUser('/', token));
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
    cy.get('[data-cy="product-home-link"]').should('have.length.greaterThan', 0)
      // each parcourt les boutons ; wrap permet d'appliquer les vérifications Cypress à chacun.
      .each(($button) => cy.wrap($button).should('be.visible').and('contain', 'Consulter'));
  });
  it('affiche le bouton d’ajout sur une fiche produit après connexion', () => {
    // Je contrôle le bouton d'ajout sur la fiche d'un utilisateur connecté.
    // Sa présence seule ne prouve pas que l'ajout au panier fonctionne : les tests panier le vérifient.
    cy.login().then((token) => cy.visitAsUser('/#/products/6', token));
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
    cy.get('[data-cy="detail-product-add"]').should('be.visible').and('contain', 'Ajouter au panier');
  });
});
