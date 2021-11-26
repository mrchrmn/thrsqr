/// <reference types="cypress" />

describe("from start page to new event", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000");
  });

  it("opens new event page", () => {
    cy.get("button").click();

    cy.get("h2").should("have.text", "Set up a new event");
  });
});