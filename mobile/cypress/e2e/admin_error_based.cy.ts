function getToken(email: string, password: string) {
  return cy.request({
    method: "POST",
    url: "http://localhost:8000/auth/login",
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body.token as string;
  });
}

describe("MEVA Admin - Error-Based Testing", () => {

  it("TC-ERR-01 Paprasto vartotojo prieiga prie Admin API", () => {

    getToken("user@meva.lt", "user123").then((token) => {

      cy.request({
        method: "GET",
        url: "http://localhost:8000/admin/users?limit=200",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        failOnStatusCode: false,
      }).then((response) => {

        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });


  it("TC-ERR-02 Admin API prieiga be autentifikacijos", () => {

    cy.request({
      method: "GET",
      url: "http://localhost:8000/admin/users?limit=200",
      failOnStatusCode: false,
    }).then((response) => {

      expect(response.status).to.be.oneOf([401, 403]);
    });
  });


  it("TC-ERR-03 Vartotojo vardas sudarytas tik iš tarpų", () => {

    getToken("admin@meva.lt", "admin123").then((token) => {

      cy.request({
        method: "PATCH",
        url: "http://localhost:8000/admin/users/3",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          name: "   ",
          email: "user@meva.lt",
          role: "user",
        },
        failOnStatusCode: false,
      }).then((response) => {

        expect(
          response.status,
          "Username sudarytas tik iš tarpų turi būti atmestas"
        ).to.be.oneOf([400, 422]);
      });
    });
  });


  it("TC-ERR-04 Neegzistuojančio vartotojo redagavimas", () => {

    getToken("admin@meva.lt", "admin123").then((token) => {

      cy.request({
        method: "PATCH",
        url: "http://localhost:8000/admin/users/999999",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          name: "Ghost User",
          email: "ghost@meva.lt",
          role: "user",
        },
        failOnStatusCode: false,
      }).then((response) => {

        expect(response.status).to.eq(404);
      });
    });
  });

});
