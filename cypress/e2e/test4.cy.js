describe("test 4", () => {
  it("passes", () => {
    cy.visit("http://localhost:4173/");
    cy.get("h1").contains("React");
  });
  it("passes", () => {
    cy.visit("http://localhost:4173/");
    cy.get("h1").contains("React");
  });
});
