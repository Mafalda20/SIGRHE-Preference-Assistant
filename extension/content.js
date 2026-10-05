function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

console.log("[AssistenteDocente] content ativo em:", location.href);

function detectModeFromPage() {
  // 1) Na página de demonstração, se existir seletor explícito, usar sempre esse
  const modeSelect = qs("#modeSelect");
  if (modeSelect && modeSelect.value) {
    return modeSelect.value === "EXTERNO" ? "EXTERNO" : "INTERNO";
  }

  // 2) Título principal visível
  const topTitle = qs(".topbar, .top");
  const titleText = (topTitle?.textContent || "").trim();

  if (titleText.includes("Concurso Externo")) return "EXTERNO";
  if (titleText.includes("Concurso Interno")) return "INTERNO";

  // 3) Campo informativo visível
  const allValues = qsa(".value").map(el => (el.textContent || "").trim());
  const joined = allValues.join(" | ");

  if (joined.includes("Concurso Externo")) return "EXTERNO";
  if (joined.includes("Concurso Interno")) return "INTERNO";

  // 4) Fallback final
  return "INTERNO";
}

async function ensureLoadModalOpen() {
  const overlay = qs("#overlayLoad");
  if (!overlay) {
    throw new Error("Não encontrei o modal de 'Carregar Novas Preferências'.");
  }

  if (overlay.style.display !== "flex") {
    const btnOpen = qs("#btnOpenLoad");
    if (!btnOpen) {
      throw new Error("Não encontrei o botão 'Carregar Novas Preferências'.");
    }

    btnOpen.click();
    await sleep(200);
  }
}

async function fillRows(selections) {
  await ensureLoadModalOpen();

  const prefItems = qsa("#prefList .prefItem");
  if (prefItems.length === 0) {
    throw new Error("Não encontrei as 20 linhas no modal.");
  }

  const mode = detectModeFromPage();

  for (let i = 0; i < selections.length; i++) {
    const it = selections[i];
    const row = prefItems[i];

    if (!row) {
      throw new Error(`Não encontrei a linha ${i + 1} no modal.`);
    }

    // Externo: Grupo de Recrutamento + Tipo + Código
    if (mode === "EXTERNO") {
      const selGr = qs("select.gr", row);
      if (!selGr) {
        throw new Error("Não encontrei o campo 'Grupo de Recrutamento' no modal externo.");
      }

      selGr.value = it.gr || "";
      selGr.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(20);
    }

    // Tipo
    const selTipo = qs("select.tipo", row);
    if (!selTipo) {
      throw new Error("Não encontrei o campo 'Tipo de preferência'.");
    }

    selTipo.value = it.tipoId || "";
    selTipo.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(20);

    // Código
    const inputCodigo = qs("input.codigo", row);
    if (!inputCodigo) {
      throw new Error("Não encontrei o campo 'Código'.");
    }

    inputCodigo.value = it.codigo || "";
    inputCodigo.dispatchEvent(new Event("input", { bubbles: true }));
    inputCodigo.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(40);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_CONTEXT") {
    try {
      sendResponse({
        ok: true,
        mode: detectModeFromPage()
      });
    } catch (e) {
      sendResponse({
        ok: false,
        error: e.message
      });
    }
    return true;
  }

  if (msg?.type === "FILL_PREFS") {
    (async () => {
      try {
        await fillRows(msg.payload || []);
        alert("Preferências preenchidas. Agora revê e clica manualmente em 'Carregar Novas Preferências'.");
      } catch (e) {
        console.error("[AssistenteDocente] erro ao preencher:", e);
        alert("Erro ao preencher: " + e.message);
      }
    })();
  }
});