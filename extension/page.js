const TIPOS = [
  { id: "QZP_PROV_QZP", label: "Quadro Zona Pedagógica para provimento QZP" },
  { id: "QZP_PROV_AE", label: "Quadro Zona Pedagógica para provimento AE/ENA" },
  { id: "CONCELHO", label: "Concelho" },
  { id: "AE", label: "Agrupamento de Escolas ou Escola não agrupada" }
];

const GRUPOS = [
  { id: "100", label: "100 - Educação Pré-Escolar" },
  { id: "110", label: "110 - 1.º Ciclo do ensino Básico" },
  { id: "120", label: "120 - Inglês" },
  { id: "200", label: "200 - Português e Estudos Sociais/História" },
  { id: "210", label: "210 - Português e Francês" },
  { id: "220", label: "220 - Português e Inglês" },
  { id: "230", label: "230 - Matemática e Ciências da Natureza" },
  { id: "240", label: "240 - Educação Visual e Tecnológica" },
  { id: "250", label: "250 - Educação Musical" },
  { id: "260", label: "260 - Educação Física" },
  { id: "290", label: "290 - Educação Moral e Religiosa" },
  { id: "300", label: "300 - Português" },
  { id: "310", label: "310 - Latim e Grego" },
  { id: "320", label: "320 - Francês" },
  { id: "330", label: "330 - Inglês" },
  { id: "340", label: "340 - Alemão" },
  { id: "350", label: "350 - Espanhol" },
  { id: "360", label: "360 - Língua Gestual Portuguesa" },
  { id: "400", label: "400 - História" },
  { id: "410", label: "410 - Filosofia" },
  { id: "420", label: "420 - Geografia" },
  { id: "430", label: "430 - Economia e Contabilidade" },
  { id: "500", label: "500 - Matemática" },
  { id: "510", label: "510 - Física e Química" },
  { id: "520", label: "520 - Biologia e Geologia" },
  { id: "530", label: "530 - Educação Tecnológica" },
  { id: "540", label: "540 - Eletrotecnia" },
  { id: "550", label: "550 - Informática" },
  { id: "600", label: "600 - Artes Visuais" },
  { id: "610", label: "610 - Música" },
  { id: "620", label: "620 - Educação Física" },
  { id: "910", label: "910 - Educação Especial 1" },
  { id: "920", label: "920 - Educação Especial 2" },
  { id: "930", label: "930 - Educação Especial 3" }
];

let copiedRowData = null;

const MODE = new URLSearchParams(window.location.search).get("mode") || "INTERNO";

let catalog = [];
let qzpGrupos = [];

let concelhos = [];
let concelhoCodigoByName = new Map();
let escolasByConcelho = new Map();

