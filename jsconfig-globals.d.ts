// Gradual-typing shims for the vanilla-JS app.
// The codebase assigns and reads many ad-hoc properties on `window`
// (AppAuth, AppDB, AppAnalytics, app_* helpers...). A permissive index
// signature lets `// @ts-check` files call through them without a full
// typing pass. Tighten incrementally as modules gain real types.
interface Window {
    [key: string]: any;
}
