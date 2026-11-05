import { describe, expect, it } from "vitest";
import { signupInput, userInput } from "@/lib/schemas/user";

const base = { role: "DEV", name: "Ben", email: " Ben@Davao-Water.gov.ph " };

describe("signupInput", () => {
  it("accepts a developer or QA tester and lower-cases the email", () => {
    expect(signupInput.parse(base)).toMatchObject({ role: "DEV", email: "ben@davao-water.gov.ph" });
    expect(signupInput.parse({ ...base, role: "QA" }).role).toBe("QA");
  });

  it("never lets someone pick admin", () => {
    expect(signupInput.safeParse({ ...base, role: "ADMIN" }).success).toBe(false);
    expect(signupInput.safeParse({ ...base, role: "" }).success).toBe(false);
  });

  it("asks for no password (their browser gets a temporary one after approval)", () => {
    expect(Object.keys(signupInput.parse(base)).sort()).toEqual(["email", "name", "role"]);
  });

  it("only accepts @davao-water.gov.ph addresses", () => {
    for (const bad of ["ben@gmail.com", "ben@davao-water.gov.ph.example.com", "ben@sub.davao-water.gov.ph", "ben@davao-water.gov", "davao-water.gov.ph@gmail.com"]) {
      const r = signupInput.safeParse({ ...base, email: bad });
      expect(r.success, bad).toBe(false);
    }
    expect(signupInput.safeParse({ ...base, email: "ben@gmail.com" }).error?.issues[0].message).toBe("Use your @davao-water.gov.ph email address");
    expect(signupInput.parse({ ...base, email: "BEN@DAVAO-WATER.GOV.PH" }).email).toBe("ben@davao-water.gov.ph");
    expect(userInput.safeParse({ name: "Ben", email: "ben@yahoo.com", role: "DEV" }).success).toBe(false);
    expect(userInput.safeParse({ name: "Ben", email: "ben@davao-water.gov.ph", role: "DEV" }).success).toBe(true);
  });

  it("needs a name and a valid email", () => {
    expect(signupInput.safeParse({ ...base, name: " " }).success).toBe(false);
    expect(signupInput.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });
});
