// Deux vecteurs XSS réellement soumis, retrouvés après rechargement et contrôlés.
// Les deux essais portent sur les champs d'un avis ; ils ne prouvent pas la sécurité complète du site.
describe('Test de faille XSS - Espace commentaire', () => {
  let token;
  // Avant chaque essai, je récupère un token valide avec la commande login de cypress/support/commands.js.
  beforeEach(() => { cy.login().then((value) => { token = value; }); });

  // Cette fonction commune reçoit le champ à tester et le texte d'injection à essayer.
  const verifyReview = (field, payload) => {
    // Le repère daté permet de retrouver précisément l'avis créé par cet essai.
    const marker = `XSS-${field}-${Date.now()}`;
    // stub crée un témoin pour les alertes ; as permet de le retrouver sous le nom xssAlert.
    const alert = cy.stub().as('xssAlert');
    // L'observation commence avant la visite et reste active après rechargement.
    cy.on('window:alert', alert);
    // Je surveille la lecture des avis par GET et l'envoi d'un nouvel avis par POST.
    cy.intercept('GET', '**/reviews').as('reviews');
    cy.intercept('POST', '**/reviews').as('postReview');
    cy.visitAsUser('/#/reviews', token);
    // J'attends le chargement des avis et je vérifie que le serveur répond 200.
    cy.wait('@reviews').its('response.statusCode').should('eq', 200);
    // L'injection est placée dans le champ choisi ; l'autre champ contient un texte normal.
    const title = field === 'title' ? `${marker} ${payload}` : marker;
    const comment = field === 'comment' ? `${marker} ${payload}` : `Avis ${marker}`;
    // Je choisis la dernière étoile. last prend le dernier élément ; click appuie dessus.
    cy.get('[data-cy="review-input-rating-images"] img').last().click();
    // Je saisis le texte exact : les séquences entre accolades ne sont pas interprétées comme des touches spéciales.
    cy.get('[data-cy="review-input-title"]').type(title, { parseSpecialCharSequences: false });
    cy.get('[data-cy="review-input-comment"]').type(comment, { parseSpecialCharSequences: false });
    cy.get('[data-cy="review-submit"]').click();
    // Après le clic d'envoi, j'attends la réponse à la création de l'avis : 200 ou 201.
    cy.wait('@postReview').then(({ response }) => {
      expect(response.statusCode).to.be.oneOf([200, 201]);
    });
    // Je relis les avis et je vérifie que celui qui porte mon repère a bien été enregistré.
    cy.wait('@reviews').then(({ response }) => {
      expect(response.body.find((review) => review.title.includes(marker)), 'avis enregistré').to.exist;
    });
    // Je recharge la page pour vérifier le réaffichage de l'avis, au-delà de la première soumission.
    cy.reload();
    cy.wait('@reviews').its('response.statusCode').should('eq', 200);
    // Je retrouve mon avis grâce à son titre, puis je limite les contrôles à cet avis avec within.
    cy.contains('[data-cy="review-title"]', marker).should('be.visible')
      .closest('[data-cy="review-detail"]').within(() => {
        // Dans cet avis, je vérifie l'absence de balise script et des attributs onerror ou onload.
        cy.get('script, [onerror], [onload]').should('not.exist');
        cy.get('[data-cy="review-comment"]').should('contain', marker);
      });
    // Je vérifie que le témoin n'a enregistré aucune alerte déclenchée pendant l'essai.
    cy.get('@xssAlert').should('not.have.been.called');
  };
  // Premier cas : une balise script dans le titre. Le même ensemble de vérifications est appliqué.
  it('empêche l’exécution d’un script injecté dans le titre', () => {
    verifyReview('title', '<script>alert("XSS")</script>');
  });
  // Second cas : une image avec un gestionnaire onerror dans le commentaire.
  it('neutralise le gestionnaire onerror injecté dans le commentaire', () => {
    verifyReview('comment', '<img src="x" onerror="alert(\'XSS\')">');
  });
});
