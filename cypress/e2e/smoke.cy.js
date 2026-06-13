// Smoke tests
// Objectif : vérifier rapidement que les éléments essentiels du site sont présents.
// Ces tests permettent de détecter rapidement un problème majeur avant d'aller plus loin.
describe("Smoke Tests", () => {
  // Groupe de tests sur la page de connexion
  context("Page de connexion", () => {
    // Ce test vérifie que le formulaire de connexion est bien affiché.
    // C'est important car la connexion est un parcours critique du site.
    it("devrait afficher les champs et boutons de connexion", () => {
      // On ouvre la page de connexion
      cy.visit("/#/login");

      // On vérifie que le champ email est visible
      cy.get('[data-cy="login-input-username"]').should("be.visible");

      // On vérifie que le champ mot de passe est visible
      cy.get('[data-cy="login-input-password"]').should("be.visible");

      // On vérifie que le formulaire de connexion est visible
      cy.get('[data-cy="login-form"]').should("be.visible");

      // On vérifie que le bouton "Se connecter" est visible
      cy.contains("Se connecter").should("be.visible");
    });
  });

  // Groupe de tests sur la page d'accueil
  context("Page d'accueil", () => {
    // Ce test vérifie que le menu principal est affiché.
    // Le menu permet à l'utilisateur de naviguer dans les pages importantes du site.
    it("devrait afficher le menu de navigation", () => {
      // On ouvre la page d'accueil
      cy.visit("/");

      // On vérifie que les liens principaux du menu sont visibles
      cy.contains("Accueil").should("be.visible");
      cy.contains("Produits").should("be.visible");
      cy.contains("Avis").should("be.visible");
      cy.contains("Connexion").should("be.visible");
    });

    // Ce test vérifie que les produits sont bien affichés sur la page d'accueil.
    // Ici, on contrôle qu'il y a au moins une image de produit.
    it("devrait afficher les produits", () => {
      cy.visit("/");

      // S'il y a au moins une image, cela indique que des produits sont affichés
      cy.get("img").should("have.length.greaterThan", 0);
    });
  });

  // Groupe de tests sur les boutons visibles quand l'utilisateur est connecté
  context("Boutons d'ajout au panier quand l'utilisateur est connecté", () => {
    // Ce test vérifie qu'après connexion, l'utilisateur peut voir le bouton "Consulter".
    // Ce bouton permet d'accéder à la fiche détaillée d'un produit.
    it("devrait afficher le bouton Consulter sur la page d'accueil", () => {
      // On ouvre la page de connexion
      cy.visit("/#/login");

      // On saisit l'email d'un utilisateur connu
      cy.get('[data-cy="login-input-username"]')
        .should("be.visible")
        .type("test2@test.fr");

      // On saisit le mot de passe
      cy.get('[data-cy="login-input-password"]')
        .should("be.visible")
        .type("testtest");

      // On clique sur le bouton de connexion
      cy.contains("Se connecter").should("be.visible").click();

      // On revient sur la page d'accueil
      cy.visit("/");

      // On vérifie que le bouton "Consulter" est visible
      cy.contains("Consulter").should("be.visible");
    });

    // Ce test vérifie qu'un utilisateur connecté voit le bouton "Ajouter au panier"
    // sur une fiche produit. C'est un élément essentiel du parcours d'achat.
    it("devrait afficher le bouton Ajouter au panier sur une fiche produit", () => {
      // On ouvre la page de connexion
      cy.visit("/#/login");

      // On saisit l'email d'un utilisateur connu
      cy.get('[data-cy="login-input-username"]')
        .should("be.visible")
        .type("test2@test.fr");

      // On saisit le mot de passe
      cy.get('[data-cy="login-input-password"]')
        .should("be.visible")
        .type("testtest");

      // On clique sur le bouton de connexion
      cy.contains("Se connecter").should("be.visible").click();

      // On ouvre une fiche produit
      cy.visit("/#/products/3");

      // On vérifie que le bouton "Ajouter au panier" est visible
      cy.contains("Ajouter au panier").should("be.visible");
    });
  });
});
