// Commande de connexion via l'API (réutilisable)
Cypress.Commands.add("login", (email = "test2@test.fr", password = "testtest") => {
  cy.request("POST", "http://localhost:8081/login", {
    username: email,
    password: password,
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem("user", JSON.stringify(response.body));
    return response.body.token;
  });
});

// Commande pour ajouter un produit au panier via l'API
Cypress.Commands.add("addToCart", (productId, quantity, token) => {
  cy.request({
    method: "PUT",
    url: "http://localhost:8081/orders/add",
    headers: { Authorization: `Bearer ${token}` },
    body: { product: productId, quantity: quantity },
    failOnStatusCode: false,
  });
});

// Commande pour récupérer le panier via l'API
Cypress.Commands.add("getCart", (token) => {
  cy.request({
    method: "GET",
    url: "http://localhost:8081/orders",
    headers: { Authorization: `Bearer ${token}` },
  });
});