function normalizeText(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createSearchableDropdown(options, placeholder, onSelect = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "searchDropdown";

  const trigger = document.createElement("div");
  trigger.className = "searchDropdownTrigger";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.className = "searchDropdownInput";

  const arrow = document.createElement("span");
  arrow.className = "searchDropdownArrow";
  arrow.textContent = "▾";

  trigger.appendChild(input);
  trigger.appendChild(arrow);

  const menu = document.createElement("div");
  menu.className = "searchDropdownMenu";

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  let currentOptions = [...options];
  let selectedValue = "";
  let selectedLabel = "";
  let isOpen = false;

  function rankOptions(filterText) {
    const f = normalizeText(filterText);

    if (!f) return [...currentOptions];

    const startsWith = [];
    const includes = [];
    const others = [];

    for (const o of currentOptions) {
      const labelNorm = normalizeText(o.label);

      if (labelNorm.startsWith(f)) startsWith.push(o);
      else if (labelNorm.includes(f)) includes.push(o);
      else others.push(o);
    }

    return [...startsWith, ...includes, ...others];
  }

  function renderMenu() {
    const ranked = rankOptions(input.value);
    menu.innerHTML = "";

    if (ranked.length === 0) {
      const empty = document.createElement("div");
      empty.className = "searchDropdownEmpty";
      empty.textContent = "Sem resultados";
      menu.appendChild(empty);
      return;
    }

    ranked.slice(0, 100).forEach(o => {
      const item = document.createElement("div");
      item.className = "searchDropdownItem";
      item.textContent = o.label;

      if (o.value === selectedValue) {
        item.classList.add("selected");
      }

      item.addEventListener("click", () => {
        selectedValue = o.value;
        selectedLabel = o.label;
        input.value = o.label;
        closeMenu();

        if (typeof onSelect === "function") {
          onSelect(o);
        }
      });

      menu.appendChild(item);
    });
  }

  function openMenu() {
    isOpen = true;
    wrapper.classList.add("open");
    renderMenu();
  }

  function closeMenu() {
    isOpen = false;
    wrapper.classList.remove("open");
    menu.innerHTML = "";
  }

  function toggleMenu() {
    if (isOpen) closeMenu();
    else openMenu();
  }

  trigger.addEventListener("click", () => {
    input.focus();
    openMenu();
  });

  input.addEventListener("focus", () => {
    openMenu();
  });

  input.addEventListener("input", () => {
    selectedValue = "";
    selectedLabel = "";
    openMenu();
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      closeMenu();
    }
  });

  return {
    element: wrapper,
    input,

    getValue: () => selectedValue,
    getLabel: () => selectedLabel,

    setOptions: (newOptions) => {
      currentOptions = [...newOptions];
      selectedValue = "";
      selectedLabel = "";
      input.value = "";
      if (isOpen) renderMenu();
    },

    setValue: (value, label = "") => {
      selectedValue = value || "";

      if (label) {
        selectedLabel = label;
        input.value = label;
        return;
      }

      const found = currentOptions.find(o => o.value === value);
      if (found) {
        selectedLabel = found.label;
        input.value = found.label;
      } else {
        selectedLabel = "";
        input.value = "";
      }
    },

    clear: () => {
      selectedValue = "";
      selectedLabel = "";
      input.value = "";
      if (isOpen) renderMenu();
    },

    disable: () => {
      input.disabled = true;
      closeMenu();
    },

    enable: () => {
      input.disabled = false;
    }
  };
}

const elList = document.getElementById("list");
const elMsg = document.getElementById("msg");

const elTop = document.querySelector(".top");

if (elTop) {
  elTop.textContent =
    MODE === "EXTERNO"
      ? "Assistente de Preferências - Concurso Externo (20 de cada vez)"
      : "Assistente de Preferências - Concurso Interno (20 de cada vez)";
}

function setMsg(text, type) {
  elMsg.textContent = text;
  elMsg.className = "msg " + (type || "");
}

