export interface FiremynaPkg {
  main?: string;
  engines?: {
    node?: string;
    npm?: string;
  };
  dependencies?: { [dependency: string]: string };
  devDependencies?: { [dependency: string]: string };
  scripts?: Record<string, string>;
}
