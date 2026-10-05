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

function getAdminToken() {
  return cy.request({
    method: "POST",
    url: "http://localhost:8000/auth/login",
    body: {
      email: "admin@meva.lt",
      password: "admin123",
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body.token as string;
  });
}

function openTestUser() {
  cy.intercept("GET", "**/admin/users*").as("getUsers");
  cy.intercept("GET", "**/admin/users/*").as("getUser");

  cy.contains(/^Admin$/, { timeout: 10000 })
    .last()
    .click();

  cy.wait("@getUsers");

  cy.contains("Test User")
    .should("be.visible")
    .click();

  cy.wait("@getUser");

  cy.contains("Edit user")
    .should("be.visible");
}

function resetTestUser() {
  return cy.request({
    method: "POST",
    url: "http://localhost:8000/auth/login",
    body: {
      email: "admin@meva.lt",
      password: "admin123",
    },
  }).then((loginResponse) => {
    const token = loginResponse.body.token;

    return cy.request({
      method: "PATCH",
      url: "http://localhost:8000/admin/users/3",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        name: "Test User",
        email: "user@meva.lt",
        role: "user",
      },
    });
  });
}

describe("KAN-18 - Vartotojo paskyros informacijos redagavimas", () => {

  beforeEach(() => {
    resetTestUser();
  });
  afterEach(() => {
    resetTestUser();
  });

it("TC-KAN18-01 EP Vartotojo paskyros pasirinkimas redagavimui", () => {

  loginAsAdmin();
  openTestUser();

  cy.get('input[value="Test User"]')
    .should("be.visible");

  cy.get('input[value="user@meva.lt"]')
    .should("be.visible");

  cy.contains("Save changes")
    .should("be.visible");

  cy.screenshot("TC-KAN18-01_PASS");
});

it("TC-KAN18-02 EP Galiojančio el. pašto redagavimas", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[value="user@meva.lt"]')
    .clear()
    .type("newuser@meva.lt");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .its("response.statusCode")
    .should("be.oneOf", [200, 204]);

  // Patikriname, kad naujas email tikrai išliko
  cy.get('input[value="newuser@meva.lt"]')
    .should("be.visible");

  cy.screenshot("TC-KAN18-02_PASS");

  // Grąžiname pradinį email kitų testų stabilumui
  cy.get('input[value="newuser@meva.lt"]')
    .clear()
    .type("user@meva.lt");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser");
});

it("TC-KAN18-03 EP Galiojančio vartotojo vardo redagavimas", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[value="Test User"]')
    .clear()
    .type("Algis");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .its("response.statusCode")
    .should("be.oneOf", [200, 204]);

  cy.get('input[value="Algis"]')
    .should("be.visible");

  cy.screenshot("TC-KAN18-03_PASS");

  // Atstatome
  cy.get('input[value="Algis"]')
    .clear()
    .type("Test User");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser");
});

it("TC-KAN18-04 EP Galiojančio prieigos lygio redagavimas", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  // Pasirenkame Admin būtent Access level bloke
  cy.contains("Access level")
    .parent()
    .parent()
    .within(() => {
      cy.contains(/^Admin$/)
        .click();
    });

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .then((interception) => {
      expect(interception.response?.statusCode)
        .to.be.oneOf([200, 204]);

      expect(interception.request.body.role)
        .to.eq("admin");
    });

  cy.screenshot("TC-KAN18-04_PASS");
});

it("TC-KAN18-05 EP Netinkamo el. pašto formato atmetimas", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[placeholder="user@example.com"]')
    .clear()
    .type("testtest.lt");

  cy.contains("Save changes")
    .click();

  // Backend turi atmesti netinkamą email
  cy.wait("@updateUser")
    .its("response.statusCode")
    .should("eq", 400);

  // Patikriname, kad DB senas email liko nepakeistas
  getAdminToken().then((token) => {
    cy.request({
      method: "GET",
      url: "http://localhost:8000/admin/users/3",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.email).to.eq("user@meva.lt");
    });
  });

  cy.screenshot("TC-KAN18-05_PASS");
});

it("TC-KAN18-06 BVA Vartotojo vardas 0 simbolių", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[placeholder="Username"]')
    .clear();

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .then((interception) => {

      // Pagal KAN-18 AC6 sistema PRIVALO atmesti tuščią username.
      // Todėl tikimės HTTP 400.
      expect(
        interception.response?.statusCode,
        "Tuščias vartotojo vardas turi būti atmestas"
      ).to.eq(400);
    });
});

it("TC-KAN18-07 BVA Vartotojo vardas 1 simbolis", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[placeholder="Username"]')
    .clear()
    .type("A");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.name).to.eq("A");
    });

  cy.get('input[placeholder="Username"]')
    .should("have.value", "A");

  cy.screenshot("TC-KAN18-07_PASS");
});

it("TC-KAN18-08 BVA Vartotojo vardas 2 simboliai", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[placeholder="Username"]')
    .clear()
    .type("AB");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.name).to.eq("AB");
    });

  cy.get('input[placeholder="Username"]')
    .should("have.value", "AB");

  cy.screenshot("TC-KAN18-08_PASS");
});

it("TC-KAN18-09 EP-DT Neleistino prieigos lygio atmetimas", () => {

  getAdminToken().then((token) => {

    cy.request({
      method: "PATCH",
      url: "http://localhost:8000/admin/users/3",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: {
        name: "Test User",
        email: "user@meva.lt",
        role: "manager",
      },

      // Cypress kitaip pats sustabdytų testą dėl HTTP 400
      failOnStatusCode: false,

    }).then((response) => {

      expect(response.status).to.eq(400);

      expect(response.body.detail)
        .to.eq("Role must be 'user' or 'admin'.");
    });

    // Patikriname, kad role tikrai nebuvo pakeista
    cy.request({
      method: "GET",
      url: "http://localhost:8000/admin/users/3",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {

      expect(response.status).to.eq(200);
      expect(response.body.role).to.eq("user");
    });
  });
});

it("TC-KAN18-10 DT Administratoriaus pakeitimo registravimas loguose", () => {

  cy.intercept("PATCH", "**/admin/users/*").as("updateUser");

  loginAsAdmin();
  openTestUser();

  cy.get('input[placeholder="Username"]')
    .clear()
    .type("AuditTest");

  cy.contains("Save changes")
    .click();

  cy.wait("@updateUser")
    .its("response.statusCode")
    .should("eq", 200);

  // Gauname admin token audit log patikrinimui
  getAdminToken().then((token) => {

    cy.request({
      method: "GET",
      url: "http://localhost:8000/admin/audit?limit=100",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {

      expect(response.status).to.eq(200);

      const auditEntry = response.body.find(
        (entry: any) =>
          entry.target_user_id === 3 &&
          entry.action === "USER_UPDATED"
      );

      expect(auditEntry).to.exist;

      // Pakanka, kad log'as fiksuotų pakeistą lauką.
      // KAN-18 AC5 nereikalauja old/new reikšmių.
      expect(auditEntry.details).to.contain("name");
    });
  });

  cy.screenshot("TC-KAN18-10_PASS");
});

});
