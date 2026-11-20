// Transcrição de voz NO PRÓPRIO APARELHO (Whisper rodando no navegador, sem servidor e sem chave).
// O áudio nunca sai do aparelho: daqui só sai o pedido do modelo (baixado uma vez da Hugging Face
// e guardado no navegador). Regra de fidelidade: o texto é exatamente o que o modelo ouviu;
// nada é corrigido, resumido ou "limpo".
//
// Mensagens: { id, audio: Float32Array (16 kHz, mono), modelo }
// Respostas: { id, tipo: "progresso", arquivo, carregado, total } | { id, tipo: "ouvindo" }
//          | { id, tipo: "pronto", texto, trechos, modelo, dispositivo } | { id, tipo: "erro", mensagem }

const BIBLIOTECA = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";

let biblioteca = null;
let carregado = null; // { modelo, promessa }

async function obterBiblioteca() {
  if (!biblioteca) {
    biblioteca = import(BIBLIOTECA).then((m) => {
      m.env.allowLocalModels = false;
      m.env.useBrowserCache = true;
      if (m.env.backends && m.env.backends.onnx && m.env.backends.onnx.wasm) {
        m.env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
      }
      return m;
    });
    biblioteca.catch(() => {
      biblioteca = null;
    });
  }
  return biblioteca;
}

async function temWebGPU() {
  try {
    if (!("gpu" in navigator) || !navigator.gpu) return false;
    return Boolean(await navigator.gpu.requestAdapter());
  } catch {
    return false;
  }
}

function obterTranscritor(modelo, avisar) {
  if (carregado && carregado.modelo === modelo) return carregado.promessa;
  const progresso = (p) => {
    if (p && p.status === "progress") avisar({ tipo: "progresso", arquivo: p.file, carregado: p.loaded || 0, total: p.total || 0 });
  };
  const tentar = async (dispositivo) => {
    const { pipeline } = await obterBiblioteca();
    const asr = await pipeline("automatic-speech-recognition", modelo, {
      device: dispositivo,
      dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
      progress_callback: progresso,
    });
    return { asr, dispositivo };
  };
  const promessa = (async () => ((await temWebGPU()) ? tentar("webgpu").catch(() => tentar("wasm")) : tentar("wasm")))();
  carregado = { modelo, promessa };
  promessa.catch(() => {
    carregado = null;
  });
  return promessa;
}

self.onmessage = async (evento) => {
  const dados = evento.data || {};
  const id = dados.id;
  const avisar = (m) => self.postMessage({ id, ...m });
  try {
    if (!(dados.audio instanceof Float32Array)) throw new Error("áudio inválido");
    const { asr, dispositivo } = await obterTranscritor(dados.modelo, avisar);
    avisar({ tipo: "ouvindo" });
    const r = await asr(dados.audio, {
      language: "portuguese",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });
    const trechos = Array.isArray(r.chunks)
      ? r.chunks.map((c) => ({ texto: c.text, inicio: c.timestamp ? c.timestamp[0] : null, fim: c.timestamp ? c.timestamp[1] : null }))
      : [];
    avisar({ tipo: "pronto", texto: typeof r.text === "string" ? r.text : "", trechos, modelo: dados.modelo, dispositivo });
  } catch (e) {
    avisar({ tipo: "erro", mensagem: e && e.message ? e.message : String(e) });
  }
};

self.postMessage({ tipo: "pronto_para_ouvir" });
