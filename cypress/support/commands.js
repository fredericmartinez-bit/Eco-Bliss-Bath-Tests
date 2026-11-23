// L'API retourne un objet ; l'application attend uniquement sa propriété token.
Cypress.Commands.add('login', (email = 'test2@test.fr', password = 'testtest') => {
  return cy.request('POST', 'http://localhost:8081/login', {
    username: email, password,
  }).then(({ status, body }) => {
    expect(status).to.eq(200);
    expect(body.token).to.be.a('string').and.not.be.empty;
    return body.token;
  });
});

Cypress.Commands.add('visitAsUser', (path, token, options = {}) => {
  return cy.visit(path, {
    ...options,
    onBeforeLoad(win) {
      win.localStorage.setItem('user', token);
      if (options.onBeforeLoad) options.onBeforeLoad(win);
    },
  });
});

Cypress.Commands.add('getCart', (token) => {
  return cy.request({
    url: 'http://localhost:8081/orders',
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.orderLines).to.be.an('array');
    return response;
  });
});

Cypress.Commands.add('addToCart', (product, quantity, token) => {
  return cy.request({
    method: 'PUT', url: 'http://localhost:8081/orders/add',
    headers: { Authorization: `Bearer ${token}` },
    body: { product, quantity }, failOnStatusCode: false,
  });
});

// Remet les quantités initiales après chaque test, même si son assertion échoue.
Cypress.Commands.add('restoreCart', (token, snapshot) => {
  return cy.getCart(token).then(({ body }) => {
    return cy.wrap(body.orderLines, { log: false }).each((line) => {
      const before = snapshot.orderLines.find((item) => item.product.id === line.product.id);
      if (!before) {
        return cy.request({
          method: 'DELETE', url: `http://localhost:8081/orders/${line.id}/delete`,
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (before.quantity !== line.quantity) {
        return cy.request({
          method: 'PUT', url: `http://localhost:8081/orders/${line.id}/change-quantity`,
          headers: { Authorization: `Bearer ${token}` }, body: { quantity: before.quantity },
        });
      }
    });
  }).then(() => cy.getCart(token)).then(({ body }) => {
    const quantities = (order) => order.orderLines
      .map((line) => [line.product.id, line.quantity]).sort((a, b) => a[0] - b[0]);
    expect(quantities(body), 'panier restauré').to.deep.eq(quantities(snapshot));
  });
});
