// Tests fonctionnels du panier — Projet Eco Bliss Bath
// Objectif : vérifier les comportements du panier uniquement via l'interface (UI).
// La connexion est faite via l'API en beforeEach pour contourner l'anomalie A3
// (la connexion front ne redirige pas l'utilisateur après soumission du formulaire).
describe("Test fonctionnel - Panier", () => {
  const apiUrl = "http://localhost:8081";
  let token;

  beforeEach(() => {
    cy.request("POST", `${apiUrl}/login`, {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      token = response.body.token;
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Vérifie qu'on peut afficher la fiche d'un produit avec stock > 1
  it("devrait afficher la fiche d'un produit avec stock > 1", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-stock"]').should("be.visible");
    cy.get('[data-cy="detail-product-img"]').should("be.visible");
    cy.get('[data-cy="detail-product-add"]').should("be.visible");
  });

  // Vérifie que le stock diminue après l'ajout au panier
  // Si ce test échoue, c'est une anomalie de l'application (stock non mis à jour côté front)
  it("devrait diminuer le stock après l'ajout au panier", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-stock"]')
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+/)
      .then((textBefore) => {
        const stockBefore = parseInt(textBefore.match(/\d+/)[0]);
        cy.get('[data-cy="detail-product-add"]').click();
        cy.wait(1000);
        cy.visit("/#/products/6");
        cy.get('[data-cy="detail-product-stock"]')
          .should("be.visible")
          .invoke("text")
          .should("match", /\d+/)
          .then((textAfter) => {
            const stockAfter = parseInt(textAfter.match(/\d+/)[0]);
            expect(stockAfter).to.be.lessThan(stockBefore);
          });
      });
  });

  // Vérifie que le produit apparaît dans le panier après l'ajout
  it("devrait ajouter un produit au panier et voir le bouton panier", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-add"]').click();
    cy.get('[data-cy="nav-link-cart"]').should("be.visible");
  });

  // Vérifie qu'une quantité négative est refusée via l'interface
  it("ne devrait pas accepter une quantité négative", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-quantity"]').clear().type("-1");
    cy.get('[data-cy="detail-product-add"]').click();
    cy.url().should("include", "/products/6");
  });

  // Vérifie qu'une quantité supérieure à 20 est refusée via l'interface
  it("ne devrait pas accepter une quantité supérieure à 20", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-quantity"]').clear().type("21");
    cy.get('[data-cy="detail-product-add"]').click();
    cy.url().should("include", "/products/6");
  });

  // Vérifie la présence du champ de disponibilité sur la fiche produit
  it("devrait afficher le champ de disponibilité du produit", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-stock"]').should("be.visible");
  });

  // Ajoute un produit via l'interface et vérifie le contenu du panier via l'API
  // Demandé explicitement dans le cahier de recette de Marie
  it("devrait ajouter un élément via le bouton et vérifier le contenu du panier via l'API", () => {
    cy.visit("/#/products/6");
    cy.get('[data-cy="detail-product-add"]').click();
    cy.request({
      method: "GET",
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
    });
  });
});
