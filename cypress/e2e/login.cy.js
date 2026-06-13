// Tests fonctionnels de la connexion
describe("Test fonctionnel - Connexion", () => {
  // Avant chaque test, on ouvre la page de connexion
  beforeEach(() => {
    cy.visit("/#/login");
  });

  // Test 1 : Vérifier que le formulaire s'affiche
  it("devrait afficher la page de connexion avec le formulaire", () => {
    // On vérifie que le bouton Se connecter est visible
    cy.contains("Se connecter").should("be.visible");
    // On vérifie que le champ email est visible
    cy.get('[data-cy="login-input-username"]').should("be.visible");
    // On vérifie que le champ mot de passe est visible
    cy.get('[data-cy="login-input-password"]').should("be.visible");
  });

  // Test 2 : Se connecter avec de bons identifiants
  it("devrait se connecter avec des identifiants valides", () => {
    // On tape l'email
    cy.get('[data-cy="login-input-username"]').type("test2@test.fr");
    // On tape le mot de passe
    cy.get('[data-cy="login-input-password"]').type("testtest");
    // On soumet le formulaire
    cy.get('[data-cy="login-form"]').submit();
    // On attend jusqu'à 10 secondes que le bouton panier apparaisse
    // Si on est connecté, le bouton panier doit être visible
    cy.get('[data-cy="nav-link-cart"]', { timeout: 10000 }).should(
      "be.visible",
    );
  });

  // Test 3 : Se connecter avec de mauvais identifiants
  it("devrait echouer avec des identifiants invalides", () => {
    // On tape un faux email
    cy.get('[data-cy="login-input-username"]').type("fake@test.fr");
    // On tape un faux mot de passe
    cy.get('[data-cy="login-input-password"]').type("wrongpass");
    // On soumet le formulaire
    cy.get('[data-cy="login-form"]').submit();
    // On vérifie qu'un message d'erreur s'affiche
    cy.get('[data-cy="login-errors"]').should("be.visible");
  });

  // Test 4 : Soumettre le formulaire sans rien taper
  it("devrait afficher une erreur si les champs sont vides", () => {
    // On soumet le formulaire vide
    cy.get('[data-cy="login-form"]').submit();
    // On vérifie qu'un message d'erreur s'affiche
    cy.get('[data-cy="login-errors"]').should("be.visible");
  });

  // Test 5 : Se connecter directement via l'API (méthode alternative)
  it("devrait se connecter via l API et acceder au panier", () => {
    // On envoie une requête POST à l'API pour se connecter
    cy.request("POST", "http://localhost:8081/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      // On vérifie que la connexion réussit
      expect(response.status).to.eq(200);
      // On vérifie que l'API retourne un token
      expect(response.body).to.have.property("token");
      // On stocke la connexion dans le navigateur
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
    // On va sur la page d'accueil
    cy.visit("/");
    // Le bouton panier doit être visible car on est connecté
    // Ce test prouve que l'API marche, le bug est dans le formulaire
    cy.get('[data-cy="nav-link-cart"]', { timeout: 10000 }).should(
      "be.visible",
    );
  });
});
