// Tests API et tests fonctionnels du panier
describe("Test fonctionnel - Panier", () => {
  // URL de base du back-end Symfony
  const apiUrl = "http://localhost:8081";

  // Variable utilisée pour stocker le token de connexion
  let token;

  // Avant chaque test, on connecte l’utilisateur via l’API
  // Cela permet d’avoir un token valide pour les routes protégées comme /orders
  beforeEach(() => {
    cy.request("POST", apiUrl + "/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      token = response.body.token;

      // On stocke aussi l’utilisateur dans le localStorage
      // pour que le front-end considère l’utilisateur comme connecté
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Test API : vérifie qu’un utilisateur inconnu ne peut pas se connecter
  // Résultat attendu : l’API retourne une erreur 401
  it("devrait retourner 401 pour un utilisateur inconnu", () => {
    cy.request({
      method: "POST",
      url: apiUrl + "/login",
      body: {
        username: "inconnu@test.fr",
        password: "mauvaismotdepasse",
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  // Test API : vérifie qu’un utilisateur connu peut se connecter
  // Résultat attendu : code 200 et présence d’un token
  it("devrait retourner 200 pour un utilisateur connu", () => {
    cy.request({
      method: "POST",
      url: apiUrl + "/login",
      body: {
        username: "test2@test.fr",
        password: "testtest",
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.token).to.exist;
    });
  });

  // Test front + API : vérifie qu’une fiche produit s’affiche correctement
  // puis vérifie que le panier est accessible via l’API après clic sur Ajouter au panier
  it("devrait afficher un produit avec son stock et l'ajouter au panier", () => {
    cy.visit("/#/products/6");

    cy.contains("Ajouter au panier").should("be.visible");
    cy.contains("en stock").should("be.visible");
    cy.get("img").should("be.visible");

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

  // Test API : vérifie le comportement de la route POST /orders/add
  // Ici, le résultat observé est 405, ce qui montre que la méthode POST est refusée
  it("devrait tester l'ajout d'un produit disponible au panier", () => {
    cy.request({
      method: "POST",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: {
        product: 6,
        quantity: 1,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(405);
    });
  });

  // Test API : vérifie qu’un produit en rupture de stock ne peut pas être ajouté au panier
  // On cherche d’abord un produit avec un stock égal à 0
  it("devrait refuser l'ajout d'un produit en rupture de stock", () => {
    cy.request(apiUrl + "/products").then((response) => {
      const productOutOfStock = response.body.find(
        (product) => product.availableStock === 0,
      );

      expect(productOutOfStock).to.exist;

      cy.request({
        method: "POST",
        url: apiUrl + "/orders/add",
        headers: { Authorization: "Bearer " + token },
        body: {
          product: productOutOfStock.id,
          quantity: 1,
        },
        failOnStatusCode: false,
      }).then((addResponse) => {
        expect(addResponse.status).to.not.eq(200);
      });
    });
  });

  // Test API : vérifie que POST /orders/add est refusé
  // On vérifie aussi que le stock du produit ne change pas après la requête refusée
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
        cy.log("Status ajout panier : " + addResponse.status);

        expect(addResponse.status).to.eq(405);

        cy.request(apiUrl + "/products/6").then((response2) => {
          const stockAfter = response2.body.availableStock;

          expect(stockAfter).to.eq(stockBefore);
        });
      });
    });
  });

  // Test front : vérifie que l’information de disponibilité est visible sur la fiche produit
  it("devrait vérifier la présence du champ de disponibilité", () => {
    cy.visit("/#/products/6");

    cy.contains("en stock").should("be.visible");
  });

  // Test API : vérifie qu’une quantité négative est refusée
  // C’est important pour éviter des commandes incohérentes
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

  // Test API : vérifie qu’une quantité supérieure à 20 est refusée
  // Cela permet de contrôler les limites métier du panier
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

  // Test API : vérifie que l’utilisateur connecté peut récupérer son panier
  it("devrait retourner la liste des produits du panier", () => {
    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
    });
  });

  // Test API : vérifie qu’une fiche produit précise est retournée avec le bon id
  it("devrait retourner la fiche d'un produit spécifique", () => {
    cy.request({
      method: "GET",
      url: apiUrl + "/products/6",
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.exist;
      expect(response.body.id).to.eq(6);
    });
  });

  // Test front + API : ajoute un produit depuis l’interface,
  // puis vérifie via l’API que le panier reste accessible
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
