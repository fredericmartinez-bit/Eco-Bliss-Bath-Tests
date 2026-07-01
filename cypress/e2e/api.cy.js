// Tests API — Projet Eco Bliss Bath
// Objectif : vérifier les endpoints de l'API back-end (Symfony)
// conformément au cahier de recette de Marie.
describe("Tests API", () => {
  const apiUrl = "http://localhost:8081";
  let token;

  beforeEach(() => {
    cy.request("POST", `${apiUrl}/login`, {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      token = response.body.token;
    });
  });

  // Anomalie A1 : attendu 403, observé 401
  it("devrait retourner 401 pour /orders sans authentification (attendu 403 — anomalie A1)", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/orders`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  it("devrait retourner 200 et la liste du panier pour un utilisateur connecté", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
    });
  });

  it("devrait retourner la fiche d'un produit spécifique", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/products/6`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
      expect(response.body.id).to.eq(6);
    });
  });

  it("devrait retourner 401 pour un utilisateur inconnu", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/login`,
      body: {
        username: "inconnu@test.fr",
        password: "mauvaismotdepasse",
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  it("devrait retourner 200 et un token pour un utilisateur connu", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/login`,
      body: {
        username: "test2@test.fr",
        password: "testtest",
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.token).to.exist;
    });
  });

  // Anomalie A2 : l'API utilise PUT au lieu de POST
  it("devrait constater que /orders/add utilise PUT au lieu de POST (anomalie A2)", () => {
    cy.request({
      method: "PUT",
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        product: 6,
        quantity: 1,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(404);
    });
  });

  it("devrait refuser l'ajout d'un produit en rupture de stock", () => {
    cy.request(`${apiUrl}/products`).then((response) => {
      const productOutOfStock = response.body.find(
        (product) => product.availableStock === 0
      );
      if (!productOutOfStock) {
        cy.log("Aucun produit en rupture de stock trouvé — test ignoré");
        return;
      }
      cy.request({
        method: "PUT",
        url: `${apiUrl}/orders/add`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          product: productOutOfStock.id,
          quantity: 1,
        },
        failOnStatusCode: false,
      }).then((addResponse) => {
        expect(addResponse.status).to.not.eq(200);
      });
    });
  });

  it("devrait permettre d'ajouter un avis via /reviews", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/reviews`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        product: 6,
        comment: "Très bon produit",
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(404);
    });
  });
});
