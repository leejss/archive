export interface Project {
  name: string;
  url: string;
  summary: string;
}

export const projects: Project[] = [
  {
    name: "Chaek",
    url: "https://chaek.app/",
    summary: "AI Assistant for Book Generation.",
  },
  {
    name: "Repo Cleanser",
    url: "https://repo-cleanser.vercel.app",
    summary: "Cleans and optimizes your Github repositories with ease.",
  },
  {
    name: "Brainrack",
    url: "https://brainrack.app",
    summary: "Dump your ideas quickly and organize them later.",
  },
];
