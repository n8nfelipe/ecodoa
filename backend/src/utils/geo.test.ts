import assert from "node:assert/strict";
import test from "node:test";
import { buildWhatsAppUrl, haversineDistance } from "./geo";

test("haversineDistance retorna zero para o mesmo ponto", () => {
  assert.equal(haversineDistance(-23.5505, -46.6333, -23.5505, -46.6333), 0);
});

test("haversineDistance calcula uma distância conhecida", () => {
  const saoPaulo = [-23.5505, -46.6333] as const;
  const rioDeJaneiro = [-22.9068, -43.1729] as const;
  const distance = haversineDistance(...saoPaulo, ...rioDeJaneiro);

  assert.ok(distance > 350 && distance < 370);
});

test("buildWhatsAppUrl normaliza o telefone e codifica a mensagem", () => {
  const url = buildWhatsAppUrl("(61) 98311-4425", "Olá, tudo bem?");

  assert.equal(
    url,
    "https://wa.me/5561983114425?text=Ol%C3%A1%2C%20tudo%20bem%3F"
  );
});
