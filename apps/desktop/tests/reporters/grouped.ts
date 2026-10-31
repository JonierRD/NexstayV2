import type {
  Reporter,
  SerializedError,
  TestModule,
  TestRunEndReason
} from 'vitest/node';

// Reporter propio: en lugar de la lista plana de Vitest, muestra una tabla
// agrupada por unitarias/integracion, con el dueno de cada archivo y el avance
// (aprobadas / total). Si algo falla, imprime el detalle debajo.

type Group = 'UNITARIAS' | 'INTEGRACION' | 'OTRAS';

type Counts = {
  passed: number;
  failed: number;
  todo: number;
  skipped: number;
  total: number;
};

type Row = {
  file: string;
  group: Group;
  owner: string;
  counts: Counts;
  status: 'OK' | 'PARCIAL' | 'PENDIENTE' | 'FALLA' | 'VACIO';
};

const OWNERS: Record<string, string> = {
  'format.test.ts': 'Belladira',
  'dashboard-metrics.test.ts': 'Belladira',
  'stay-account.test.ts': 'Belladira',
  'api-client.test.ts': 'Harold',
  'auth-interceptors.test.ts': 'Harold',
  'settings-cache.test.tsx': 'Harold',
  'roles-access.test.ts': 'Jonier',
  'permissions.test.tsx': 'Jonier',
  'auth-flow.test.tsx': 'Jonier',
  'ui-primitives.test.tsx': 'Legarda',
  'modal-breakpoint.test.tsx': 'Legarda',
  'checkin-flow.test.tsx': 'Legarda'
};

const GROUP_TITLES: Record<Group, string> = {
  UNITARIAS: 'PRUEBAS UNITARIAS',
  INTEGRACION: 'PRUEBAS DE INTEGRACION',
  OTRAS: 'OTRAS PRUEBAS'
};

function filePath(moduleId: string): string {
  return moduleId.split('?')[0].replace(/\\/g, '/');
}

function fileName(moduleId: string): string {
  const path = filePath(moduleId);
  return path.slice(path.lastIndexOf('/') + 1);
}

function groupOf(moduleId: string): Group {
  const path = filePath(moduleId);
  if (path.includes('/tests/unit/')) return 'UNITARIAS';
  if (path.includes('/tests/integration/')) return 'INTEGRACION';
  return 'OTRAS';
}

function countTests(testModule: TestModule): Counts {
  const counts: Counts = { passed: 0, failed: 0, todo: 0, skipped: 0, total: 0 };

  for (const test of testModule.children.allTests()) {
    counts.total += 1;

    if (test.options.mode === 'todo') {
      counts.todo += 1;
      continue;
    }

    const state = test.result().state;
    if (state === 'passed') counts.passed += 1;
    else if (state === 'failed') counts.failed += 1;
    else if (state === 'skipped') counts.skipped += 1;
  }

  return counts;
}

function statusOf(counts: Counts): Row['status'] {
  if (counts.failed > 0) return 'FALLA';
  if (counts.total === 0) return 'VACIO';
  if (counts.passed === counts.total) return 'OK';
  if (counts.passed === 0) return 'PENDIENTE';
  return 'PARCIAL';
}

function rowOf(testModule: TestModule): Row {
  const counts = countTests(testModule);
  const file = fileName(testModule.moduleId);

  return {
    file,
    group: groupOf(testModule.moduleId),
    owner: OWNERS[file] ?? '-',
    counts,
    status: statusOf(counts)
  };
}

function pad(value: string, width: number): string {
  return value.padEnd(width);
}

function printGroup(group: Group, rows: Row[]): void {
  if (rows.length === 0) return;

  const sorted = [...rows].sort((a, b) => a.file.localeCompare(b.file));
  const fileWidth = Math.max('Archivo'.length, ...sorted.map((row) => row.file.length));
  const ownerWidth = Math.max('Responsable'.length, ...sorted.map((row) => row.owner.length));
  const statusWidth = Math.max('Estado'.length, ...sorted.map((row) => row.status.length)) + 2;

  console.log(`\n${GROUP_TITLES[group]}`);
  console.log(
    `  ${pad('Archivo', fileWidth)}  ${pad('Responsable', ownerWidth)}  ${pad('Estado', statusWidth)}  Avance`
  );
  console.log(`  ${'-'.repeat(fileWidth)}  ${'-'.repeat(ownerWidth)}  ${'-'.repeat(statusWidth)}  ------`);

  sorted.forEach((row) => {
    const progress = `${row.counts.passed}/${row.counts.total}`;
    console.log(
      `  ${pad(row.file, fileWidth)}  ${pad(row.owner, ownerWidth)}  ${pad(row.status, statusWidth)}  ${progress}`
    );
  });
}

