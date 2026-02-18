/* -------------------- MOBILE MENU -------------------- */
document.getElementById("mobileMenuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

/* -------------------- COLLAPSIBLE SIDEBAR (DESKTOP) -------------------- */
document.getElementById("collapseSidebarBtn").addEventListener("click", () => {
  document.body.classList.toggle("collapsed-sidebar");

  const icon = document.querySelector("#collapseSidebarBtn i");
  icon.dataset.feather = document.body.classList.contains("collapsed-sidebar")
    ? "chevron-right"
    : "chevron-left";

  feather.replace();
});

/* -------------------- DARK MODE -------------------- */
const themeBtn = document.getElementById("themeToggleBtn");

function applyTheme(mode) {
  document.body.dataset.theme = mode;
  localStorage.setItem("theme", mode);

  const icon = themeBtn.querySelector("i");
  icon.dataset.feather = mode === "dark" ? "sun" : "moon";
  feather.replace();
}

themeBtn.addEventListener("click", () => {
  const newMode = (document.body.dataset.theme === "dark") ? "light" : "dark";
  applyTheme(newMode);
});

// Initialize (load saved theme)
applyTheme(localStorage.getItem("theme") || "light");
