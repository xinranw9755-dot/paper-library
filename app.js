const STORAGE_KEY = "paper-summary-library-v2";
const REMOTE_DATA_URL = "papers.json";

const statusLabels = {
  "to-read": "待读",
  reading: "在读",
  read: "已读",
  revisit: "待复盘"
};

const reportSections = [
  { key: "basicInfo", title: "1. 论文基本信息", group: "概览" },
  { key: "plainSummary", title: "2. 一句话总结", group: "概览" },
  { key: "background", title: "3. 研究背景", group: "背景" },
  { key: "question", title: "4. 核心问题", group: "背景" },
  { key: "framework", title: "5. 方法整体框架", group: "方法" },
  { key: "modules", title: "6. 关键模块逐个讲解", group: "方法" },
  { key: "concepts", title: "7. 重要概念解释", group: "方法" },
  { key: "experiments", title: "8. 实验部分解读", group: "结果" },
  { key: "innovations", title: "9. 论文创新点", group: "结果" },
  { key: "strengths", title: "10. 论文优点", group: "评价" },
  { key: "weaknesses", title: "11. 论文不足", group: "评价" },
  { key: "beginnerGuide", title: "12. 初学者最应该理解的内容", group: "学习" },
  { key: "finalSummary", title: "13. 最后总结", group: "学习" }
];

const starterPapers = [
  {
    id: "fang-2025-decoding-chinas-industrial-policies",
    title: "Decoding China's industrial policies",
    authors: "Fang et al.",
    year: "2025",
    venue: "Working paper",
    status: "reading",
    rating: "",
    categories: "产业政策, innovation",
    tags: "China, text analysis",
    fileName: "Fang et al. - 2025 - Decoding China's industrial policies.pdf",
    filePath: "Fang et al. - 2025 - Decoding China's industrial policies.pdf",
    link: "",
    basicInfo: "标题：Decoding China's industrial policies\n作者：Fang et al.\n年份：2025\n来源：Working paper",
    plainSummary: "这篇论文关注中国工业政策如何被识别、分类和理解。",
    background: "待补充。",
    question: "这篇论文主要解决中国工业政策如何度量和解码的问题。",
    framework: "待补充。",
    modules: "待补充。",
    concepts: "待补充。",
    experiments: "待补充。",
    innovations: "待补充。",
    strengths: "待补充。",
    weaknesses: "待补充。",
    beginnerGuide: "待补充。",
    finalSummary: "待补充。",
    data: "待补充。",
    method: "待补充。",
    limits: "待补充。",
    relevance: "可作为产业政策度量、政策文本识别或政策冲击构造的参考文献。",
    citation: "",
    notes: "这是根据当前文件夹中的 PDF 预置的示例条目，可直接编辑或删除。",
    updatedAt: "2026-06-23T00:00:00.000Z"
  }
];

let papers = [];
let selectedId = null;
let editingId = null;

