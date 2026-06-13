// Tests de sécurité XSS - Vérification que l'espace commentaire est protégé
describe("Test de faille XSS - Espace commentaire", () => {
  // Avant chaque test, on se connecte via l'API
  beforeEach(() => {
    cy.request("POST", "http://localhost:8081/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      // On stocke la connexion dans le navigateur
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Test 1 : Injection d'une balise <script> dans le titre d'un avis
  it("devrait empêcher l'injection XSS dans le titre d'un avis", () => {
    cy.visit("/#/reviews");
    // Code malveillant : une balise script qui afficherait une alerte
    const xssPayload = '<script>alert("XSS")</script>';

    // On envoie un avis avec le code malveillant dans le titre
    cy.request({
      method: "POST",
      url: "http://localhost:8081/reviews",
      headers: {
        // On récupère le token depuis le localStorage pour s'authentifier
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
      },
      body: {
        title: xssPayload,
        comment: "Test de sécurité",
        rating: 5,
      },
      failOnStatusCode: false,
    });

    // On recharge la page des avis
    cy.visit("/#/reviews");

    // On récupère tout le HTML de la page
    cy.get("body").then(($body) => {
      const bodyHtml = $body.html();
      // On vérifie que le code malveillant N'EST PAS dans le HTML
      expect(bodyHtml).to.not.include("<script>alert");
    });

    // Si une alerte JavaScript apparaît, c'est qu'il y a une faille XSS
    cy.on("window:alert", () => {
      throw new Error(
        "Une faille XSS a été détectée : une alerte a été déclenchée",
      );
    });
  });

  // Test 2 : Injection d'une balise <img> piégée dans le commentaire
  it("devrait empêcher l'injection XSS dans le commentaire d'un avis", () => {
    cy.visit("/#/reviews");
    // Code malveillant : une image avec une fausse URL
    // Si l'image ne charge pas, le onerror exécute du code
    const xssPayload = '<img src="x" onerror="alert(\'XSS\')">';

    // On envoie un avis avec le code malveillant dans le commentaire
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

    // On recharge la page des avis
    cy.visit("/#/reviews");

    // On vérifie que le code onerror N'EST PAS dans le HTML
    cy.get("body").then(($body) => {
      const bodyHtml = $body.html();
      expect(bodyHtml).to.not.include('onerror="alert');
    });

    // Si une alerte apparaît, c'est une faille XSS
    cy.on("window:alert", () => {
      throw new Error("Une faille XSS a été détectée via une balise img");
    });
  });
});
