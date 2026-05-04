describe("Test de faille XSS - Espace commentaire", () => {
  
  beforeEach(() => {
    // Connexion via l'API
    cy.request("POST", "http://localhost:8081/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  it("devrait empêcher l'injection XSS dans le titre d'un avis", () => {
    cy.visit("/#/reviews");
    const xssPayload = '<script>alert("XSS")</script>';
    
    // Soumettre un avis avec du code malveillant dans le titre
    cy.request({
      method: "POST",
      url: "http://localhost:8081/reviews",
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
      },
      body: {
        title: xssPayload,
        comment: "Test de sécurité",
        rating: 5,
      },
      failOnStatusCode: false,
    });

    // Recharger la page des avis
    cy.visit("/#/reviews");

    // Vérifier que le script n'est pas exécuté
    // Le contenu ne doit pas contenir de balise script interprétée
    cy.get("body").then(($body) => {
      const bodyHtml = $body.html();
      expect(bodyHtml).to.not.include("<script>alert");
    });

    // Vérifier qu'aucune alerte n'apparaît
    cy.on("window:alert", () => {
      throw new Error("Une faille XSS a été détectée : une alerte a été déclenchée");
    });
  });

  it("devrait empêcher l'injection XSS dans le commentaire d'un avis", () => {
    cy.visit("/#/reviews");
    const xssPayload = '<img src="x" onerror="alert(\'XSS\')">';

    cy.request({
      method: "POST",
      url: "http://localhost:8081/reviews",
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
      },
      body: {
        title: "Test sécurité",
        comment: xssPayload,
        rating: 3,
      },
      failOnStatusCode: false,
    });

    cy.visit("/#/reviews");

    cy.get("body").then(($body) => {
      const bodyHtml = $body.html();
      expect(bodyHtml).to.not.include('onerror="alert');
    });

    cy.on("window:alert", () => {
      throw new Error("Une faille XSS a été détectée via une balise img");
    });
  });
});
