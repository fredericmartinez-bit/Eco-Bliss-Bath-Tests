describe("Smoke Tests", () => {
  context("Page de connexion", () => {
    it("devrait afficher les champs et boutons de connexion", () => {
      cy.visit("/#/login");
      cy.get('[data-cy="login-input-username"]').should("be.visible");
      cy.get('[data-cy="login-input-password"]').should("be.visible");
      cy.get('[data-cy="login-form"]').should("be.visible");
      cy.contains("Se connecter").should("be.visible");
    });
  });

  context("Page d accueil", () => {
    it("devrait afficher le menu de navigation", () => {
      cy.visit("/");
      cy.contains("Accueil").should("be.visible");
      cy.contains("Produits").should("be.visible");
      cy.contains("Avis").should("be.visible");
      cy.contains("Connexion").should("be.visible");
    });

    it("devrait afficher les produits", () => {
      cy.visit("/");
      cy.get("img").should("have.length.greaterThan", 0);
    });
  });

  context("Boutons d ajout au panier (connecte)", () => {
    beforeEach(() => {
      cy.request("POST", "http://localhost:8081/login", {
        username: "test2@test.fr",
        password: "testtest",
      }).then((response) => {
        window.localStorage.setItem("user", JSON.stringify(response.body));
      });
    });

    it("devrait afficher le bouton Consulter sur chaque produit de la page d accueil", () => {
      cy.visit("/");
      cy.get('[data-cy="product-home-link"]').should(
        "have.length.greaterThan",
        0,
      );
    });

    it("devrait afficher le bouton Ajouter au panier sur une fiche produit", () => {
      cy.visit("/#/products/3");
      cy.contains("Ajouter au panier").should("be.visible");
    });
  });
});
