// Smoke Tests - Vérification rapide des éléments de base du site
describe("Smoke Tests", () => {
  // Tests sur la page de connexion
  context("Page de connexion", () => {
    it("devrait afficher les champs et boutons de connexion", () => {
      // On ouvre la page de connexion
      cy.visit("/#/login");
      // On vérifie que le champ email est visible
      cy.get('[data-cy="login-input-username"]').should("be.visible");
      // On vérifie que le champ mot de passe est visible
      cy.get('[data-cy="login-input-password"]').should("be.visible");
      // On vérifie que le formulaire est visible
      cy.get('[data-cy="login-form"]').should("be.visible");
      // On vérifie que le bouton Se connecter est visible
      cy.contains("Se connecter").should("be.visible");
    });
  });

  // Tests sur la page d'accueil
  context("Page d accueil", () => {
    it("devrait afficher le menu de navigation", () => {
      // On ouvre la page d'accueil
      cy.visit("/");
      // On vérifie que les 4 éléments du menu sont visibles
      cy.contains("Accueil").should("be.visible");
      cy.contains("Produits").should("be.visible");
      cy.contains("Avis").should("be.visible");
      cy.contains("Connexion").should("be.visible");
    });

    it("devrait afficher les produits", () => {
      cy.visit("/");
      // On vérifie qu'il y a au moins une image (les produits s'affichent)
      cy.get("img").should("have.length.greaterThan", 0);
    });
  });

  // Tests des boutons quand on est connecté
  context("Boutons d ajout au panier (connecte)", () => {
    it("devrait afficher le bouton Consulter sur chaque produit de la page d accueil", () => {
      // On va sur la page de connexion
      cy.visit("/#/login");
      // On tape l'email
      cy.get('[data-cy="login-input-username"]')
        .should("be.visible")
        .type("test2@test.fr");
      // On tape le mot de passe
      cy.get('[data-cy="login-input-password"]')
        .should("be.visible")
        .type("testtest");
      // On vérifie que le formulaire et le bouton sont visibles
      cy.get('[data-cy="login-form"]').should("be.visible");
      // On clique sur Se connecter
      cy.contains("Se connecter").should("be.visible").click();
      // On vérifie que les boutons Consulter sont présents sur les produits
      cy.get('[data-cy="product-home-link"]').should(
        "have.length.greaterThan",
        0,
      );
    });

    it("devrait afficher le bouton Ajouter au panier sur une fiche produit", () => {
      // On ouvre la page d'un produit
      cy.visit("/#/products/3");
      // On vérifie que le bouton Ajouter au panier est visible
      cy.contains("Ajouter au panier").should("be.visible");
    });
  });
});
