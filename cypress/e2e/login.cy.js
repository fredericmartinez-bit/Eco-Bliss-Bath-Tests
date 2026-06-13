// Tests fonctionnels de la connexion
// Objectif : vérifier le comportement du formulaire de connexion côté front,
// ainsi que le bon fonctionnement de la connexion via l'API.
describe("Test fonctionnel - Connexion", () => {
  // Avant chaque test, on ouvre la page de connexion.
  // Cela évite de répéter cy.visit dans chaque test.
  beforeEach(() => {
    cy.visit("/#/login");
  });

  // Ce test vérifie que la page de connexion s'affiche correctement.
  // On contrôle la présence du formulaire, du champ email, du champ mot de passe
  // et du bouton "Se connecter".
  it("devrait afficher la page de connexion avec le formulaire", () => {
    cy.contains("Se connecter").should("be.visible");
    cy.get('[data-cy="login-input-username"]').should("be.visible");
    cy.get('[data-cy="login-input-password"]').should("be.visible");
    cy.get('[data-cy="login-form"]').should("be.visible");
  });

  // Ce test vérifie le comportement du formulaire avec des identifiants valides.
  // Résultat attendu côté métier : l'utilisateur devrait être connecté.
  // Résultat observé : l'utilisateur reste sur la page /login.
  // Ce test permet donc de constater une anomalie front-end.
  it("devrait constater que la connexion front ne redirige pas l'utilisateur", () => {
    cy.get('[data-cy="login-input-username"]').type("test2@test.fr");
    cy.get('[data-cy="login-input-password"]').type("testtest");
    cy.get('[data-cy="login-form"]').submit();

    // On vérifie que l'URL contient encore /login.
    // Cela montre que l'utilisateur n'est pas correctement redirigé après connexion.
    cy.url({ timeout: 10000 }).should("include", "/login");
  });

  // Ce test vérifie qu'un utilisateur avec de mauvais identifiants ne peut pas se connecter.
  // On contrôle que le lien vers le panier n'apparaît pas.
  it("devrait échouer avec des identifiants invalides", () => {
    cy.get('[data-cy="login-input-username"]').type("fake@test.fr");
    cy.get('[data-cy="login-input-password"]').type("wrongpass");
    cy.get('[data-cy="login-form"]').submit();

    cy.get('[data-cy="nav-link-cart"]').should("not.exist");
  });

  // Ce test vérifie que le formulaire vide ne connecte pas l'utilisateur.
  // Cela permet de contrôler que les champs obligatoires sont bien pris en compte.
  it("devrait ne pas connecter l'utilisateur si les champs sont vides", () => {
    cy.get('[data-cy="login-form"]').submit();

    cy.get('[data-cy="nav-link-cart"]').should("not.exist");
  });

  // Ce test vérifie la connexion directement via l'API.
  // L'objectif est de confirmer que le back-end fonctionne correctement.
  // Si l'API retourne un token, cela signifie que l'authentification API est valide.
  it("devrait se connecter via l'API", () => {
    cy.request("POST", "http://localhost:8081/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("token");

      // On stocke la réponse dans le localStorage pour simuler un utilisateur connecté.
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });

    // On retourne sur la page d'accueil.
    cy.visit("/");

    // On vérifie que le token est bien présent dans le localStorage.
    // Cela confirme que la connexion API a bien fonctionné.
    cy.window().then((window) => {
      const user = JSON.parse(window.localStorage.getItem("user"));
      expect(user.token).to.exist;
    });
  });
});
