"use strict";

(() => {
  const STORAGE_KEY = "bento-board-calendar-icons";
  const ICONS = [
    { id: "birthday", label: "Birthday cake", symbol: "🎂" },
    { id: "gift", label: "Gift", symbol: "🎁" },
    { id: "alert", label: "Important", symbol: "❗" },
    { id: "sleep", label: "Sleep", symbol: "🛏️" },
    { id: "heart", label: "Special day", symbol: "❤️" },
    { id: "study", label: "Study", symbol: "📚" }
  ];
  const knownIcons = new Map(ICONS.map((icon) => [icon.id, icon]));
  let markersByDate = {};

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      markersByDate = Object.fromEntries(Object.entries(saved).map(([date, ids]) => [
        date,
        Array.isArray(ids) ? [...new Set(ids.filter((id) => knownIcons.has(id)))] : []
      ]));
    }
  } catch {
    markersByDate = {};
  }

  function iconsFor(date) {
    return (markersByDate[date] || []).map((id) => knownIcons.get(id)).filter(Boolean);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(markersByDate));
    } catch {
      return false;
    }
    return true;
  }

  function renderCell(button, date) {
    button.dataset.date = date;
    button.querySelector(".calendar-day-icon")?.remove();
    const icons = iconsFor(date);
    button.classList.toggle("has-icons", icons.length > 0);
    if (!button.dataset.baseLabel) button.dataset.baseLabel = button.getAttribute("aria-label");
    const baseLabel = button.dataset.baseLabel;
    if (!icons.length) {
      button.setAttribute("aria-label", baseLabel);
      return;
    }

    const marker = document.createElement("span");
    marker.className = "calendar-day-icon";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = icons.map((icon) => icon.symbol).join("");
    button.append(marker);

    button.setAttribute("aria-label", `${baseLabel}; ${icons.map((icon) => icon.label).join(", ")}`);
  }

  function renderPicker(date) {
    const agendaList = document.getElementById("calendar-agenda-list");
    const emptyMessage = document.getElementById("calendar-empty");
    if (!agendaList || !emptyMessage) return;

    let picker = document.getElementById("calendar-icon-picker");
    if (!picker) {
      picker = document.createElement("section");
      picker.id = "calendar-icon-picker";
      picker.className = "calendar-icon-picker";
      picker.setAttribute("aria-label", "Calendar day icons");
      emptyMessage.before(picker);
    }

    picker.replaceChildren();
    const heading = document.createElement("h4");
    heading.textContent = "Mark this day";
    picker.append(heading);

    const options = document.createElement("div");
    options.className = "calendar-icon-options";
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "Choose day markers");
    const activeIds = new Set(markersByDate[date] || []);

    for (const icon of ICONS) {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = "calendar-icon-choice";
      choice.textContent = icon.symbol;
      choice.title = `${activeIds.has(icon.id) ? "Remove" : "Add"} ${icon.label}`;
      choice.setAttribute("aria-label", `${activeIds.has(icon.id) ? "Remove" : "Add"} ${icon.label}`);
      choice.setAttribute("aria-pressed", String(activeIds.has(icon.id)));
      choice.addEventListener("click", () => {
        const nextIds = new Set(markersByDate[date] || []);
        if (nextIds.has(icon.id)) nextIds.delete(icon.id);
        else nextIds.add(icon.id);
        if (nextIds.size) markersByDate[date] = [...nextIds];
        else delete markersByDate[date];
        const saved = save();
        renderPicker(date);
        const dayButton = document.querySelector(`#calendar-grid .calendar-day[data-date="${date}"]`);
        if (dayButton) renderCell(dayButton, date);
        if (!saved) {
          const toast = document.getElementById("toast");
          if (toast) {
            toast.textContent = "Couldn't save calendar icons on this device.";
            toast.style.opacity = "1";
            setTimeout(() => { toast.style.opacity = "0"; }, 2300);
          }
        }
      });
      options.append(choice);
    }
    picker.append(options);

    const selected = iconsFor(date);
    if (selected.length) {
      const list = document.createElement("div");
      list.className = "calendar-icon-list";
      list.setAttribute("aria-label", "Markers on this day");
      for (const icon of selected) {
        const entry = document.createElement("span");
        entry.className = "calendar-icon-entry";
        entry.append(document.createTextNode(`${icon.symbol} ${icon.label}`));
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "calendar-icon-remove";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Remove ${icon.label}`);
        removeButton.addEventListener("click", () => {
          const nextIds = (markersByDate[date] || []).filter((id) => id !== icon.id);
          if (nextIds.length) markersByDate[date] = nextIds;
          else delete markersByDate[date];
          save();
          renderPicker(date);
          const dayButton = document.querySelector(`#calendar-grid .calendar-day[data-date="${date}"]`);
          if (dayButton) renderCell(dayButton, date);
        });
        entry.append(removeButton);
        list.append(entry);
      }
      picker.append(list);
    }
  }

  window.CalendarIcons = { renderCell, renderPicker };
})();
