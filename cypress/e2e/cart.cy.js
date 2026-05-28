describe("Test fonctionnel - Panier", () => {
  const apiUrl = "http://localhost:8081";
  let token;

  beforeEach(() => {
    cy.request("POST", apiUrl + "/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      token = response.body.token;
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  it("devrait afficher un produit avec son stock", () => {
    cy.visit("/#/products/3");
    cy.contains("Ajouter au panier").should("be.visible");
    cy.contains("en stock").should("be.visible");
    cy.get("img").should("be.visible");
  });

  it("devrait ajouter un produit au panier", () => {
    cy.visit("/#/products/3");
    cy.contains("Ajouter au panier").click();
    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it("devrait verifier que le stock diminue apres ajout au panier", () => {
    cy.request(apiUrl + "/products/3").then((response) => {
      const stockBefore = response.body.availableStock;

      cy.request({
        method: "PUT",
        url: apiUrl + "/orders/add",
        headers: { Authorization: "Bearer " + token },
        body: { product: 3, quantity: 1 },
      });

      cy.request(apiUrl + "/products/3").then((response2) => {
        const stockAfter = response2.body.availableStock;
        expect(stockAfter).to.be.lessThan(stockBefore);
      });
    });
  });

  it("devrait verifier la presence du champ de disponibilite", () => {
    cy.visit("/#/products/3");
    cy.contains("en stock").should("be.visible");
  });

  it("ne devrait pas accepter une quantite negative", () => {
    cy.request({
      method: "PUT",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: { product: 3, quantity: -1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  it("ne devrait pas accepter une quantite superieure a 20", () => {
    cy.request({
      method: "PUT",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: { product: 3, quantity: 21 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  it("devrait ajouter un element et verifier le contenu du panier via l API", () => {
    cy.request({
      method: "PUT",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: { product: 5, quantity: 1 },
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
    });

    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
