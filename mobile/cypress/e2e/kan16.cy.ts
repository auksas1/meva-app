function loginAsAdmin() {
  cy.intercept("POST", "**/auth/login").as("login");

  cy.visit("/");

  cy.get('input[placeholder="you@example.com"]')
    .clear()
    .type("admin@meva.lt");

  cy.get('input[placeholder="Your password"]')
    .clear()
    .type("admin123{enter}");

  cy.wait("@login")
    .its("response.statusCode")
    .should("eq", 200);
}

describe("KAN-16 - Vartotojų paskyrų sąrašo peržiūra", () => {

  it("TC-KAN16-01 EP Registruotų vartotojų sąrašo atidarymas", () => {

  cy.intercept("GET", "**/admin/users*").as("getUsers");

  loginAsAdmin();

  cy.contains("Admin", { timeout: 10000 })
    .should("be.visible");

  // Spaudžiame Admin navigacijoje
  cy.contains(/^Admin$/)
    .last()
    .click();

  cy.wait("@getUsers")
    .its("response.statusCode")
    .should("eq", 200);

  cy.contains("Registered users")
    .should("be.visible");

  cy.screenshot("TC-KAN16-01");
});

  it("TC-KAN16-02 EP Paskyros informacijos rodymas", () => {

  cy.intercept("GET", "**/admin/users*").as("getUsers");

  loginAsAdmin();

  cy.contains(/^Admin$/, { timeout: 10000 })
    .last()
    .click();

  cy.wait("@getUsers")
    .its("response.statusCode")
    .should("eq", 200);

  cy.contains("Registered users")
    .should("be.visible");

  cy.contains("Test User")
    .should("be.visible");

  cy.contains("user@meva.lt")
    .should("be.visible");

  cy.contains("Role: user")
    .should("be.visible");

  // DOM yra "Active", nors CSS ekrane jį parodo kaip ACTIVE
  cy.contains("Active")
    .should("be.visible");

  cy.screenshot("TC-KAN16-02");
});

it("TC-KAN16-03 EP Vartotojo paskyros pasirinkimas", () => {

  cy.intercept("GET", "**/admin/users*").as("getUsers");
  cy.intercept("GET", "**/admin/users/*").as("getUser");

  loginAsAdmin();

  cy.contains(/^Admin$/, { timeout: 10000 })
    .last()
    .click();

  cy.wait("@getUsers")
    .its("response.statusCode")
    .should("eq", 200);

  cy.contains("Registered users")
    .should("be.visible");

  // Pasirenkame konkrečią paskyrą
  cy.contains("Test User")
  .should("be.visible")
  .click();

  cy.wait("@getUser")
    .its("response.statusCode")
    .should("eq", 200);

  cy.contains("Edit user")
    .should("be.visible");

  cy.get('input[value="Test User"]')
    .should("be.visible");

  cy.get('input[value="user@meva.lt"]')
    .should("be.visible");

  cy.contains("Save changes")
    .should("be.visible");

  cy.screenshot("TC-KAN16-03_PASS");
});

it("TC-KAN16-04 BVA 0 registruotų vartotojų", () => {

  cy.intercept("GET", "**/admin/users?limit=200", {
    statusCode: 200,
    body: {
      items: [],
      total: 0
    }
  }).as("getUsersBVA");

  loginAsAdmin();

  cy.contains(/^Admin$/, { timeout: 10000 })
    .last()
    .click();

  cy.wait("@getUsersBVA");

  cy.contains("Registered users")
    .should("be.visible");

  cy.contains("0 accounts")
    .should("be.visible");

  cy.contains("No users")
    .should("be.visible");

  cy.contains("No registered user accounts were found.")
    .should("be.visible");

  cy.screenshot("TC-KAN16-04_PASS");
});

it("TC-KAN16-05 BVA 1 registruotas vartotojas", () => {

  cy.intercept("GET", "**/admin/users?limit=200", {
    statusCode: 200,
    body: {
      items: [
        {
          id: 101,
          email: "one@meva.lt",
          name: "Vienas User",
          role: "user",
          is_blocked: false,
          created_at: "2026-10-05T12:00:00"
        }
      ],
      total: 1
    }
  }).as("getUsersBVA");

  loginAsAdmin();

  cy.contains(/^Admin$/, { timeout: 10000 })
    .last()
    .click();

  cy.wait("@getUsersBVA");

  cy.contains("1 account")
    .should("be.visible");

  cy.contains("Vienas User")
    .should("be.visible");

  cy.contains("one@meva.lt")
    .should("be.visible");

  cy.contains("Role: user")
    .should("be.visible");

  cy.contains("Active")
    .should("be.visible");

  cy.screenshot("TC-KAN16-05_PASS");
});

it("TC-KAN16-06 BVA 2 registruoti vartotojai", () => {

  cy.intercept("GET", "**/admin/users?limit=200", {
    statusCode: 200,
    body: {
      items: [
        {
          id: 101,
          email: "one@meva.lt",
          name: "Vienas User",
          role: "user",
          is_blocked: false,
          created_at: "2026-10-05T12:00:00"
        },
        {
          id: 102,
          email: "two@meva.lt",
          name: "Antras User",
          role: "admin",
          is_blocked: true,
          created_at: "2026-10-05T12:01:00"
        }
      ],
      total: 2
    }
  }).as("getUsersBVA");

  loginAsAdmin();

  cy.contains(/^Admin$/, { timeout: 10000 })
    .last()
    .click();

  cy.wait("@getUsersBVA");

  cy.contains("2 accounts")
    .should("be.visible");

  cy.contains("Vienas User")
    .should("be.visible");

  cy.contains("one@meva.lt")
    .should("be.visible");

  cy.contains("Antras User")
    .should("be.visible");

  cy.contains("two@meva.lt")
    .should("be.visible");

  cy.contains("Blocked")
    .should("be.visible");

  cy.screenshot("TC-KAN16-06_PASS");
});

});
