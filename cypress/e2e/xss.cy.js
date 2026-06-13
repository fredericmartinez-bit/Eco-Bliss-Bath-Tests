// Tests de sécurité XSS
// Objectif : vérifier que l'espace commentaire protège contre les injections de code malveillant.
// Une faille XSS permettrait à un utilisateur d'injecter du JavaScript dans une page du site.
describe("Test de faille XSS - Espace commentaire", () => {
  // Avant chaque test, on connecte l'utilisateur via l'API.
  // Cela permet d'avoir le droit de publier un avis.
  beforeEach(() => {
    cy.request("POST", "http://localhost:8081/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      // On stocke la réponse dans le localStorage.
      // Le front-end pourra ainsi considérer l'utilisateur comme connecté.
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Test 1 : tentative d'injection d'une balise <script> dans le titre d'un avis.
  // Résultat attendu : le script ne doit pas être présent dans le HTML final
  // et aucune alerte JavaScript ne doit se déclencher.
  it("devrait empêcher l'injection XSS dans le titre d'un avis", () => {
    cy.visit("/#/reviews");

    // Payload XSS : code malveillant qui essaie d'exécuter une alerte JavaScript.
    const xssPayload = '<script>alert("XSS")</script>';

    // On envoie un avis via l'API avec le payload dans le titre.
    cy.request({
      method: "POST",
      url: "http://localhost:8081/reviews",
      headers: {
        // On récupère le token stocké après connexion pour authentifier la requête.
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
      },
      body: {
        title: xssPayload,
        comment: "Test de sécurité",
        rating: 5,
      },
      failOnStatusCode: false,
    });

    // On recharge la page des avis pour vérifier ce qui est affiché côté front.
    cy.visit("/#/reviews");

    // On récupère le contenu HTML de la page.
    // Le test échoue si la balise <script> injectée est retrouvée dans le HTML.
    cy.get("body").then(($body) => {
      const bodyHtml = $body.html();
      expect(bodyHtml).to.not.include("<script>alert");
    });

    // Si une alerte JavaScript apparaît, cela signifie que le script a été exécuté.
    // Dans ce cas, le test échoue volontairement.
    cy.on("window:alert", () => {
      throw new Error(
        "Une faille XSS a été détectée : une alerte a été déclenchée",
      );
    });
  });

  // Test 2 : tentative d'injection XSS dans le commentaire d'un avis.
  // Ici, on utilise une balise image avec un attribut onerror qui peut exécuter du JavaScript.
  it("devrait empêcher l'injection XSS dans le commentaire d'un avis", () => {
    cy.visit("/#/reviews");

    // Payload XSS : si l'image ne charge pas, l'attribut onerror tente de lancer une alerte.
    const xssPayload = '<img src="x" onerror="alert(\'XSS\')">';

    // On envoie un avis via l'API avec le payload dans le commentaire.
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

    // On recharge la page des avis pour vérifier l'affichage.
    cy.visit("/#/reviews");

    // On vérifie que l'attribut dangereux onerror n'est pas présent dans le HTML final.
    cy.get("body").then(($body) => {
      const bodyHtml = $body.html();
      expect(bodyHtml).to.not.include('onerror="alert');
    });

    // Si une alerte apparaît, cela signifie que le code malveillant a été exécuté.
    cy.on("window:alert", () => {
      throw new Error("Une faille XSS a été détectée via une balise img");
    });
  });
});
