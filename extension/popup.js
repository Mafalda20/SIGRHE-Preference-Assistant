const msg = document.getElementById("msg");

async function getActiveSupportedTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab?.url) {
    throw new Error("Não encontrei o separador ativo.");
  }

  const isHttp = tab.url.startsWith("http://") || tab.url.startsWith("https://");
  if (!isHttp) {
    throw new Error("Abre primeiro o site da candidatura num separador normal.");
  }

  return tab;
}

document.getElementById("btnOpen").addEventListener("click", async () => {
  msg.textContent = "";

  try {
    const tab = await getActiveSupportedTab();

    let mode = "INTERNO";

    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_CONTEXT" });

      if (!res?.ok) {
        throw new Error(res?.error || "Não consegui obter o contexto da página.");
      }

      if (res.mode) {
        mode = res.mode;
      }
    } catch (e) {
      throw new Error(
        "Não consegui comunicar com a página ativa. Faz refresh (F5) na página da candidatura e tenta outra vez."
      );
    }

    const url = chrome.runtime.getURL(`page.html?mode=${mode}`);
    await chrome.tabs.create({ url });

    msg.textContent = `Assistente aberto em modo ${mode}.`;
  } catch (e) {
    msg.textContent = e.message;
  }
});