const els = {
  paperList: document.querySelector("#paperList"),
  paperCount: document.querySelector("#paperCount"),
  categoryCount: document.querySelector("#categoryCount"),
  categoryCloud: document.querySelector("#categoryCloud"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  emptyState: document.querySelector("#emptyState"),
  detailView: document.querySelector("#detailView"),
  paperForm: document.querySelector("#paperForm"),
  formTitle: document.querySelector("#formTitle"),
  reportNav: document.querySelector("#reportNav"),
  reportSections: document.querySelector("#reportSections"),
  newPaperBtn: document.querySelector("#newPaperBtn"),
  folderInput: document.querySelector("#folderInput"),
  pdfInput: document.querySelector("#pdfInput"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  editBtn: document.querySelector("#editBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  cancelBtn: document.querySelector("#cancelBtn")
};

async function init() {
  const localPapers = loadLocalPapers();
  const remotePapers = await loadRemotePapers();
  papers = mergePapers(localPapers, remotePapers.length ? remotePapers : starterPapers);
  selectedId = papers[0]?.id ?? null;
  savePapers();
  render();
}

function loadLocalPapers() {
  const storedV2 = localStorage.getItem(STORAGE_KEY);
  const storedV1 = localStorage.getItem("paper-summary-library-v1");
  const stored = storedV2 || storedV1;
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(upgradePaper) : [];
  } catch {
    return [];
  }
}

async function loadRemotePapers() {
  try {
    const response = await fetch(`${REMOTE_DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return [];
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed.map(upgradePaper) : [];
  } catch {
    return [];
  }
}

function mergePapers(localItems, remoteItems) {
  const merged = new Map();
  [...remoteItems, ...localItems].forEach((paper) => {
    const item = upgradePaper(paper);
    const key = paperKey(item);
    const existing = merged.get(key);
    if (!existing || isNewer(item, existing)) merged.set(key, item);
  });
  return [...merged.values()].sort((a, b) => normalizeText(b.updatedAt).localeCompare(normalizeText(a.updatedAt)));
}

function paperKey(paper) {
  return normalizeText(paper.id || paper.filePath || paper.fileName || paper.title || crypto.randomUUID());
}

function isNewer(candidate, existing) {
  const candidateTime = Date.parse(candidate.updatedAt || "") || 0;
  const existingTime = Date.parse(existing.updatedAt || "") || 0;
  return candidateTime >= existingTime;
}

function upgradePaper(paper) {
  const upgraded = {
    id: paper.id || crypto.randomUUID(),
    title: paper.title || "",
    authors: paper.authors || "",
    year: paper.year || "",
    venue: paper.venue || "Working paper",
    status: paper.status || "to-read",
    rating: paper.rating || "",
    categories: paper.categories || paper.category || "",
    tags: paper.tags || "",
    fileName: paper.fileName || "",
    filePath: paper.filePath || paper.link || "",
    link: paper.link || "",
    data: paper.data || "",
    method: paper.method || "",
    limits: paper.limits || "",
    relevance: paper.relevance || "",
    citation: paper.citation || "",
    notes: paper.notes || "",
    updatedAt: paper.updatedAt || "2026-06-23T00:00:00.000Z"
  };

  reportSections.forEach(({ key }) => {
    upgraded[key] = paper[key] || "";
  });

  upgraded.plainSummary ||= paper.findings || "";
  upgraded.question ||= paper.question || "";
  upgraded.weaknesses ||= paper.limits || "";
  return upgraded;
}

function savePapers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase().trim();
}

function splitList(value) {
  return String(value ?? "")
    .split(/[,，;；/、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTags(paper) {
  return splitList(paper.tags);
}

function getCategories(paper) {
  return splitList(paper.categories);
}

function getVenue(paper) {
  return paper.venue?.trim() || "Working paper";
}

function categoryStats() {
  const counts = new Map();
  papers.forEach((paper) => {
    getCategories(paper).forEach((category) => {
      counts.set(category, (counts.get(category) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function filteredPapers() {
  const query = normalizeText(els.searchInput.value);
  const status = els.statusFilter.value;
  const category = els.categoryFilter.value;

  return papers.filter((paper) => {
    const matchesStatus = status === "all" || paper.status === status;
    const matchesCategory = category === "all" || getCategories(paper).includes(category);
    const haystack = normalizeText(Object.values(paper).join(" "));
    return matchesStatus && matchesCategory && (!query || haystack.includes(query));
  });
}

function renderCategoryFilter() {
  const selected = els.categoryFilter.value || "all";
  const stats = categoryStats();
  els.categoryFilter.innerHTML = '<option value="all">全部分类</option>';

  stats.forEach(([category, count]) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = `${category} (${count})`;
    els.categoryFilter.append(option);
  });

  els.categoryFilter.value = stats.some(([category]) => category === selected) ? selected : "all";
}

function renderCategoryCloud() {
  const stats = categoryStats();
  els.categoryCount.textContent = stats.length;
  els.categoryCloud.innerHTML = "";

  stats.slice(0, 8).forEach(([category, count]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-chip ${els.categoryFilter.value === category ? "active" : ""}`;
    button.innerHTML = `<span>${escapeHtml(category)}</span><strong>${count}</strong>`;
    button.addEventListener("click", () => {
      els.categoryFilter.value = els.categoryFilter.value === category ? "all" : category;
      render();
    });
    els.categoryCloud.append(button);
  });
}

function renderList() {
  renderCategoryFilter();
  renderCategoryCloud();

  const visible = filteredPapers();
  els.paperCount.textContent = papers.length;
  els.paperList.innerHTML = "";

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = "没有匹配的论文";
    els.paperList.append(empty);
    return;
  }

  visible.forEach((paper) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `paper-item ${paper.id === selectedId ? "active" : ""}`;
    item.innerHTML = `
      <strong>${escapeHtml(paper.title || "未命名论文")}</strong>
      <small>${escapeHtml([paper.authors, paper.year].filter(Boolean).join(" · ") || paper.fileName || "暂无作者年份")}</small>
      <small class="venue-line">${escapeHtml(getVenue(paper))}</small>
      <span class="status-pill ${paper.status}">${statusLabels[paper.status] ?? "未分类"}</span>
      <span class="mini-categories">${escapeHtml(getCategories(paper).slice(0, 3).join(" · ") || "未分类")}</span>
    `;
    item.addEventListener("click", () => {
      selectedId = paper.id;
      editingId = null;
      render();
    });
    els.paperList.append(item);
  });
}

