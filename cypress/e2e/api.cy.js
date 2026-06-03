describe("Tests API", () => {
  const apiUrl = "http://localhost:8081";
  let token;

  before(() => {
    cy.request("POST", apiUrl + "/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      expect(response.status).to.eq(200);
      token = response.body.token;
    });
  });

  context("GET - Sans authentification", () => {
    it("devrait retourner une erreur 403 pour /orders sans etre connecte", () => {
      cy.request({
        method: "GET",
        url: apiUrl + "/orders",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });
  });

  context("GET - Avec authentification", () => {
    it("devrait retourner la liste des produits du panier", () => {
      cy.request({
        method: "GET",
        url: apiUrl + "/orders",
        headers: { Authorization: "Bearer " + token },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");
      });
    });

    it("devrait retourner une fiche produit avec nom, prix et stock", () => {
      cy.request({
        method: "GET",
        url: apiUrl + "/products/3",
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("name");
        expect(response.body).to.have.property("price");
        expect(response.body).to.have.property("availableStock");
        expect(response.body).to.have.property("skin");
        expect(response.body).to.have.property("aromas");
        expect(response.body).to.have.property("ingredients");
        expect(response.body).to.have.property("description");
        expect(response.body).to.have.property("picture");
        expect(response.body.name).to.be.a("string");
        expect(response.body.price).to.be.a("number");
        expect(response.body.availableStock).to.be.a("number");
      });
    });
  });

  context("POST - Login", () => {
    it("devrait retourner 200 et un token pour un utilisateur connu", () => {
      cy.request("POST", apiUrl + "/login", {
        username: "test2@test.fr",
        password: "testtest",
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("token");
        expect(response.body.token).to.be.a("string");
      });
    });

    it("devrait retourner 401 pour un utilisateur inconnu", () => {
      cy.request({
        method: "POST",
        url: apiUrl + "/login",
        body: { username: "fake@test.fr", password: "wrongpass" },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  context("POST - Panier", () => {
    it("devrait ajouter un produit disponible au panier avec POST", () => {
      cy.request({
        method: "POST",
        url: apiUrl + "/orders/add",
        headers: { Authorization: "Bearer " + token },
        body: { product: 3, quantity: 1 },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 201]);
      });
    });

    it("devrait gerer l ajout d un produit en rupture de stock", () => {
      cy.request(apiUrl + "/products").then((response) => {
        const outOfStock = response.body.find((p) => p.availableStock === 0);
        if (outOfStock) {
          cy.request({
            method: "POST",
            url: apiUrl + "/orders/add",
            headers: { Authorization: "Bearer " + token },
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
        url: apiUrl + "/reviews",
        headers: { Authorization: "Bearer " + token },
        body: { title: "Super", comment: "Tres bon produit", rating: 5 },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 201]);
      });
    });
  });
});
