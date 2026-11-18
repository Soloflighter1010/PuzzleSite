"use strict";

const settings = window.puzzleSettings;
const form = document.querySelector("#commission-form");
const calculator = document.querySelector("#native-calculator");
const quantityInput = document.querySelector("#quantity");
const finishSelect = document.querySelector("#finish");
const decrement = document.querySelector("#decrement");
const increment = document.querySelector("#increment");
const output = document.querySelector("#total");
const breakdown = document.querySelector("#breakdown");
const copyStatus = document.querySelector("#copy-status");
const manualCopy = document.querySelector("#manual-copy");
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: settings.currency,
  minimumFractionDigits: 0,
});

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function addChoices(container, choices, { type, name }) {
  for (const [index, choice] of choices.entries()) {
    const label = createElement("label", type === "radio" ? "type-choice" : "addon-choice");
    const input = createElement("input");
    input.type = type;
    input.name = name;
    input.value = choice.id;
    input.checked = type === "radio" && index === 0;
    label.append(input);

    if (choice.icon) {
      const icon = createElement("span", "type-icon icon-" + choice.icon);
      icon.setAttribute("aria-hidden", "true");
      label.append(icon);
    }

    label.append(
      createElement("span", "choice-name", choice.name),
      createElement("span", "choice-price", (type === "checkbox" ? "+" : "") + money.format(choice.price)),
    );
    container.append(label);
  }
}

const types = createElement("div", "type-options");
addChoices(types, settings.commissions, { type: "radio", name: "commission" });
document.querySelector("#commission-types").append(types);

const addons = createElement("div", "addon-options");
addChoices(addons, settings.addons, { type: "checkbox", name: "addon" });
document.querySelector("#addons").append(addons);

for (const finish of settings.detailLevels) {
  const suffix = finish.price ? " (+" + money.format(finish.price) + " each)" : "";
  finishSelect.add(new Option(finish.name + suffix, finish.id));
}
quantityInput.max = settings.maxQuantity;

document.querySelector("#currency").textContent = settings.currency;
document.querySelector("#estimate-note").textContent = settings.sampleRates
  ? "Sample pricing · Final quote confirmed separately"
  : "Final quote confirmed separately";

function getEstimate() {
  const values = new FormData(form);
  const commission = settings.commissions.find((option) => option.id === values.get("commission"));
  const finish = settings.detailLevels.find((option) => option.id === values.get("finish"));
  const quantity = Math.max(1, Math.min(settings.maxQuantity, Math.trunc(quantityInput.valueAsNumber) || 1));
  const selectedAddons = settings.addons.filter((option) => values.getAll("addon").includes(option.id));

  const lines = [
    { label: commission.name + " × " + quantity, price: commission.price * quantity },
  ];
  if (finish.price) lines.push({ label: finish.name + " × " + quantity, price: finish.price * quantity });
  lines.push(...selectedAddons.map((addon) => ({ label: addon.name, price: addon.price })));

  return { quantity, lines, total: lines.reduce((sum, line) => sum + line.price, 0) };
}

function renderEstimate() {
  const { quantity, lines, total } = getEstimate();
  decrement.disabled = quantity <= 1;
  increment.disabled = quantity >= settings.maxQuantity;
  output.value = money.format(total);
  breakdown.replaceChildren(...lines.map((line) => {
    const row = createElement("div", "breakdown-row");
    row.append(createElement("dt", "", line.label), createElement("dd", "", money.format(line.price)));
    return row;
  }));
  copyStatus.textContent = "";
  manualCopy.hidden = true;
}

function changeQuantity(offset) {
  quantityInput.value = getEstimate().quantity + offset;
  renderEstimate();
}

decrement.addEventListener("click", () => changeQuantity(-1));
increment.addEventListener("click", () => changeQuantity(1));
form.addEventListener("input", renderEstimate);
quantityInput.addEventListener("change", () => {
  quantityInput.value = getEstimate().quantity;
  renderEstimate();
});
form.addEventListener("submit", (event) => event.preventDefault());

document.querySelector("#copy-estimate").addEventListener("click", async () => {
  const { lines, total } = getEstimate();
  const title = settings.sampleRates ? "Puzzle Studio — Sample commission estimate" : "Puzzle Studio — Commission estimate";
  const estimate = [
    title,
    ...lines.map((line) => line.label + " — " + money.format(line.price)),
    "Estimated total: " + money.format(total) + " " + settings.currency,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(estimate);
    copyStatus.textContent = "Estimate copied.";
  } catch {
    manualCopy.hidden = false;
    manualCopy.value = estimate;
    manualCopy.focus();
    manualCopy.select();
    copyStatus.textContent = "Select and copy the estimate below.";
  }
});

function getUrl(value, allowedProtocols) {
  try {
    const url = new URL(value);
    return allowedProtocols.includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

const embedUrl = getUrl(settings.calconic.embedUrl, ["https:"]);
const embedPath = /^\/api\/embed\/calculator\/([a-f0-9]+)\/?$/i;
const embedMatch = embedUrl?.pathname.match(embedPath);
if (embedUrl?.origin === "https://app.calconic.com" && embedMatch) {
  const iframe = createElement("iframe");
  iframe.title = "Calconic commission calculator";
  iframe.src = embedUrl.href;
  iframe.height = settings.calconic.height;
  iframe.loading = "lazy";
  iframe.sandbox.add(
    "allow-same-origin", "allow-scripts", "allow-forms", "allow-popups",
    "allow-popups-to-escape-sandbox", "allow-top-navigation-by-user-activation",
  );
  document.querySelector("#calconic-frame").append(iframe);
  document.querySelector("#calconic-direct").href = embedUrl.href;
  const localEstimate = document.querySelector("#local-estimate");
  if (settings.sampleRates) localEstimate.querySelector("summary").textContent = "Try the sample estimator";
  localEstimate.append(calculator);
  document.querySelector("#calconic").hidden = false;

  window.addEventListener("message", (event) => {
    if (event.origin !== embedUrl.origin || event.source !== iframe.contentWindow) return;
    const { action, payload } = event.data ?? {};
    if (action !== "CALCONIC_UPDATE_HEIGHT" || payload?.id !== embedMatch[1]) return;
    const height = Number(payload.height);
    if (Number.isFinite(height) && height > 0) iframe.height = Math.ceil(height);
  });
}

for (const [selector, value, protocols] of [
  ["[data-stream-link]", settings.streamUrl, ["https:"]],
  ["[data-contact-link]", settings.contactUrl, ["https:", "mailto:"]],
]) {
  const url = getUrl(value, protocols);
  if (url) {
    const link = document.querySelector(selector);
    link.href = url.href;
    link.hidden = false;
  }
}

renderEstimate();
calculator.hidden = false;
