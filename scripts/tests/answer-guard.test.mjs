import { readFileSync } from "node:fs";
// Extracts the answer guard helpers from the game extension and checks them against real bad/good model outputs.
import assert from "node:assert/strict";
const src = readFileSync(new URL("../../extensions/game/src/index.js", import.meta.url), "utf8");
const pick = (name) => {
  const start = src.indexOf(`function ${name}(`);
  let depth = 0, i = src.indexOf("{", start);
  for (; i < src.length; i++) { if (src[i] === "{") depth++; if (src[i] === "}" && --depth === 0) break; }
  return src.slice(start, i + 1);
};
const constBlock = (name) => { const s = src.indexOf(`const ${name} =`); return src.slice(s, src.indexOf(";\n", s) + 2); };
const code = [constBlock("ENGLISH_MARKERS"), pick("toCharacterLabel"), pick("logError"), pick("cleanCharacterAnswer"), pick("isUnusableAnswer"), pick("parseJsonObject"),
  "export { cleanCharacterAnswer, isUnusableAnswer, parseJsonObject };"].join("\n");
const mod = await import("data:text/javascript," + encodeURIComponent(code));
const burak = { name: "Burak", surname: "Sefer" };
assert.equal(mod.cleanCharacterAnswer('Burak Sefer: "**Ben** açtırmadım." ', burak), "Ben açtırmadım.");
assert.equal(mod.cleanCharacterAnswer("<think>plan</think>Yetkimle açıldı ama ben değilim.", burak), "Yetkimle açıldı ama ben değilim.");
assert.equal(mod.cleanCharacterAnswer("Bir. İki. Üç. Dört. Beş.", burak), "Bir. İki. Üç. Dört.");
assert.equal(mod.cleanCharacterAnswer("Sadece Türkçe konuşulur. Dispatch masasındaydım.", burak), "Dispatch masasındaydım.");
assert.equal(
  mod.cleanCharacterAnswer("Fiziksel arıza yoktu. Eğri düz. Fiziksel arıza yoktu.", burak),
  "Fiziksel arıza yoktu. Eğri düz."
);
const bad = [
  "Should we ask about the warehouse instead? What would you like to do?",
  "Sure! I can help you with the investigation. What do you want to ask?",
  "Bir yapay zeka olarak bu soruya cevap veremem.",
  "Vaka dosyamda o isim yok.",
  "",
];
const good = [
  "Kemal Bey diye birini tanımıyorum. O gece Ambar 17'deki alarmla uğraşıyordum.",
  "Yetkimle açıldı ama ben değilim. Başka birisi kartımı kullanmış olabilir.",
  "Dispatch notunu geç girdim, evet. Vardiya çok yoğundu.",
];
bad.forEach((t) => assert.equal(mod.isUnusableAnswer(t), true, `should reject: ${t}`));
good.forEach((t) => assert.equal(mod.isUnusableAnswer(t), false, `should accept: ${t}`));
assert.deepEqual(mod.parseJsonObject('```json\n{"isValid": true, "feedback": "Doğru."}\n```'), { isValid: true, feedback: "Doğru." });
console.log("answer guard tests passed");
