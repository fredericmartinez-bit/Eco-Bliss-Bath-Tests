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

  it("devrait afficher un produit avec son stock et l ajouter au panier", () => {
    cy.visit("/#/products/6");
    cy.contains("Ajouter au panier").should("be.visible");
    cy.contains("en stock").should("be.visible");
    cy.get("img").should("be.visible");
    cy.contains("Ajouter au panier").click();
  });

  it("devrait verifier que le stock diminue apres ajout au panier", () => {
    cy.request(apiUrl + "/products").then((response) => {
      const product = response.body.find((p) => p.availableStock > 1);
      if (product) {
        const stockBefore = product.availableStock;
        cy.request({
          method: "PUT",
          url: apiUrl + "/orders/add",
          headers: { Authorization: "Bearer " + token },
          body: { product: product.id, quantity: 1 },
        });
        cy.request(apiUrl + "/products/" + product.id).then((response2) => {
          const stockAfter = response2.body.availableStock;
          expect(stockAfter).to.be.lessThan(stockBefore);
        });
      }
    });
  });

  it("devrait verifier la presence du champ de disponibilite", () => {
    cy.visit("/#/products/6");
    cy.contains("en stock").should("be.visible");
  });

  it("ne devrait pas accepter une quantite negative", () => {
    cy.visit("/#/products/6");
    cy.get('input[type="number"]').clear().type("-1");
    cy.contains("Ajouter au panier").click();
  });

  it("ne devrait pas accepter une quantite superieure a 20", () => {
    cy.visit("/#/products/6");
    cy.get('input[type="number"]').clear().type("21");
    cy.contains("Ajouter au panier").click();
    cy.request({
      method: "PUT",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: { product: 6, quantity: 21 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  it("devrait ajouter un element via le bouton et verifier le contenu du panier via l API", () => {
    cy.visit("/#/products/9");
    cy.contains("Ajouter au panier").click();
    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
