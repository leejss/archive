type ThemeValue = "light" | "dark";
const THEME_KEY = "blog-theme";

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
  return getLocalTheme() || "dark";
};
