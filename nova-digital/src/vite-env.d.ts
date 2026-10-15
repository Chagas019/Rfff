/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de um JSON no formato NetworkDataset. Sem ela, o site usa os dados de demonstração. */
  readonly VITE_NETWORK_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
