// Sept cas panier. Connexion API valide ; actions d'ajout par l'interface.
// Les clics passent par le site ; le panier et le stock sont aussi vérifiés avec l'API.
// Repères : get trouve un élément ; click agit ; expect et should vérifient le résultat.
describe('Test fonctionnel - Panier', () => {
  const api = 'http://localhost:8081';
  let token, initialCart, initialStock, product;
  // Cette fonction cherche la quantité du produit 6 dans le panier ; elle renvoie zéro s'il est absent.
  const quantity = (cart) => cart.orderLines.find((line) => line.product.id === 6)?.quantity || 0;
  // Avant chaque test, je prépare la connexion et je sauvegarde le panier et le stock de départ.
  beforeEach(() => {
    initialCart = undefined;
    // cy.login renvoie le token seul. Cette commande et getCart se trouvent dans cypress/support/commands.js.
    cy.login().then((value) => {
      token = value;
      return cy.getCart(token);
    // body contient le panier reçu du serveur ; initialCart en garde l'état de départ.
    }).then(({ body }) => { initialCart = body; });
    // Je lis le produit 6 et son stock, puis je vérifie qu'il est disponible pour les tests.
    cy.request(`${api}/products/6`).then(({ body }) => {
      product = body; initialStock = body.availableStock;
      expect(initialStock, 'stock nécessaire aux tests').to.be.greaterThan(1);
    });
    // J'ouvre ensuite la fiche avec le token préparé ; visitAsUser place ce token dans le navigateur.
    cy.then(() => cy.visitAsUser('/#/products/6', token));
    cy.get('[data-cy="detail-product-name"]').should('contain', 'Dans la forêt');
  });
  // Après chaque test, même après un échec d'assertion, je remets le panier comme avant.
  // Je vérifie ensuite que le stock est revenu à sa valeur de départ.
  afterEach(() => {
    if (initialCart) {
      cy.restoreCart(token, initialCart);
      cy.request(`${api}/products/6`).its('body.availableStock').should('eq', initialStock);
    }
  });
  // Cette fonction commune sert à observer un ajout, cliquer sur le bouton et attendre sa réponse.
  const add = () => {
    // intercept surveille la requête PUT d'ajout ; as lui donne le nom add.
    cy.intercept('PUT', '**/orders/add').as('add');
    // get repère le bouton grâce à data-cy ; click appuie dessus.
    cy.get('[data-cy="detail-product-add"]').click();
    // wait attend la réponse de la requête nommée add, et non une durée fixe.
    return cy.wait('@add');
  };
  it('affiche une fiche produit disponible et ses informations', () => {
    // Je vérifie le stock affiché, puis la visibilité de l'image et du bouton.
    cy.get('[data-cy="detail-product-stock"]').should('contain', `${initialStock} en stock`);
    cy.get('[data-cy="detail-product-img"]').should('be.visible').and('have.attr', 'src');
    cy.get('[data-cy="detail-product-add"]').should('be.visible');
  });
  // Après un ajout accepté avec 200, le stock de l'API doit baisser d'une unité.
  // Je recharge aussi la fiche pour contrôler la valeur affichée.
  it('diminue le stock exactement après un ajout réellement accepté', () => {
    add().its('response.statusCode').should('eq', 200);
    cy.request(`${api}/products/6`).its('body.availableStock').should('eq', initialStock - 1);
    cy.visitAsUser('/#/products/6', token);
    cy.get('[data-cy="detail-product-stock"]').should('contain', `${initialStock - 1} en stock`);
  });
  it('affiche le produit ajouté et la bonne quantité dans le panier', () => {
    add().its('response.statusCode').should('eq', 200);
    // contains retrouve la ligne du bon produit ; within limite les vérifications à cette ligne.
    cy.contains('[data-cy="cart-line"]', product.name).within(() => {
      // La quantité affichée doit être celle du départ plus une unité.
      cy.get('[data-cy="cart-line-quantity"]').should('have.value', String(quantity(initialCart) + 1));
    });
  });
  it('refuse une quantité négative sans changer le panier ni le stock', () => {
    // spy mémorise les appels à la requête d'ajout. Je peux vérifier qu'aucune demande n'est partie.
    const calls = cy.spy().as('addCalls');
    cy.intercept('PUT', '**/orders/add', calls);
    // clear vide le champ ; type saisit une quantité négative pour tester son refus.
    cy.get('[data-cy="detail-product-quantity"]').clear().type('-1');
    cy.get('[data-cy="detail-product-add"]').click();
    // Je contrôle le formulaire invalide, l'absence de requête, puis le panier et le stock inchangés.
    cy.get('[data-cy="detail-product-form"]').should('have.class', 'ng-invalid');
    cy.get('@addCalls').should('not.have.been.called');
    cy.getCart(token).its('body.orderLines').should('deep.eq', initialCart.orderLines);
    cy.request(`${api}/products/6`).its('body.availableStock').should('eq', initialStock);
  });
  // A3 : je demande 21 articles. L'attendu reste un refus 4xx sans modification des quantités.
  it('refuse 21 articles et préserve le panier et le stock (A3)', () => {
    cy.get('[data-cy="detail-product-quantity"]').clear().type('21');
    add().then(({ response }) => {
      cy.getCart(token).then(({ body }) => {
        cy.request(`${api}/products/6`).then(({ body: updated }) => {
          // J'enregistre la réponse, le stock et la quantité du panier avant de contrôler le refus attendu.
          return cy.writeFile('cypress/results/a3-quantite.json', {
            product: 6, stockBefore: initialStock, stockAfter: updated.availableStock, requestedQuantity: 21,
            status: response.statusCode, quantityBefore: quantity(initialCart), quantityAfter: quantity(body),
          }).then(() => {
            expect(response.statusCode, 'refus de la quantité excessive').to.be.within(400, 499);
            expect(body.orderLines).to.deep.eq(initialCart.orderLines);
            expect(updated.availableStock).to.eq(initialStock);
          });
        });
      });
    });
  });
  // have.text compare tout le texte affiché avec la valeur de stock reçue de l'API.
  it('affiche la disponibilité exacte retournée par l’API', () => {
    cy.get('[data-cy="detail-product-stock"]').should('be.visible')
      .and('have.text', `${initialStock} en stock`);
  });
  // Ce cas croise les deux niveaux : clic sur le site, puis contrôle du panier renvoyé par l'API.
  it('retrouve via l’API le produit et la quantité ajoutés par le bouton', () => {
    add().its('response.statusCode').should('eq', 200);
    cy.getCart(token).then(({ body }) => {
      // find cherche le produit 6 dans les lignes ; added garde la ligne trouvée.
      const added = body.orderLines.find((line) => line.product.id === 6);
      // Je vérifie d'abord que le bon produit existe, puis que sa quantité a augmenté d'une unité.
      expect(added, 'produit présent dans le panier').to.exist;
      expect(added.quantity).to.eq(quantity(initialCart) + 1);
    });
  });
});
