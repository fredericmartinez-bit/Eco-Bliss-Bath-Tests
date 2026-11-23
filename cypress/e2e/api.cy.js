// Huit cas API : les attentes métier restent visibles, y compris en cas d'anomalie.
describe('Tests API', () => {
  const api = 'http://localhost:8081';
  let token, initialCart;
  beforeEach(() => {
    initialCart = undefined;
    cy.login().then((value) => {
      token = value;
      return cy.getCart(token);
    }).then(({ body }) => { initialCart = body; });
  });
  afterEach(() => {
    if (initialCart) cy.restoreCart(token, initialCart);
  });

  it('refuse /orders sans authentification avec 401 (écart A1 avec Marie)', () => {
    cy.request({ url: `${api}/orders`, failOnStatusCode: false }).then(({ status }) => {
      expect(status).to.eq(401);
    });
  });
  it('retourne le panier de l’utilisateur authentifié', () => {
    cy.getCart(token).its('body').should('have.property', 'id');
  });
  it('retourne les informations du produit demandé', () => {
    cy.request(`${api}/products/6`).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.id).to.eq(6);
      expect(body.name).to.be.a('string').and.not.be.empty;
      expect(body.availableStock).to.be.a('number');
    });
  });
  it('refuse les identifiants inconnus avec 401', () => {
    cy.request({ method: 'POST', url: `${api}/login`,
      body: { username: 'inconnu@test.fr', password: 'mauvaismotdepasse' },
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });
  it('retourne un token pour les bons identifiants', () => {
    cy.login().should('be.a', 'string').and('not.be.empty');
  });
  it('constate POST refusé puis vérifie l’ajout par PUT (écart A2)', () => {
    cy.request({ method: 'POST', url: `${api}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product: 6, quantity: 1 }, failOnStatusCode: false,
    }).then(({ status, headers }) => {
      expect(status).to.eq(405);
      expect(headers.allow).to.include('PUT');
    });
    cy.request(`${api}/products/6`).its('body.availableStock').should('be.greaterThan', 1);
    cy.addToCart(6, 1, token).its('status').should('eq', 200);
    cy.getCart(token).then(({ body }) => {
      const before = initialCart.orderLines.find((line) => line.product.id === 6)?.quantity || 0;
      expect(body.orderLines.find((line) => line.product.id === 6)?.quantity).to.eq(before + 1);
    });
  });
  it('refuse un ajout en rupture sans modifier le panier ni le stock (A3)', () => {
    cy.request(`${api}/products`).then(({ body }) => {
      const product = body.find((item) => item.availableStock === 0);
      expect(product, 'précondition : un produit en rupture doit exister').to.exist;
      cy.addToCart(product.id, 1, token).then((response) => {
        cy.getCart(token).then(({ body: cart }) => {
          cy.request(`${api}/products/${product.id}`).then(({ body: updated }) => {
            return cy.writeFile('cypress/results/a3-rupture.json', {
              product: product.id, stockBefore: product.availableStock, stockAfter: updated.availableStock,
              requestedQuantity: 1, status: response.status, cartBefore: initialCart.orderLines, cartAfter: cart.orderLines,
            }).then(() => {
              expect(response.status, 'refus de la quantité indisponible').to.be.within(400, 499);
              expect(cart.orderLines).to.deep.eq(initialCart.orderLines);
              expect(updated.availableStock).to.eq(0);
            });
          });
        });
      });
    });
  });
  it('enregistre un avis et le retrouve dans la liste', () => {
    const title = `Avis API ${Date.now()}`;
    const comment = 'Avis créé par un test automatisé';
    cy.request({ method: 'POST', url: `${api}/reviews`,
      headers: { Authorization: `Bearer ${token}` }, body: { title, comment, rating: 5 },
    }).then(({ status }) => { expect(status).to.be.oneOf([200, 201]); });
    cy.request(`${api}/reviews`).then(({ body }) => {
      const review = body.find((item) => item.title === title);
      expect(review, 'avis enregistré').to.exist;
      expect(review.comment).to.eq(comment);
      expect(review.rating).to.eq(5);
    });
  });
});
