/**
 * Shared PASS / FAIL / WARN / SKIP reporting for PocketBrain verify scripts.
 *
 * Legend:
 *   PASS — requirement met in the repository or generated tree
 *   FAIL — repository defect; must fix before release freeze claims
 *   WARN — incomplete for Play Production, but not a code defect (often external)
 *   SKIP — cannot run here; requires named external dependency (credentials, hosting, device)
 */
export function createReporter(suiteName) {
  const results = [];
  return {
    pass(id, message) {
      results.push({ id, ok: true, message });
      console.log(`PASS  ${id} — ${message}`);
    },
    fail(id, message) {
      results.push({ id, ok: false, message });
      console.log(`FAIL  ${id} — ${message}`);
    },
    warn(id, message, externalHint) {
      const msg = externalHint ? `${message} | EXTERNAL: ${externalHint}` : message;
      results.push({ id, ok: true, warn: true, message: msg, externalHint });
      console.log(`WARN  ${id} — ${msg}`);
    },
    skip(id, message, externalHint) {
      const msg = externalHint ? `${message} | EXTERNAL: ${externalHint}` : message;
      results.push({ id, ok: true, skip: true, message: msg, externalHint });
      console.log(`SKIP  ${id} — ${msg}`);
    },
    summary() {
      const failed = results.filter((r) => !r.ok);
      const warned = results.filter((r) => r.warn);
      const skipped = results.filter((r) => r.skip);
      const passed = results.filter((r) => r.ok && !r.warn && !r.skip);
      console.log('');
      console.log(`=== ${suiteName} ===`);
      console.log(
        `total=${results.length} pass=${passed.length} warn=${warned.length} skip=${skipped.length} fail=${failed.length}`,
      );
      if (skipped.length) {
        console.log('Skips (external — not code failures):');
        for (const s of skipped) console.log(`  - ${s.id}: ${s.message}`);
      }
      if (warned.length) {
        console.log('Warnings (often external / Production gates):');
        for (const w of warned) console.log(`  - ${w.id}: ${w.message}`);
      }
      if (failed.length) {
        console.log('Failures (fix in repository):');
        for (const f of failed) console.log(`  - ${f.id}: ${f.message}`);
        process.exitCode = 1;
      } else {
        process.exitCode = process.exitCode || 0;
      }
      return { results, failed, suiteName };
    },
  };
}

export function pngSize(filePath, fs) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
