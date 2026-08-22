const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_META_FILE = path.join('.generated', 'build-meta.json');

function safeGitSha(cwd) {
    try {
        return execSync('git rev-parse HEAD', {
            cwd,
            stdio: ['ignore', 'pipe', 'ignore']
        }).toString().trim();
    } catch (_error) {
        return '';
    }
}

function resolveBuildMeta(cwd = process.cwd()) {
    const commitSha = String(process.env.VERCEL_GIT_COMMIT_SHA || safeGitSha(cwd) || '').trim();
    const builtAt = new Date().toISOString();
    const buildSeed = commitSha ? commitSha.slice(0, 7) : 'local';
    const buildId = `${buildSeed}-${Date.now()}`;

    return {
        buildId,
        commitSha,
        builtAt
    };
}

function ensureBuildMetaFile(cwd = process.cwd()) {
    const meta = resolveBuildMeta(cwd);
    const fullPath = path.join(cwd, BUILD_META_FILE);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(meta, null, 2));
    return meta;
}

function readBuildMeta(cwd = process.cwd()) {
    const fullPath = path.join(cwd, BUILD_META_FILE);
    if (!fs.existsSync(fullPath)) {
        return resolveBuildMeta(cwd);
    }

    try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const meta = JSON.parse(raw);
        if (meta && meta.buildId && meta.builtAt) {
            return meta;
        }
    } catch (_error) {
        return resolveBuildMeta(cwd);
    }

    return resolveBuildMeta(cwd);
}

module.exports = {
    BUILD_META_FILE,
    ensureBuildMetaFile,
    readBuildMeta
};
