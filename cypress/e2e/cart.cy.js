// Sept cas panier. Connexion API valide ; actions d'ajout par l'interface.
describe('Test fonctionnel - Panier', () => {
  const api = 'http://localhost:8081';
  let token, initialCart, initialStock, product;
  const quantity = (cart) => cart.orderLines.find((line) => line.product.id === 6)?.quantity || 0;
  beforeEach(() => {
    initialCart = undefined;
    cy.login().then((value) => {
      token = value;
      return cy.getCart(token);
    }).then(({ body }) => { initialCart = body; });
    cy.request(`${api}/products/6`).then(({ body }) => {
      product = body; initialStock = body.availableStock;
      expect(initialStock, 'stock nécessaire aux tests').to.be.greaterThan(1);
    });
    cy.then(() => cy.visitAsUser('/#/products/6', token));
    cy.get('[data-cy="detail-product-name"]').should('contain', 'Dans la forêt');
  });
  afterEach(() => {
    if (initialCart) {
      cy.restoreCart(token, initialCart);
      cy.request(`${api}/products/6`).its('body.availableStock').should('eq', initialStock);
    }
  });
  const add = () => {
    cy.intercept('PUT', '**/orders/add').as('add');
    cy.get('[data-cy="detail-product-add"]').click();
    return cy.wait('@add');
  };
  it('affiche une fiche produit disponible et ses informations', () => {
    cy.get('[data-cy="detail-product-stock"]').should('contain', `${initialStock} en stock`);
    cy.get('[data-cy="detail-product-img"]').should('be.visible').and('have.attr', 'src');
    cy.get('[data-cy="detail-product-add"]').should('be.visible');
  });
  it('diminue le stock exactement après un ajout réellement accepté', () => {
    add().its('response.statusCode').should('eq', 200);
    cy.request(`${api}/products/6`).its('body.availableStock').should('eq', initialStock - 1);
    cy.visitAsUser('/#/products/6', token);
    cy.get('[data-cy="detail-product-stock"]').should('contain', `${initialStock - 1} en stock`);
  });
  it('affiche le produit ajouté et la bonne quantité dans le panier', () => {
    add().its('response.statusCode').should('eq', 200);
    cy.contains('[data-cy="cart-line"]', product.name).within(() => {
      cy.get('[data-cy="cart-line-quantity"]').should('have.value', String(quantity(initialCart) + 1));
    });
  });
  it('refuse une quantité négative sans changer le panier ni le stock', () => {
    const calls = cy.spy().as('addCalls');
    cy.intercept('PUT', '**/orders/add', calls);
    cy.get('[data-cy="detail-product-quantity"]').clear().type('-1');
    cy.get('[data-cy="detail-product-add"]').click();
    cy.get('[data-cy="detail-product-form"]').should('have.class', 'ng-invalid');
    cy.get('@addCalls').should('not.have.been.called');
    cy.getCart(token).its('body.orderLines').should('deep.eq', initialCart.orderLines);
    cy.request(`${api}/products/6`).its('body.availableStock').should('eq', initialStock);
  });
  it('refuse 21 articles et préserve le panier et le stock (A3)', () => {
    cy.get('[data-cy="detail-product-quantity"]').clear().type('21');
    add().then(({ response }) => {
      cy.getCart(token).then(({ body }) => {
        cy.request(`${api}/products/6`).then(({ body: updated }) => {
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
  it('affiche la disponibilité exacte retournée par l’API', () => {
    cy.get('[data-cy="detail-product-stock"]').should('be.visible')
      .and('have.text', `${initialStock} en stock`);
  });
  it('retrouve via l’API le produit et la quantité ajoutés par le bouton', () => {
    add().its('response.statusCode').should('eq', 200);
    cy.getCart(token).then(({ body }) => {
      const added = body.orderLines.find((line) => line.product.id === 6);
      expect(added, 'produit présent dans le panier').to.exist;
      expect(added.quantity).to.eq(quantity(initialCart) + 1);
    });
  });
});
