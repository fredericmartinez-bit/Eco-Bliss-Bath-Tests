// Deux vecteurs XSS réellement soumis, retrouvés après rechargement et contrôlés.
describe('Test de faille XSS - Espace commentaire', () => {
  let token;
  beforeEach(() => { cy.login().then((value) => { token = value; }); });

  const verifyReview = (field, payload) => {
    const marker = `XSS-${field}-${Date.now()}`;
    const alert = cy.stub().as('xssAlert');
    // L'observation commence avant la visite et reste active après rechargement.
    cy.on('window:alert', alert);
    cy.intercept('GET', '**/reviews').as('reviews');
    cy.intercept('POST', '**/reviews').as('postReview');
    cy.visitAsUser('/#/reviews', token);
    cy.wait('@reviews').its('response.statusCode').should('eq', 200);
    const title = field === 'title' ? `${marker} ${payload}` : marker;
    const comment = field === 'comment' ? `${marker} ${payload}` : `Avis ${marker}`;
    cy.get('[data-cy="review-input-rating-images"] img').last().click();
    cy.get('[data-cy="review-input-title"]').type(title, { parseSpecialCharSequences: false });
    cy.get('[data-cy="review-input-comment"]').type(comment, { parseSpecialCharSequences: false });
    cy.get('[data-cy="review-submit"]').click();
    cy.wait('@postReview').then(({ response }) => {
      expect(response.statusCode).to.be.oneOf([200, 201]);
    });
    cy.wait('@reviews').then(({ response }) => {
      expect(response.body.find((review) => review.title.includes(marker)), 'avis enregistré').to.exist;
    });
    cy.reload();
    cy.wait('@reviews').its('response.statusCode').should('eq', 200);
    cy.contains('[data-cy="review-title"]', marker).should('be.visible')
      .closest('[data-cy="review-detail"]').within(() => {
        cy.get('script, [onerror], [onload]').should('not.exist');
        cy.get('[data-cy="review-comment"]').should('contain', marker);
      });
    cy.get('@xssAlert').should('not.have.been.called');
  };
  it('empêche l’exécution d’un script injecté dans le titre', () => {
    verifyReview('title', '<script>alert("XSS")</script>');
  });
  it('neutralise le gestionnaire onerror injecté dans le commentaire', () => {
    verifyReview('comment', '<img src="x" onerror="alert(\'XSS\')">');
  });
});
