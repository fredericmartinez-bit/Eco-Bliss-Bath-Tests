describe("Test fonctionnel - Panier", () => {
  const apiUrl = "http://localhost:8081";
  let token;

  beforeEach(() => {
    // Connexion via l'API
    cy.request("POST", `${apiUrl}/login`, {
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

    // Récupérer le stock avant ajout
    cy.contains("en stock").invoke("text").then((stockText) => {
      const stockBefore = parseInt(stockText);

      // Cliquer sur Ajouter au panier
      cy.contains("Ajouter au panier").click();

      // Vérifier via l'API que le produit est dans le panier
      cy.request({
        method: "GET",
        url: `${apiUrl}/orders`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        expect(response.status).to.eq(200);
        const items = response.body.orderLines || response.body;
        expect(items).to.be.an("array");
        expect(items.length).to.be.greaterThan(0);
      });
    });
  });

  it("devrait vérifier que le stock diminue après ajout au panier", () => {
    // Récupérer le stock initial via l'API
    cy.request(`${apiUrl}/products/3`).then((response) => {
      const stockBefore = response.body.availableStock;

      // Ajouter au panier via l'API
      cy.request({
        method: "PUT",
        url: `${apiUrl}/orders/add`,
        headers: { Authorization: `Bearer ${token}` },
        body: { product: 3, quantity: 1 },
      });

      // Revisiter la page produit et vérifier le stock
      cy.visit("/#/products/3");
      cy.contains("en stock").invoke("text").then((stockText) => {
        const stockAfter = parseInt(stockText);
        expect(stockAfter).to.be.lessThan(stockBefore);
      });
    });
  });

  it("devrait vérifier la présence du champ de disponibilité", () => {
    cy.visit("/#/products/3");
    cy.contains("en stock").should("be.visible");
  });

  it("ne devrait pas accepter une quantité négative", () => {
    cy.visit("/#/products/3");
    
    // Trouver le champ de quantité et entrer une valeur négative
    cy.get('input[type="number"]').clear().type("-1");
    cy.contains("Ajouter au panier").click();

    // Vérifier via l'API que le panier n'a pas été modifié avec une quantité négative
    cy.request({
      method: "PUT",
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product: 3, quantity: -1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  it("ne devrait pas accepter une quantité supérieure à 20", () => {
    cy.visit("/#/products/3");

    cy.get('input[type="number"]').clear().type("21");
    cy.contains("Ajouter au panier").click();

    cy.request({
      method: "PUT",
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product: 3, quantity: 21 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  it("devrait ajouter un élément et vérifier le contenu du panier via l'API", () => {
    // Ajouter un produit via l'API
    cy.request({
      method: "PUT",
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product: 5, quantity: 1 },
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
    });

    // Vérifier le contenu du panier
    cy.request({
      method: "GET",
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200);
      const items = response.body.orderLines || response.body;
      expect(items).to.be.an("array");
      expect(items.length).to.be.greaterThan(0);
    });
  });
});
