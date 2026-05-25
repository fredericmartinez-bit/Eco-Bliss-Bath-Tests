describe("Test fonctionnel - Connexion", () => {
  beforeEach(() => {
    cy.visit("/#/login");
  });

  it("devrait afficher la page de connexion avec le formulaire", () => {
    cy.contains("Se connecter").should("be.visible");
    cy.get('[data-cy="login-input-username"]').should("be.visible");
    cy.get('[data-cy="login-input-password"]').should("be.visible");
  });

  it("devrait se connecter avec des identifiants valides", () => {
    cy.get('[data-cy="login-input-username"]').type("test2@test.fr");
    cy.get('[data-cy="login-input-password"]').type("testtest");
    cy.get('[data-cy="login-form"]').submit();
    cy.get('[data-cy="nav-link-cart"]', { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("devrait echouer avec des identifiants invalides", () => {
    cy.get('[data-cy="login-input-username"]').type("fake@test.fr");
    cy.get('[data-cy="login-input-password"]').type("wrongpass");
    cy.get('[data-cy="login-form"]').submit();
    cy.get('[data-cy="login-errors"]').should("be.visible");
  });

  it("devrait afficher une erreur si les champs sont vides", () => {
    cy.get('[data-cy="login-form"]').submit();
    cy.get('[data-cy="login-errors"]').should("be.visible");
  });

  it("devrait se connecter via l API et acceder au panier", () => {
    cy.request("POST", "http://localhost:8081/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("token");
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
    cy.visit("/");
    cy.get('[data-cy="nav-link-cart"]', { timeout: 10000 }).should(
      "be.visible",
    );
  });
});