async function loadJson(path) {
  const url = chrome.runtime.getURL(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não consegui ler ${path}`);
  return res.json();
}

async function loadData() {
  const [catRaw, gruposRaw] = await Promise.all([
    loadJson("data/catalogo.json"),
    loadJson("data/qzp-grupos.json")
  ]);

  // qzp-grupos.json: aceita { grupos: [...] } ou array direto
  const gruposArray = Array.isArray(gruposRaw)
    ? gruposRaw
    : Array.isArray(gruposRaw?.grupos)
      ? gruposRaw.grupos
      : [];

  if (!gruposArray.length) {
    throw new Error("qzp-grupos.json tem formato inválido.");
  }

  qzpGrupos = gruposArray.map(g => ({
    qzp: String(g.qzp).padStart(2, "0"),
    label: String(g.label || `QZP ${String(g.qzp).padStart(2, "0")}`),
    concelhos: Array.isArray(g.concelhos) ? g.concelhos.map(String) : []
  }));

  concelhoCodigoByName = new Map();
  escolasByConcelho = new Map();
  concelhos = [];

  // FORMATO A: objeto com concelhos + escolasByConcelho
  if (catRaw && Array.isArray(catRaw.concelhos) && typeof catRaw.escolasByConcelho === "object") {
    catalog = catRaw;

    concelhos = [...catRaw.concelhos].sort((a, b) => a.localeCompare(b, "pt"));

    for (const concelhoLabel of concelhos) {
      const match = concelhoLabel.match(/\((\d{4})\)$/);
      const concCodigo = match ? match[1] : "";
      concelhoCodigoByName.set(concelhoLabel, concCodigo);

      const escolas = Array.isArray(catRaw.escolasByConcelho[concelhoLabel])
        ? catRaw.escolasByConcelho[concelhoLabel]
        : [];

      escolasByConcelho.set(
        concelhoLabel,
        escolas.map(e => ({
          codigoAE: String(e.codigoAE || "").trim(),
          nomeAE: String(e.nomeAE || "").trim(),
          qzp: String(e.qzp || "").padStart(2, "0")
        }))
      );
    }
  }

  // FORMATO B: array simples de registos
  else if (Array.isArray(catRaw)) {
    catalog = catRaw;

    const concs = new Set();

    for (const it of catRaw) {
      const nome = String(it.concelho || "").trim();
      const codigo = String(it.concelhoCodigo || "").trim();
      const concelhoLabel = nome && codigo ? `${nome} (${codigo})` : nome;

      if (!concelhoLabel) continue;

      concs.add(concelhoLabel);
      concelhoCodigoByName.set(concelhoLabel, codigo);

      if (!escolasByConcelho.has(concelhoLabel)) {
        escolasByConcelho.set(concelhoLabel, []);
      }

      escolasByConcelho.get(concelhoLabel).push({
        codigoAE: String(it.codigoAE || "").trim(),
        nomeAE: String(it.nomeAE || "").trim(),
        qzp: String(it.qzp || it.novoQzp || "").padStart(2, "0")
      });
    }

    concelhos = Array.from(concs).sort((a, b) => a.localeCompare(b, "pt"));
  }

  else {
    throw new Error("catalogo.json tem formato inválido.");
  }

  for (const [c, arr] of escolasByConcelho.entries()) {
    arr.sort((a, b) => a.nomeAE.localeCompare(b.nomeAE, "pt"));
  }

  renderRows();
}

function makeSelect(options, placeholder) {
  const sel = document.createElement("select");
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  sel.appendChild(opt0);

  for (const o of options) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  }
  return sel;
}

function createRow(index) {
  const div = document.createElement("div");
  div.className = "item";
  div.dataset.index = String(index);

  const title = document.createElement("div");
  title.className = "title titleRow";

  const titleText = document.createElement("span");
  titleText.textContent = `Preferência ${String.fromCharCode(65 + (index % 26))} (Linha ${index + 1})`;

  const actions = document.createElement("div");
  actions.className = "rowActions";

  title.appendChild(titleText);
  title.appendChild(actions);

  function makeBtn(label) {
    const b = document.createElement("button");
    b.className = "rowBtn";
    b.textContent = label;
    return b;
  }

  const btnUp = makeBtn("↑");
  const btnDown = makeBtn("↓");
  const btnClear = makeBtn("Limpar");

  actions.appendChild(btnUp);
  actions.appendChild(btnDown);
  actions.appendChild(btnClear);

  let btnCopy = null;
  let btnPaste = null;

  if (MODE === "EXTERNO") {
    btnCopy = makeBtn("Copiar");
    btnPaste = makeBtn("Colar");

    actions.prepend(btnPaste);
    actions.prepend(btnCopy);
  }

  function getRowState() {
    const optBox = div.querySelector(".optBox");
    const tipoId = tipoSel.value || "";

    const state = {
      gr: MODE === "EXTERNO" ? (div.querySelector("select.gr")?.value || "") : "",
      tipoId,
      qzpValue: "",
      qzpLabel: "",
      concelhoValue: "",
      concelhoLabel: "",
      schoolValue: "",
      schoolLabel: ""
    };

    if (tipoId === "QZP_PROV_QZP") {
      state.qzpValue = optBox._controls?.qzpControl?.getValue() || "";
      state.qzpLabel = optBox._controls?.qzpControl?.getLabel() || "";
    }

    if (tipoId === "CONCELHO") {
      state.concelhoValue = optBox._controls?.concelhoControl?.getValue() || "";
      state.concelhoLabel = optBox._controls?.concelhoControl?.getLabel() || "";
    }

    if (tipoId === "QZP_PROV_AE" || tipoId === "AE") {
      state.concelhoValue = optBox._controls?.concelhoControl?.getValue() || "";
      state.concelhoLabel = optBox._controls?.concelhoControl?.getLabel() || "";
      state.schoolValue = optBox._controls?.schoolControl?.getValue() || "";
      state.schoolLabel = optBox._controls?.schoolControl?.getLabel() || "";
    }

    return state;
  }

  function applyRowState(state) {
    if (!state) return;

    // Grupo de recrutamento
    if (MODE === "EXTERNO") {
      const grSel = div.querySelector("select.gr");
      if (grSel) {
        grSel.value = state.gr || "";
        grSel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Tipo
    tipoSel.value = state.tipoId || "";
    tipoSel.dispatchEvent(new Event("change", { bubbles: true }));

    // Esperar o render dos controlos dinâmicos
    setTimeout(() => {
      const optBox = div.querySelector(".optBox");

      if (!state.tipoId) return;

      if (state.tipoId === "QZP_PROV_QZP") {
        optBox._controls?.qzpControl?.setValue(state.qzpValue, state.qzpLabel);
        return;
      }

      if (state.tipoId === "CONCELHO") {
        optBox._controls?.concelhoControl?.setValue(state.concelhoValue, state.concelhoLabel);
        return;
      }

      if (state.tipoId === "QZP_PROV_AE" || state.tipoId === "AE") {
        // 1) repor concelho
        optBox._controls?.concelhoControl?.setValue(state.concelhoValue, state.concelhoLabel);

        // 2) reconstruir escolas do concelho
        const escolas = (escolasByConcelho.get(state.concelhoValue) || [])
          .filter(e => /^\d{6}$/.test(e.codigoAE))
          .map(e => ({
            value: e.codigoAE,
            label: `${e.nomeAE} (${e.codigoAE})`
          }));

        optBox._controls?.schoolControl?.setOptions(escolas);
        optBox._controls?.schoolControl?.enable();

        // 3) repor escola
        optBox._controls?.schoolControl?.setValue(state.schoolValue, state.schoolLabel);
      }
    }, 120);
  }

  //Subir linha
  btnUp.onclick = () => {
    const prev = div.previousElementSibling;
    if (!prev) return;

    const stateA = getRowState();
    const stateB = prev._getRowState();

    applyRowState(stateB);
    prev._applyRowState(stateA);

    setMsg(`Linha ${index + 1} trocada com a linha acima.`, "ok");
  };

  //Descer linha
  btnDown.onclick = () => {
    const next = div.nextElementSibling;
    if (!next) return;

    const stateA = getRowState();
    const stateB = next._getRowState();

    applyRowState(stateB);
    next._applyRowState(stateA);

    setMsg(`Linha ${index + 1} trocada com a linha abaixo.`, "ok");
  };

  //Limpar linha
  btnClear.onclick = () => {
    applyRowState({
      gr: "",
      tipoId: "",
      qzpValue: "",
      qzpLabel: "",
      concelhoValue: "",
      concelhoLabel: "",
      schoolValue: "",
      schoolLabel: ""
    });

    setMsg(`Linha ${index + 1} limpa.`, "ok");
  };

  // Copiar linha
  if (btnCopy) {
    btnCopy.onclick = () => {
      copiedRowData = getRowState();

      btnCopy.classList.add("rowBtnSuccess");
      const oldText = btnCopy.textContent;
      btnCopy.textContent = "Copiada";

      setMsg(`Linha ${index + 1} copiada.`, "ok");

      setTimeout(() => {
        btnCopy.classList.remove("rowBtnSuccess");
        btnCopy.textContent = oldText;
      }, 900);
    };
  }

  // Colar linha
  if (btnPaste) {
    btnPaste.onclick = () => {
      if (!copiedRowData) {
        setMsg("Ainda não copiaste nenhuma linha.", "err");
        return;
      }

      applyRowState(copiedRowData);

      btnPaste.classList.add("rowBtnSuccess");
      const oldText = btnPaste.textContent;
      btnPaste.textContent = "Colada";

      setMsg(`Linha colada na posição ${index + 1}.`, "ok");

      setTimeout(() => {
        btnPaste.classList.remove("rowBtnSuccess");
        btnPaste.textContent = oldText;
      }, 900);
    };
  }

  const grid = document.createElement("div");
  grid.className = "grid";

  // Grupo de recrutamento (só no externo)
  if (MODE === "EXTERNO") {
    const grWrap = document.createElement("div");
    const grLabel = document.createElement("label");
    grLabel.textContent = "Grupo de recrutamento";

    const grSel = makeSelect(
      GRUPOS.map(g => ({ value: g.id, label: g.label })),
      "Escolher grupo..."
    );
    grSel.className = "gr";

    const grSelectWrap = document.createElement("div");
    grSelectWrap.className = "selectWrap";
    grSelectWrap.appendChild(grSel);

    grWrap.appendChild(grLabel);
    grWrap.appendChild(grSelectWrap);
    grid.appendChild(grWrap);
  }

  // Tipo
  const tipoWrap = document.createElement("div");
  const tipoLabel = document.createElement("label");
  tipoLabel.textContent = "Tipo de preferência";

  const tipoSel = makeSelect(
    TIPOS.map(t => ({ value: t.id, label: t.label })),
    "Escolher tipo..."
  );
  tipoSel.className = "tipo";

  const tipoSelectWrap = document.createElement("div");
  tipoSelectWrap.className = "selectWrap";
  tipoSelectWrap.appendChild(tipoSel);

  tipoWrap.appendChild(tipoLabel);
  tipoWrap.appendChild(tipoSelectWrap);

  // Opções dinâmicas
  const optWrap = document.createElement("div");
  const optLabel = document.createElement("label");
  optLabel.textContent = "Opção (substitui o código)";

  const optBox = document.createElement("div");
  optBox.className = "optBox";

  optWrap.appendChild(optLabel);
  optWrap.appendChild(optBox);

  grid.appendChild(tipoWrap);
  grid.appendChild(optWrap);

  div.appendChild(title);
  div.appendChild(grid);

  tipoSel.addEventListener("change", () => {
    renderOptionsForType(optBox, tipoSel.value);
  });

  div._getRowState = getRowState;
  div._applyRowState = applyRowState;

  return div;
}

function renderOptionsForType(optBox, tipoId) {
  optBox.innerHTML = "";
  optBox._controls = {};

  if (!tipoId) return;

  // QZP
  if (tipoId === "QZP_PROV_QZP") {
    const qzpControl = createSearchableDropdown(
      qzpGrupos.map(g => ({
        value: g.qzp,
        label: g.label
      })),
      "Pesquisar QZP..."
    );

    optBox._controls.qzpControl = qzpControl;
    optBox.appendChild(qzpControl.element);
    return;
  }

  // Concelho
  if (tipoId === "CONCELHO") {
    const concelhoControl = createSearchableDropdown(
      concelhos.map(c => ({
        value: concelhoCodigoByName.get(c),
        label: c
      })),
      "Pesquisar concelho..."
    );

    optBox._controls.concelhoControl = concelhoControl;
    optBox.appendChild(concelhoControl.element);
    return;
  }

  // QZP_PROV_AE e AE -> concelho + agrupamento
  if (tipoId === "QZP_PROV_AE" || tipoId === "AE") {

    const concelhoLabel = document.createElement("label");
    concelhoLabel.textContent = "Concelho";
    concelhoLabel.style.fontSize = "12px";
    concelhoLabel.style.margin = "0 0 4px 0";
    concelhoLabel.style.display = "block";

    const schoolLabel = document.createElement("label");
    schoolLabel.textContent = "Agrupamento / Escola";
    schoolLabel.style.fontSize = "12px";
    schoolLabel.style.margin = "10px 0 4px 0";
    schoolLabel.style.display = "block";

    const schoolControl = createSearchableDropdown(
      [],
      "Pesquisar agrupamento/escola..."
    );

    schoolControl.disable();

    function refreshSchools(concelhoNome) {

      if (!concelhoNome) {
        schoolControl.clear();
        schoolControl.setOptions([]);
        schoolControl.disable();
        return;
      }

      const escolas = (escolasByConcelho.get(concelhoNome) || [])
        .filter(e => /^\d{6}$/.test(e.codigoAE))
        .map(e => ({
          value: e.codigoAE,
          label: `${e.nomeAE} (${e.codigoAE})`
        }));

      schoolControl.setOptions(escolas);
      schoolControl.enable();
    }

    const concelhoControl = createSearchableDropdown(
      concelhos.map(c => ({
        value: c,
        label: c
      })),
      "Pesquisar concelho...",
      (opt) => {
        refreshSchools(opt.value);
      }
    );

    optBox._controls.concelhoControl = concelhoControl;
    optBox._controls.schoolControl = schoolControl;

    optBox.appendChild(concelhoLabel);
    optBox.appendChild(concelhoControl.element);
    optBox.appendChild(schoolLabel);
    optBox.appendChild(schoolControl.element);

    return;
  }
}

function renderRows() {
  elList.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    elList.appendChild(createRow(i));
  }
}

function collectSelections() {
  const rows = Array.from(document.querySelectorAll(".item"));
  const result = [];

  for (const row of rows) {
    const tipoId = row.querySelector("select.tipo")?.value || "";
    const optBox = row.querySelector(".optBox");

    if (!tipoId) continue;

    const gr = MODE === "EXTERNO" ? (row.querySelector("select.gr")?.value || "") : "";

    let codigo = "";

    if (tipoId === "QZP_PROV_QZP") {
      codigo = optBox._controls?.qzpControl?.getValue() || "";
      if (!codigo) throw new Error("Falta escolher o grupo QZP numa linha.");
    }

    else if (tipoId === "CONCELHO") {
      codigo = optBox._controls?.concelhoControl?.getValue() || "";
      if (!codigo) throw new Error("Falta escolher concelho numa linha.");
    }

    else if (tipoId === "QZP_PROV_AE" || tipoId === "AE") {
      const concelhoNome = optBox._controls?.concelhoControl?.getValue() || "";
      const escolaCode = optBox._controls?.schoolControl?.getValue() || "";

      if (!concelhoNome) throw new Error("Falta escolher concelho numa linha.");
      if (!escolaCode) throw new Error("Falta escolher agrupamento/escola numa linha.");

      codigo = escolaCode;
    }

    else {
      throw new Error("Tipo não suportado: " + tipoId);
    }

    if (MODE === "EXTERNO") {
      if (!gr) throw new Error("Falta escolher o grupo de recrutamento numa linha.");
      result.push({ gr, tipoId, codigo });
    } else {
      result.push({ tipoId, codigo });
    }
  }

  return result;
}

async function fillInLocalhostTab() {
  const selections = collectSelections();

  // procurar separadores da demo (localhost ou 127.0.0.1) em qualquer porta
  const tabsLocalhost = await chrome.tabs.query({ url: "http://localhost:*/*" });
  const tabs127 = await chrome.tabs.query({ url: "http://127.0.0.1:*/*" });
  const tabs = [...tabsLocalhost, ...tabs127];

  if (tabs.length === 0) {
    throw new Error("Não encontrei a página de demonstração aberta em localhost. Inicia o servidor demo primeiro.");
  }

  // Preferir um tab que esteja na mesma janela e que esteja visível por último
  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true });
  const candidate = currentWindowTabs.find(t =>
    t.url && (t.url.startsWith("http://localhost:") || t.url.startsWith("http://127.0.0.1:"))
  );

  const target = candidate || tabs[0];

  try {
    await chrome.tabs.sendMessage(target.id, {
      type: "FILL_PREFS",
      payload: selections
    });
  } catch (e) {
    throw new Error("Não consegui comunicar com a página de demonstração. Faz refresh (F5) no localhost e tenta outra vez.");
  }

  setMsg(`Enviei ${selections.length} preferências para preencher na página de demonstração.`, "ok");
}

document.getElementById("btnFill").addEventListener("click", async () => {
  try {
    await fillInLocalhostTab();
  } catch (e) {
    setMsg(e.message, "err");
  }
});

// iniciar
renderRows();
(async () => {
  try {
    await loadData();
    setMsg("", "");
  } catch (e) {
    setMsg("Erro interno (catálogo): " + e.message, "err");
  }
})();