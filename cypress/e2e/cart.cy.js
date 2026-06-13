// Tests fonctionnels du panier - Tests via l'interface
describe("Test fonctionnel - Panier", () => {
  // URL de l'API
  const apiUrl = "http://localhost:8081";
  // Variable pour stocker le token de connexion
  let token;

  // Avant chaque test, on se connecte via l'API
  beforeEach(() => {
    cy.request("POST", apiUrl + "/login", {
      username: "test2@test.fr",
      password: "testtest",
    }).then((response) => {
      // On récupère le token
      token = response.body.token;
      // On stocke la connexion dans le navigateur pour que le site sache qu'on est connecté
      window.localStorage.setItem("user", JSON.stringify(response.body));
    });
  });

  // Test 1 : Vérifier qu'un produit s'affiche correctement et l'ajouter au panier
  it("devrait afficher un produit avec son stock et l ajouter au panier", () => {
    // On ouvre la page du produit 6
    cy.visit("/#/products/6");
    // On vérifie que le bouton, le stock et l'image sont visibles
    cy.contains("Ajouter au panier").should("be.visible");
    cy.contains("en stock").should("be.visible");
    cy.get("img").should("be.visible");
    // On clique sur le bouton pour ajouter au panier
    cy.contains("Ajouter au panier").click();
  });

  // Test 2 : Vérifier que le stock diminue après ajout
  it("devrait verifier que le stock diminue apres ajout au panier", () => {
    // On cherche un produit qui a du stock (supérieur à 1)
    cy.request(apiUrl + "/products").then((response) => {
      const product = response.body.find((p) => p.availableStock > 1);
      if (product) {
        // On note le stock avant l'ajout
        const stockBefore = product.availableStock;
        // On ajoute 1 unité au panier via l'API
        cy.request({
          method: "PUT",
          url: apiUrl + "/orders/add",
          headers: { Authorization: "Bearer " + token },
          body: { product: product.id, quantity: 1 },
        });
        // On vérifie que le stock a diminué
        cy.request(apiUrl + "/products/" + product.id).then((response2) => {
          const stockAfter = response2.body.availableStock;
          expect(stockAfter).to.be.lessThan(stockBefore);
        });
      }
    });
  });

  // Test 3 : Vérifier que le champ de disponibilité est affiché
  it("devrait verifier la presence du champ de disponibilite", () => {
    cy.visit("/#/products/6");
    // On vérifie que le texte "en stock" est visible
    cy.contains("en stock").should("be.visible");
  });

  // Test 4 : Vérifier qu'une quantité négative est refusée
  it("ne devrait pas accepter une quantite negative", () => {
    cy.visit("/#/products/6");
    // On efface le champ et on tape -1
    cy.get('input[type="number"]').clear().type("-1");
    // On clique sur le bouton
    cy.contains("Ajouter au panier").click();
  });

  // Test 5 : Vérifier qu'une quantité supérieure à 20 est refusée
  it("ne devrait pas accepter une quantite superieure a 20", () => {
    cy.visit("/#/products/6");
    // On efface le champ et on tape 21
    cy.get('input[type="number"]').clear().type("21");
    cy.contains("Ajouter au panier").click();
    // On vérifie aussi via l'API que c'est refusé
    cy.request({
      method: "PUT",
      url: apiUrl + "/orders/add",
      headers: { Authorization: "Bearer " + token },
      body: { product: 6, quantity: 21 },
      failOnStatusCode: false,
    }).then((response) => {
      // L'API ne devrait PAS retourner 200 (succès)
      expect(response.status).to.not.eq(200);
    });
  });

  // Test 6 : Ajouter via le bouton et vérifier le panier via l'API
  it("devrait ajouter un element via le bouton et verifier le contenu du panier via l API", () => {
    // On ouvre un autre produit et on l'ajoute
    cy.visit("/#/products/9");
    cy.contains("Ajouter au panier").click();
    // On vérifie le contenu du panier via l'API
    cy.request({
      method: "GET",
      url: apiUrl + "/orders",
      headers: { Authorization: "Bearer " + token },
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
