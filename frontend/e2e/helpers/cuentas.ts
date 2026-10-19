export const API_URL = process.env.E2E_API_URL ?? "http://localhost:4100";

export const TESORERO = {
  dpi: "9990000000003",
  password: "AquaPayHist1!",
};

export const ADMIN = {
  dpi: "9990000000009",
  password: "AquaPayHist1!",
};

export function dpiUnico() {
  const cola = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10);
  return `888${cola.padStart(10, "0")}`;
}
