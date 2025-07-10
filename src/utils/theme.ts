type ThemeValue = "light" | "dark";
const THEME_KEY = "blog-theme";

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getLocalTheme() {
  return localStorage.getItem(THEME_KEY) as ThemeValue | null;
}

export const saveTheme = (theme: ThemeValue) => {
  if (typeof window === "undefined") {
    throw new Error("saveTheme can only be called in the browser");
  }
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
};

export const getTheme = (): ThemeValue => {
  if (typeof window === "undefined") {
    throw new Error("getTheme can only be called in the browser");
  }
  const localTheme = getLocalTheme();
  return localTheme || getSystemTheme();
};

export const toggleTheme = () => {
  const theme = getTheme();
  saveTheme(theme === "light" ? "dark" : "light");
};

export const watchSystemThemeChange = () => {
  if (typeof window === "undefined") {
    throw new Error("watchSystemThemeChange can only be called in the browser");
  }
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (getLocalTheme() === null) {
        saveTheme(e.matches ? "dark" : "light");
      }
    });
};