function renderDetail() {
  const paper = papers.find((item) => item.id === selectedId);
  els.emptyState.classList.toggle("hidden", Boolean(paper) || editingId);
  els.detailView.classList.toggle("hidden", !paper || Boolean(editingId));
  els.paperForm.classList.toggle("hidden", !editingId);

  if (!paper || editingId) return;

  setText("#detailMeta", [getVenue(paper), paper.year, statusLabels[paper.status]].filter(Boolean).join(" · "));
  setText("#detailTitle", paper.title || "未命名论文");
  setText("#detailAuthors", paper.authors || "暂无作者");
  setText("#detailPlainSummary", paper.plainSummary || paper.findings);
  setText("#detailQuestion", paper.question);
  setText("#detailDataMethod", [paper.data, paper.method].filter(Boolean).join("\n\n"));
  renderPills("#detailCategories", getCategories(paper), "category-pill", "未分类");
  renderPills("#detailTags", getTags(paper), "tag", "");
  renderReport(paper);
}

function renderReport(paper) {
  const groups = [...new Set(reportSections.map((section) => section.group))];
  els.reportNav.innerHTML = "";
  els.reportSections.innerHTML = "";

  groups.forEach((group, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `report-nav-btn ${index === 0 ? "active" : ""}`;
    button.textContent = group;
    button.addEventListener("click", () => activateReportGroup(group));
    els.reportNav.append(button);
  });

  reportSections.forEach((section) => {
    const card = document.createElement("section");
    card.className = `report-card ${section.group === groups[0] ? "active" : ""}`;
    card.dataset.group = section.group;
    card.innerHTML = `
      <div class="report-card-head">
        <span>${escapeHtml(section.group)}</span>
        <h3>${escapeHtml(section.title)}</h3>
      </div>
      <div class="report-text">${formatReportText(paper[section.key])}</div>
    `;
    els.reportSections.append(card);
  });

  const metaCard = document.createElement("section");
  metaCard.className = "report-card active";
  metaCard.dataset.group = groups[0];
  metaCard.innerHTML = `
    <div class="report-card-head">
      <span>资料</span>
      <h3>文件、引用和笔记</h3>
    </div>
    <div class="meta-grid">
      <div><strong>引用信息</strong><p>${escapeHtml(paper.citation || "待补充")}</p></div>
      <div><strong>文件位置</strong><p>${escapeHtml([paper.filePath || paper.fileName, paper.link].filter(Boolean).join("\n") || "待补充")}</p></div>
      <div><strong>详细笔记</strong><p>${escapeHtml(paper.notes || "待补充")}</p></div>
    </div>
  `;
  els.reportSections.append(metaCard);
}

function activateReportGroup(group) {
  document.querySelectorAll(".report-nav-btn").forEach((button) => {
    button.classList.toggle("active", button.textContent === group);
  });
  document.querySelectorAll(".report-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.group === group);
  });
}

