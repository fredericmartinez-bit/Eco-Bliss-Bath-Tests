describe("Tests API", () => {
  const apiUrl = "http://localhost:8081";
  let token;

  // Se connecter avant les tests qui nécessitent une authentification
  before(() => {
    cy.request("POST", `${apiUrl}/login`, {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      expect(response.status).to.eq(200);
      token = response.body.token;
    });
  });

  context("GET - Sans authentification", () => {
    it("devrait retourner une erreur 401 pour /orders sans être connecté", () => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/orders`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  context("GET - Avec authentification", () => {
    it("devrait retourner la liste des produits du panier", () => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/orders`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");
      });
    });

    it("devrait retourner une fiche produit spécifique", () => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/products/3`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("name");
        expect(response.body).to.have.property("price");
        expect(response.body).to.have.property("availableStock");
      });
    });
  });

  context("POST - Login", () => {
    it("devrait retourner 200 pour un utilisateur connu", () => {
      cy.request("POST", `${apiUrl}/login`, {
        username: "test2@test.fr",
        password: "testtest",
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("token");
      });
    });

    it("devrait retourner 401 pour un utilisateur inconnu", () => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/login`,
        body: { username: "fake@test.fr", password: "wrongpass" },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  context("POST/PUT - Panier", () => {
    it("devrait ajouter un produit disponible au panier", () => {
      cy.request({
        method: "PUT",
        url: `${apiUrl}/orders/add`,
        headers: { Authorization: `Bearer ${token}` },
        body: { product: 3, quantity: 1 },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 201]);
      });
    });

    it("devrait gérer l'ajout d'un produit en rupture de stock", () => {
      // Trouver un produit avec stock = 0
      cy.request(`${apiUrl}/products`).then((response) => {
        const outOfStock = response.body.find((p) => p.availableStock === 0);
        if (outOfStock) {
          cy.request({
            method: "PUT",
            url: `${apiUrl}/orders/add`,
            headers: { Authorization: `Bearer ${token}` },
            body: { product: outOfStock.id, quantity: 1 },
            failOnStatusCode: false,
          }).then((res) => {
            expect(res.status).to.not.eq(200);
          });
        }
      });
    });
  });

  context("POST - Avis", () => {
    it("devrait ajouter un avis", () => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/reviews`,
        headers: { Authorization: `Bearer ${token}` },
        body: { title: "Super", comment: "Très bon produit", rating: 5 },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 201]);
      });
    });
  });
});
