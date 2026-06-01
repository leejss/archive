export interface Project {
  name: string;
  webUrl?: string;
  githubUrl?: string;
  summary: string;
}

export const projects: Project[] = [
  {
    name: "Repo Cleanser",
    webUrl: "https://repo-cleanser.vercel.app",
    // githubUrl: "",
    summary: "Cleans and optimizes your Github repositories with ease.",
  },
  {
    name: "Brainrack",
    webUrl: "https://brainrack.app",
    // githubUrl: "",
    summary: "Dump your ideas quickly and organize them later.",
  },
];