function formatReportText(value) {
  const text = String(value || "待补充").trim();
  const escaped = escapeHtml(text);
  return escaped
    .replace(/^#{1,3}\s*(.+)$/gm, "<h4>$1</h4>")
    .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function renderPills(selector, values, className, fallback) {
  const box = document.querySelector(selector);
  box.innerHTML = "";

  if (!values.length && fallback) {
    const pill = document.createElement("span");
    pill.className = className;
    pill.textContent = fallback;
    box.append(pill);
    return;
  }

  values.forEach((value) => {
    const pill = document.createElement("span");
    pill.className = className;
    pill.textContent = value;
    box.append(pill);
  });
}

function render() {
  renderList();
  renderDetail();
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value || "待补充";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleFromFileName(fileName) {
  return fileName.replace(/\.pdf$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

function createPaperFromFile(file) {
  const filePath = file.webkitRelativePath || file.name;
  return blankPaper({
    id: slugify(titleFromFileName(file.name) || file.name),
    title: titleFromFileName(file.name),
    year: inferYear(file.name),
    fileName: file.name,
    filePath,
    updatedAt: new Date().toISOString()
  });
}

function blankPaper(overrides = {}) {
  const paper = {
    id: crypto.randomUUID(),
    title: "",
    authors: "",
    year: "",
    venue: "Working paper",
    status: "to-read",
    rating: "",
    categories: "",
    tags: "",
    fileName: "",
    filePath: "",
    link: "",
    data: "",
    method: "",
    limits: "",
    relevance: "",
    citation: "",
    notes: "",
    updatedAt: new Date().toISOString(),
    ...overrides
  };
  reportSections.forEach(({ key }) => {
    paper[key] ||= "";
  });
  return paper;
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || crypto.randomUUID();
}

function inferYear(text) {
  const match = String(text).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function importPdfFiles(fileList) {
  const files = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith(".pdf"));
  if (!files.length) return;

  const known = new Set(
    papers.flatMap((paper) => [normalizeText(paper.fileName), normalizeText(paper.filePath)]).filter(Boolean)
  );
  const incoming = files
    .filter((file) => {
      const path = normalizeText(file.webkitRelativePath || file.name);
      return !known.has(normalizeText(file.name)) && !known.has(path);
    })
    .map(createPaperFromFile);

  if (!incoming.length) {
    alert("这些 PDF 已经在论文库里了。");
    return;
  }

  papers = [...incoming, ...papers];
  selectedId = incoming[0].id;
  editingId = null;
  savePapers();
  render();
  alert(`已新增 ${incoming.length} 篇待填写论文条目。`);
}

function startEdit(paper = null) {
  editingId = paper?.id ?? "new";
  els.formTitle.textContent = paper ? "编辑论文" : "新增论文";
  els.paperForm.reset();

  const values = paper ?? blankPaper();
  Array.from(els.paperForm.elements).forEach((field) => {
    if (!field.name) return;
    field.value = values[field.name] ?? "";
  });

  els.emptyState.classList.add("hidden");
  els.detailView.classList.add("hidden");
  els.paperForm.classList.remove("hidden");
}

function formToPaper(form) {
  const data = new FormData(form);
  const paper = {};
  for (const [key, value] of data.entries()) {
    paper[key] = String(value).trim();
  }
  paper.status ||= "to-read";
  paper.venue ||= "Working paper";
  paper.updatedAt = new Date().toISOString();
  return paper;
}

els.newPaperBtn.addEventListener("click", () => startEdit());
els.folderInput.addEventListener("change", (event) => {
  importPdfFiles(event.target.files);
  event.target.value = "";
});
els.pdfInput.addEventListener("change", (event) => {
  importPdfFiles(event.target.files);
  event.target.value = "";
});

els.editBtn.addEventListener("click", () => {
  const paper = papers.find((item) => item.id === selectedId);
  if (paper) startEdit(paper);
});

els.cancelBtn.addEventListener("click", () => {
  editingId = null;
  render();
});

els.deleteBtn.addEventListener("click", () => {
  const paper = papers.find((item) => item.id === selectedId);
  if (!paper) return;
  const confirmed = confirm(`确定删除《${paper.title || "未命名论文"}》吗？`);
  if (!confirmed) return;

  papers = papers.filter((item) => item.id !== selectedId);
  selectedId = papers[0]?.id ?? null;
  savePapers();
  render();
});

els.paperForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = formToPaper(els.paperForm);

  if (editingId === "new") {
    const paper = blankPaper({ id: slugify(payload.title || payload.fileName), ...payload });
    papers.unshift(paper);
    selectedId = paper.id;
  } else {
    papers = papers.map((paper) => (paper.id === editingId ? blankPaper({ ...paper, ...payload }) : paper));
    selectedId = editingId;
  }

  editingId = null;
  savePapers();
  render();
});

els.searchInput.addEventListener("input", renderList);
els.statusFilter.addEventListener("change", renderList);
els.categoryFilter.addEventListener("change", render);

els.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(papers, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `paper-library-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

els.importInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error("JSON must be an array");
    papers = mergePapers(papers, imported.map((paper) => upgradePaper({ id: paper.id || crypto.randomUUID(), ...paper })));
    selectedId = papers[0]?.id ?? null;
    savePapers();
    render();
  } catch {
    alert("导入失败：请选择由本网站导出的 JSON 文件。");
  } finally {
    event.target.value = "";
  }
});

init();
