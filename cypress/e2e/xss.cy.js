// Tests de sécurité XSS — Projet Eco Bliss Bath
// Objectif : vérifier que le formulaire d'avis protège contre les injections XSS
// en passant par l'interface utilisateur uniquement.
describe("Test de faille XSS - Espace commentaire", () => {
  const apiUrl = "http://localhost:8081";

  beforeEach(() => {
    cy.request("POST", `${apiUrl}/login`, {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Test 1 : injection XSS dans le titre via le formulaire
  it("devrait empêcher l'injection XSS dans le titre d'un avis", () => {
    cy.visit("/#/reviews");

    const xssPayload = '<script>alert("XSS")</script>';

    // On clique sur la première étoile pour mettre une note
    cy.get('[data-cy="review-input-rating-images"] img').first().click();

    // On saisit le payload XSS dans le champ titre
    cy.get('[data-cy="review-input-title"]').type(xssPayload);

    // On saisit un commentaire normal
    cy.get('[data-cy="review-input-comment"]').type("Test de sécurité");

    // On soumet le formulaire
    cy.get('[data-cy="review-submit"]').click();

    // On recharge la page et on vérifie que le script n'est pas exécuté
    cy.visit("/#/reviews");

    cy.get("body").then(($body) => {
      expect($body.html()).to.not.include("<script>alert");
    });

    cy.on("window:alert", () => {
      throw new Error("Une faille XSS a été détectée : une alerte a été déclenchée");
    });
  });

  // Test 2 : injection XSS dans le commentaire via le formulaire
  it("devrait empêcher l'injection XSS dans le commentaire d'un avis", () => {
    cy.visit("/#/reviews");

    const xssPayload = '<img src="x" onerror="alert(\'XSS\')">';

    // On clique sur la première étoile pour mettre une note
    cy.get('[data-cy="review-input-rating-images"] img').first().click();

    // On saisit un titre normal
    cy.get('[data-cy="review-input-title"]').type("Test sécurité");

    // On saisit le payload XSS dans le champ commentaire
    cy.get('[data-cy="review-input-comment"]').type(xssPayload);

    // On soumet le formulaire
    cy.get('[data-cy="review-submit"]').click();

    // On recharge la page et on vérifie que le code malveillant n'est pas présent
    cy.visit("/#/reviews");

    cy.get("body").then(($body) => {
      expect($body.html()).to.not.include('onerror="alert');
    });

    cy.on("window:alert", () => {
      throw new Error("Une faille XSS a été détectée via une balise img");
    });
  });
});
