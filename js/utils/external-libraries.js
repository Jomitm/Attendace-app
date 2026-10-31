const LIBRARY_URLS = {
    chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
};

const libraryPromises = new Map();

function loadGlobalLibrary(key, globalName) {
    if (typeof window === 'undefined') return Promise.reject(new Error(`${globalName} is only available in a browser.`));
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (libraryPromises.has(key)) return libraryPromises.get(key);

    const promise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-app-library="${key}"]`);
        const script = existing || document.createElement('script');
        let settled = false;
        const finish = (error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            script.removeEventListener('load', onLoad);
            script.removeEventListener('error', onError);
            if (error) {
                script.remove();
                libraryPromises.delete(key);
                reject(error);
            } else if (window[globalName]) {
                resolve(window[globalName]);
            } else {
                libraryPromises.delete(key);
                reject(new Error(`${globalName} loaded without exposing its browser global.`));
            }
        };
        const onLoad = () => finish();
        const onError = () => finish(new Error(`Could not load ${globalName}. Check the network connection and retry.`));
        const timeout = setTimeout(() => finish(new Error(`Timed out loading ${globalName}.`)), 15000);
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
        if (!existing) {
            script.src = LIBRARY_URLS[key];
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.dataset.appLibrary = key;
            document.head.appendChild(script);
        }
    });
    libraryPromises.set(key, promise);
    return promise;
}

export const ensureChartJs = () => loadGlobalLibrary('chart', 'Chart');
export const ensureXlsx = () => loadGlobalLibrary('xlsx', 'XLSX');
