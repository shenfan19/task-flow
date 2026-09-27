// Lets TypeScript (and the type-aware lint rules) see .vue single-file
// components as Vue components rather than as untyped modules.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
