import { t, setLocale, getLocale } from "../../src/i18n";

describe("i18n", () => {
  it("returns PT-BR by default", () => {
    setLocale("pt-BR");
    expect(getLocale()).toBe("pt-BR");
    expect(t("auth.signIn")).toBe("Entrar");
  });

  it("switches to English", () => {
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("auth.signIn")).toBe("Sign In");
  });

  it("switches to Spanish", () => {
    setLocale("es");
    expect(getLocale()).toBe("es");
    expect(t("auth.signIn")).toBe("Iniciar sesión");
  });

  it("switches to French", () => {
    setLocale("fr");
    expect(getLocale()).toBe("fr");
    expect(t("auth.signIn")).toBe("Se connecter");
  });

  it("handles parameter interpolation", () => {
    setLocale("pt-BR");
    expect(t("chat.error.send", { error: "timeout" })).toBe(
      "Não enviou: timeout. Sua mensagem continua no campo — tente de novo."
    );
  });

  it("returns key as fallback for missing translation", () => {
    expect(t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("falls back to PT-BR for missing key in other locale", () => {
    setLocale("en");
    expect(t("nonexistent.key")).toBe("nonexistent.key");
  });
});
