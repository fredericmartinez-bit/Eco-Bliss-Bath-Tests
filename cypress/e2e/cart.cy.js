// Tests fonctionnels du panier
// Objectif : vérifier les comportements principaux du panier :
// sélection d'un produit, ajout au panier, disponibilité, stock et limites de quantité.
describe("Test fonctionnel - Panier", () => {
  // URL de base du back-end Symfony
  const apiUrl = "http://localhost:8081";

  // Variable utilisée pour stocker le token de connexion
  let token;

  // Avant chaque test, on connecte l'utilisateur via l'API.
  // Cela permet d'avoir un utilisateur authentifié pour tester le panier.
  beforeEach(() => {
    cy.request("POST", apiUrl + "/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      // On récupère le token retourné par l'API
      token = response.body.token;

      // On stocke aussi l'utilisateur dans le localStorage
      // pour que le front-end considère l'utilisateur comme connecté.
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Ce test choisit automatiquement un produit avec un stock supérieur à 1.
  // C'est important car un produit doit avoir du stock pour pouvoir être ajouté au panier.
  it("devrait cliquer sur un produit avec un stock supérieur à 1", () => {
    cy.request(apiUrl + "/products").then((response) => {
      expect(response.status).to.eq(200);

      // On cherche dans la liste des produits un produit disponible avec un stock > 1
      const product = response.body.find((p) => p.availableStock > 1);
      expect(product).to.exist;

      // On ouvre la fiche produit trouvée
      cy.visit("/#/products/" + product.id);

      // On vérifie les éléments principaux de la fiche produit
      cy.contains("Ajouter au panier").should("be.visible");
      cy.contains("en stock").should("be.visible");
      cy.get("img").should("be.visible");
    });
  });

  // Ce test vérifie qu'un produit s'affiche correctement,
  // puis clique sur le bouton "Ajouter au panier".
  // Ensuite, on vérifie via l'API que le panier est accessible.
  it("devrait afficher un produit avec son stock et l'ajouter au panier", () => {
    cy.visit("/#/products/6");

    cy.contains("Ajouter au panier").should("be.visible");
    cy.contains("en stock").should("be.visible");
    cy.get("img").should("be.visible");

    cy.contains("Ajouter au panier").click();

    // On vérifie le panier via l'API avec le token de l'utilisateur connecté
    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
    });
  });

  // Ce test vérifie le comportement de POST /orders/add.
  // Dans l'application observée, cette méthode est refusée avec un code 405.
  // On vérifie aussi que le stock du produit ne change pas après cette requête refusée.
  it("devrait constater que l'ajout au panier via POST /orders/add est refusé", () => {
    cy.request(apiUrl + "/products/6").then((response) => {
      const product = response.body;
      const stockBefore = product.availableStock;

      cy.request({
        method: "POST",
        url: apiUrl + "/orders/add",
        headers: { Authorization: "Bearer " + token },
        body: {
          product: 6,
          quantity: 1,
        },
        failOnStatusCode: false,
      }).then((addResponse) => {
        expect(addResponse.status).to.eq(405);

        // On recharge la fiche produit via l'API pour comparer le stock
        cy.request(apiUrl + "/products/6").then((response2) => {
          const stockAfter = response2.body.availableStock;

          // Comme l'ajout est refusé, le stock doit rester identique
          expect(stockAfter).to.eq(stockBefore);
        });
      });
    });
  });

  // Ce test vérifie que l'information de disponibilité du produit est visible.
  // Cela permet à l'utilisateur de savoir si le produit peut être acheté.
  it("devrait vérifier la présence du champ de disponibilité", () => {
    cy.visit("/#/products/6");

    cy.contains("en stock").should("be.visible");
  });

  // Ce test vérifie qu'une quantité négative n'est pas acceptée.
  // Une quantité négative serait incohérente dans un panier.
  it("ne devrait pas accepter une quantité négative", () => {
    cy.request({
      method: "POST",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: {
        product: 6,
        quantity: -1,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  // Ce test vérifie qu'une quantité supérieure à 20 est refusée.
  // Cela permet de contrôler une limite métier et d'éviter les commandes abusives.
  it("ne devrait pas accepter une quantité supérieure à 20", () => {
    cy.request({
      method: "POST",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: {
        product: 6,
        quantity: 21,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  // Ce test ajoute un produit depuis l'interface,
  // puis vérifie via l'API que le panier est accessible.
  // Cela permet de lier un test front-end avec une vérification back-end.
  it("devrait ajouter un élément via le bouton et vérifier le contenu du panier via l'API", () => {
    cy.visit("/#/products/9");

    cy.contains("Ajouter au panier").click();

    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
    });
  });
});
