/* Pesos da Lia ajustados pelos treinos locais (ferramentas/treinar-busca.js e treinar-chat.js).
   Não edite à mão: rode os treinos de novo. */
var LIA_PESOS = {
 "busca": {
  "titulo": 3,
  "exato": 1.2,
  "frase": 0.4,
  "autor": 2.4,
  "chave": 2.6,
  "genero": 1.1,
  "pop": 0.45,
  "idioma": 0.6,
  "pt": 0.25,
  "livre": 0.35,
  "falta": 1.4,
  "curto": 1.2,
  "cobreT": 0.35,
  "minimo": 1.2,
  "melhor": 3.2
 },
 "notas": {
  "busca": {
   "data": "2026-11-08",
   "treino": 100,
   "validacao": 100,
   "cego": 100,
   "buscas": 235
  },
  "chat": {
   "data": "2026-11-08",
   "treino": 100,
   "validacao": 98.6,
   "cego": 100,
   "frases": 261
  }
 },
 "chat": {
  "kbMin": 2.4,
  "kbForte": 4.2,
  "frase": 3,
  "fraseTam": 0.4,
  "parcial": 1.2,
  "kbVsLivro": 1.2,
  "livroMin": 3.2
 }
};
