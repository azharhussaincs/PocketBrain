/**
 * Expo config plugin — Android release signing for PocketBrain (Phase 11).
 *
 * @see release/APP_SIGNING.md
 */
const { withAppBuildGradle, createRunOncePlugin } = require('expo/config-plugins');

const MARKER = 'PocketBrain release signing (Phase 11)';

function injectReleaseSigning(gradle) {
  let next = gradle;

  if (!next.includes('pbHasReleaseCreds')) {
    const helpers = `
    // ${MARKER}
    def pbKeystorePropertiesFile = rootProject.file("keystore.properties")
    def pbKeystoreProperties = new Properties()
    if (pbKeystorePropertiesFile.exists()) {
        pbKeystoreProperties.load(new FileInputStream(pbKeystorePropertiesFile))
    }
    def pbStoreFile = System.getenv("PB_UPLOAD_STORE_FILE") ?: pbKeystoreProperties['storeFile']
    def pbStorePassword = System.getenv("PB_UPLOAD_STORE_PASSWORD") ?: pbKeystoreProperties['storePassword']
    def pbKeyAlias = System.getenv("PB_UPLOAD_KEY_ALIAS") ?: pbKeystoreProperties['keyAlias']
    def pbKeyPassword = System.getenv("PB_UPLOAD_KEY_PASSWORD") ?: pbKeystoreProperties['keyPassword']
    def pbHasReleaseCreds = pbStoreFile != null && !pbStoreFile.toString().trim().isEmpty() && pbStorePassword && pbKeyAlias && pbKeyPassword

`;
    next = next.replace(/(\n\s*)signingConfigs\s*\{/, `${helpers}$1signingConfigs {`);
  }

  // Replace entire signingConfigs block with debug + conditional release
  next = next.replace(
    /signingConfigs\s*\{[\s\S]*?\n    \}/,
    `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (pbHasReleaseCreds) {
                storeFile file(pbStoreFile)
                storePassword pbStorePassword
                keyAlias pbKeyAlias
                keyPassword pbKeyPassword
            }
        }
    }`,
  );

  // Assign release signing when creds exist. Do NOT throw inside buildTypes.release —
  // that closure runs at configuration time and would break assembleDebug.
  const releaseSigningSnippet = `// ${MARKER}
            if (pbHasReleaseCreds) {
                signingConfig signingConfigs.release
            }`;

  // Replace release buildType debug signing assignment
  if (/release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.debug/.test(next)) {
    const lines = next.split('\n');
    let inBuildTypes = false;
    let inRelease = false;
    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*buildTypes\s*\{/.test(line)) {
        inBuildTypes = true;
        depth = 1;
        continue;
      }
      if (!inBuildTypes) continue;
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      if (/^\s*release\s*\{/.test(line)) inRelease = true;
      if (inRelease && /signingConfig\s+signingConfigs\.debug/.test(line)) {
        const indent = line.match(/^\s*/)[0];
        lines[i] = `${indent}${releaseSigningSnippet.split('\n').join(`\n${indent}`)}`;
        inRelease = false;
      }
      if (depth <= 0) inBuildTypes = false;
    }
    next = lines.join('\n');
  }

  // Fail-closed only when a release assemble/bundle/install task is actually requested.
  // Credential locals are re-resolved here (project scope) — defs inside android {} are not visible.
  const failClosedHook = `
// ${MARKER} — fail-closed for release tasks only (debug builds must work without upload keystore)
gradle.taskGraph.whenReady { graph ->
    def pbReleaseRequested = graph.allTasks.any { t ->
        def n = t.name.toLowerCase()
        (n.contains("assemble") || n.contains("bundle") || n.contains("install")) && n.contains("release")
    }
    if (pbReleaseRequested) {
        def pbKsFile = rootProject.file("keystore.properties")
        def pbKs = new Properties()
        if (pbKsFile.exists()) {
            pbKs.load(new FileInputStream(pbKsFile))
        }
        def pbSf = System.getenv("PB_UPLOAD_STORE_FILE") ?: pbKs['storeFile']
        def pbHasCreds = pbSf != null && !pbSf.toString().trim().isEmpty() &&
            (System.getenv("PB_UPLOAD_STORE_PASSWORD") ?: pbKs['storePassword']) &&
            (System.getenv("PB_UPLOAD_KEY_ALIAS") ?: pbKs['keyAlias']) &&
            (System.getenv("PB_UPLOAD_KEY_PASSWORD") ?: pbKs['keyPassword'])
        if (!pbHasCreds) {
            throw new GradleException("Release signing credentials missing. Set PB_UPLOAD_* env vars or android/keystore.properties. See release/APP_SIGNING.md")
        }
    }
}
`;

  if (!next.includes('pbReleaseRequested')) {
    if (next.includes('dependencies {')) {
      next = next.replace(/\ndependencies\s*\{/, `${failClosedHook}\ndependencies {`);
    } else {
      next = `${next}\n${failClosedHook}\n`;
    }
  }

  // Ensure release signingConfigs.release exists
  if (!/signingConfigs\s*\{[\s\S]*release\s*\{[\s\S]*pbHasReleaseCreds/.test(next)) {
    throw new Error('withAndroidReleaseSigning: signingConfigs.release block missing');
  }

  // Ensure release buildType does not use debug signing
  const afterBuildTypes = next.split(/buildTypes\s*\{/)[1] || '';
  const releaseBodyMatch = afterBuildTypes.match(/release\s*\{([\s\S]*?)\n\s*\}/);
  const releaseBody = releaseBodyMatch ? releaseBodyMatch[1] : '';
  if (/signingConfig\s+signingConfigs\.debug/.test(releaseBody)) {
    throw new Error('withAndroidReleaseSigning: release still references signingConfigs.debug');
  }
  if (!releaseBody.includes('signingConfigs.release') && !releaseBody.includes(MARKER)) {
    throw new Error('withAndroidReleaseSigning: release buildType missing release signing wiring');
  }
  if (!next.includes('pbReleaseRequested') || !next.includes('GradleException')) {
    throw new Error('withAndroidReleaseSigning: release fail-closed taskGraph hook missing');
  }

  return next;
}

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = injectReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withAndroidReleaseSigning,
  'with-android-release-signing',
  '1.0.3',
);