function printFailures(testModules: ReadonlyArray<TestModule>): void {
  testModules.forEach((testModule) => {
    const file = fileName(testModule.moduleId);

    testModule.errors().forEach((error) => {
      console.log(`\nERROR AL CARGAR ${file}`);
      console.log(`  ${error.message}`);
    });

    for (const test of testModule.children.allTests()) {
      const result = test.result();
      if (result.state !== 'failed') continue;

      console.log(`\nFALLO ${file} > ${test.fullName}`);
      result.errors.forEach((error) => {
        const detail = error.stack ?? error.message;
        console.log(
          detail
            .split('\n')
            .map((line) => `  ${line}`)
            .join('\n')
        );
      });
    }
  });
}

class GroupedReporter implements Reporter {
  private startedAt = Date.now();
  private completed = 0;

  onTestRunStart(): void {
    this.startedAt = Date.now();
    this.completed = 0;
    console.log('\nEjecutando pruebas...  (+ completo | . pendiente | x fallo)\n');
  }

  onTestModuleEnd(testModule: TestModule): void {
    const counts = countTests(testModule);
    this.completed += 1;

    const mark = counts.failed > 0 ? 'x' : counts.passed === counts.total ? '+' : '.';
    const index = String(this.completed).padStart(2);
    process.stdout.write(`  [${index}] ${mark} ${fileName(testModule.moduleId)}\n`);
  }

  onTestRunEnd(
    testModules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    reason: TestRunEndReason
  ): void {
    const rows = testModules.map(rowOf);
    const duration = ((Date.now() - this.startedAt) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(72));
    console.log(' RESULTADO DE LAS PRUEBAS DEL FRONTEND');
    console.log('='.repeat(72));

    printGroup('UNITARIAS', rows.filter((row) => row.group === 'UNITARIAS'));
    printGroup('INTEGRACION', rows.filter((row) => row.group === 'INTEGRACION'));
    printGroup('OTRAS', rows.filter((row) => row.group === 'OTRAS'));

    const total = rows.reduce(
      (acc, row) => ({
        passed: acc.passed + row.counts.passed,
        failed: acc.failed + row.counts.failed,
        todo: acc.todo + row.counts.todo,
        skipped: acc.skipped + row.counts.skipped,
        total: acc.total + row.counts.total
      }),
      { passed: 0, failed: 0, todo: 0, skipped: 0, total: 0 }
    );

    const files = {
      complete: rows.filter((row) => row.status === 'OK').length,
      partial: rows.filter((row) => row.status === 'PARCIAL').length,
      pending: rows.filter((row) => row.status === 'PENDIENTE').length,
      failed: rows.filter((row) => row.status === 'FALLA' || row.status === 'VACIO').length
    };

    console.log(`\n${'='.repeat(72)}`);
    console.log(' RESUMEN');
    console.log('='.repeat(72));
    console.log(`  Pruebas   : ${total.passed} aprobadas | ${total.failed} fallidas | ${total.todo} pendientes | ${total.skipped} omitidas`);
    console.log(`  Archivos  : ${files.complete} completos | ${files.partial} parciales | ${files.pending} pendientes | ${files.failed} con fallos`);
    console.log(`  Duracion  : ${duration} s${reason === 'interrupted' ? ' (interrumpida)' : ''}`);

    printFailures(testModules);

    unhandledErrors.forEach((error) => {
      console.log('\nERROR NO CONTROLADO');
      console.log(
        (error.stack ?? error.message)
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n')
      );
    });

    console.log('');
  }
}

export default GroupedReporter;
