// Huit cas API : les attentes métier restent visibles, y compris en cas d'anomalie.
// Ces tests interrogent directement le serveur, sans cliquer dans les pages.
// Repères : describe regroupe les tests ; it décrit un cas ; expect et should vérifient un résultat.
describe('Tests API', () => {
  // Adresse de l'API. Le token sert à authentifier les demandes vers les routes protégées.
  const api = 'http://localhost:8081';
  let token, initialCart;
  // Avant chaque test, je prépare une connexion valide et je garde le panier de départ.
  beforeEach(() => {
    initialCart = undefined;
    // cy.login renvoie le token ; then me permet de récupérer cette valeur.
    // login et getCart sont définies dans cypress/support/commands.js.
    cy.login().then((value) => {
      token = value;
      return cy.getCart(token);
    // body contient les données du panier renvoyées par le serveur ; je les garde pour la restauration.
    }).then(({ body }) => { initialCart = body; });
  });
  // Après le test, même si une assertion échoue, je restaure le panier s'il a été sauvegardé.
  afterEach(() => {
    if (initialCart) cy.restoreCart(token, initialCart);
  });

  // A1 : ce test attend 401 sans token. Marie attendait 403 ; l'écart reste à clarifier.
  it('refuse /orders sans authentification avec 401 (écart A1 avec Marie)', () => {
    // cy.request envoie la demande à l'API. failOnStatusCode:false permet d'examiner la réponse d'erreur.
    cy.request({ url: `${api}/orders`, failOnStatusCode: false }).then(({ status }) => {
      // expect compare le code reçu à 401 : l'accès doit être refusé.
      expect(status).to.eq(401);
    });
  });
  it('retourne le panier de l’utilisateur authentifié', () => {
    // getCart lit le panier ; its récupère body ; should vérifie la présence de son identifiant.
    cy.getCart(token).its('body').should('have.property', 'id');
  });
  it('retourne les informations du produit demandé', () => {
    // Je demande le produit 6. then donne accès au code de réponse et aux données reçues.
    cy.request(`${api}/products/6`).then(({ status, body }) => {
      expect(status).to.eq(200);
      // Je contrôle le bon produit, un nom non vide et un stock numérique.
      expect(body.id).to.eq(6);
      expect(body.name).to.be.a('string').and.not.be.empty;
      expect(body.availableStock).to.be.a('number');
    });
  });
  // Je teste le refus d'une connexion avec des identifiants invalides ; le code attendu est 401.
  it('refuse les identifiants inconnus avec 401', () => {
    cy.request({ method: 'POST', url: `${api}/login`,
      body: { username: 'inconnu@test.fr', password: 'mauvaismotdepasse' },
      failOnStatusCode: false,
    }).its('status').should('eq', 401);
  });
  it('retourne un token pour les bons identifiants', () => {
    // Une connexion valide doit fournir un token sous forme de texte non vide.
    cy.login().should('be.a', 'string').and('not.be.empty');
  });
  // A2 : je vérifie le refus de POST avec 405 et la méthode PUT annoncée par le serveur.
  it('constate POST refusé puis vérifie l’ajout par PUT (écart A2)', () => {
    cy.request({ method: 'POST', url: `${api}/orders/add`,
      // L'en-tête Authorization transmet le token avec le préfixe Bearer.
      headers: { Authorization: `Bearer ${token}` },
      body: { product: 6, quantity: 1 }, failOnStatusCode: false,
    }).then(({ status, headers }) => {
      expect(status).to.eq(405);
      expect(headers.allow).to.include('PUT');
    });
    cy.request(`${api}/products/6`).its('body.availableStock').should('be.greaterThan', 1);
    // addToCart envoie l'ajout par PUT. Je vérifie ensuite la réussite et la quantité réellement enregistrée.
    cy.addToCart(6, 1, token).its('status').should('eq', 200);
    cy.getCart(token).then(({ body }) => {
      // find cherche la ligne du produit 6 ; si elle est absente, la quantité de départ vaut zéro.
      const before = initialCart.orderLines.find((line) => line.product.id === 6)?.quantity || 0;
      expect(body.orderLines.find((line) => line.product.id === 6)?.quantity).to.eq(before + 1);
    });
  });
  // A3 : un produit sans stock doit être refusé, sans changer le panier ni le stock.
  it('refuse un ajout en rupture sans modifier le panier ni le stock (A3)', () => {
    cy.request(`${api}/products`).then(({ body }) => {
      // Je cherche un produit en rupture. L'assertion suivante vérifie cette condition avant l'essai.
      const product = body.find((item) => item.availableStock === 0);
      expect(product, 'précondition : un produit en rupture doit exister').to.exist;
      cy.addToCart(product.id, 1, token).then((response) => {
        cy.getCart(token).then(({ body: cart }) => {
          cy.request(`${api}/products/${product.id}`).then(({ body: updated }) => {
            // Je garde les valeurs observées dans un fichier de preuve avant les assertions.
            return cy.writeFile('cypress/results/a3-rupture.json', {
              product: product.id, stockBefore: product.availableStock, stockAfter: updated.availableStock,
              requestedQuantity: 1, status: response.status, cartBefore: initialCart.orderLines, cartAfter: cart.orderLines,
            }).then(() => {
              // Attendu : un refus 4xx, le même panier et un stock toujours égal à zéro.
              // Ces assertions vérifient le comportement attendu, même si l'application présente encore A3.
              expect(response.status, 'refus de la quantité indisponible').to.be.within(400, 499);
              expect(cart.orderLines).to.deep.eq(initialCart.orderLines);
              expect(updated.availableStock).to.eq(0);
            });
          });
        });
      });
    });
  });
  it('enregistre un avis et le retrouve dans la liste', () => {
    // Le titre daté permet de retrouver l'avis créé par cet essai.
    const title = `Avis API ${Date.now()}`;
    const comment = 'Avis créé par un test automatisé';
    // Je crée l'avis par l'API. Un code 200 ou 201 confirme la réussite de cette demande.
    cy.request({ method: 'POST', url: `${api}/reviews`,
      headers: { Authorization: `Bearer ${token}` }, body: { title, comment, rating: 5 },
    }).then(({ status }) => { expect(status).to.be.oneOf([200, 201]); });
    // Je relis la liste, puis je vérifie que mon avis, son commentaire et sa note ont été enregistrés.
    cy.request(`${api}/reviews`).then(({ body }) => {
      const review = body.find((item) => item.title === title);
      expect(review, 'avis enregistré').to.exist;
      expect(review.comment).to.eq(comment);
      expect(review.rating).to.eq(5);
    });
  });
});
