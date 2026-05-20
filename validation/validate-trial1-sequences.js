const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEFAULT_FILES = [
  'sequences/trial1_visit1_sequences.js',
  'sequences/trial1_visit2_sequences.js',
  'sequences/trial1_monitorWk5_sequences.js',
  'sequences/trial1_monitorWk25_sequences.js',
];

function loadSequenceFile(absPath) {
  const source = fs.readFileSync(absPath, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source + '\nthis.__exports = { PILT_test_json, reversal_json, PILT_json, WM_json, WM_test_json };', sandbox, {
    filename: absPath,
  });

  const parsed = {};
  for (const [name, json] of Object.entries(sandbox.__exports)) {
    parsed[name.replace(/_json$/, '')] = JSON.parse(json);
  }
  return parsed;
}

function deepSort(value) {
  if (Array.isArray(value)) {
    return value.map(deepSort);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = deepSort(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function getShape(value) {
  if (!Array.isArray(value)) {
    return { kind: typeof value };
  }
  return {
    kind: 'array',
    length: value.length,
    children: value.map((item) => getShape(item)),
  };
}

function collectObjectKeys(value, target = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, target);
    return target;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => target.add(key));
    Object.values(value).forEach((child) => collectObjectKeys(child, target));
  }
  return target;
}

function collectPerTaskMetrics(taskData) {
  const blockCount = taskData.length;
  const trialsPerBlock = taskData.map((block) => block.length);
  const blockIds = taskData.map((block) => [...new Set(block.map((trial) => trial.block))].sort((a, b) => a - b));
  const trialRanges = taskData.map((block) => {
    const trials = block.map((trial) => trial.trial);
    return { min: Math.min(...trials), max: Math.max(...trials) };
  });
  const fieldSet = [...collectObjectKeys(taskData)].sort();

  return {
    blockCount,
    trialsPerBlock,
    blockIds,
    trialRanges,
    fieldSet,
    shape: deepSort(getShape(taskData)),
  };
}

function compareArrays(name, left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
    ? null
    : name + '\n  expected: ' + JSON.stringify(left) + '\n  actual:   ' + JSON.stringify(right);
}

function compareTask(referenceName, referenceTask, candidateName, candidateTask) {
  const errors = [];
  const refMetrics = collectPerTaskMetrics(referenceTask);
  const candidateMetrics = collectPerTaskMetrics(candidateTask);

  for (const key of ['blockCount', 'trialsPerBlock', 'blockIds', 'trialRanges', 'fieldSet', 'shape']) {
    const diff = compareArrays(key, refMetrics[key], candidateMetrics[key]);
    if (diff) errors.push(diff);
  }

  if (referenceTask.length !== candidateTask.length) {
    errors.push('top-level length differs');
    return errors;
  }

  for (let i = 0; i < referenceTask.length; i += 1) {
    const refBlock = referenceTask[i];
    const candBlock = candidateTask[i];
    if (refBlock.length !== candBlock.length) {
      errors.push('block ' + (i + 1) + ' length differs');
      continue;
    }

    for (let j = 0; j < refBlock.length; j += 1) {
      const refTrial = refBlock[j];
      const candTrial = candBlock[j];
      const refKeys = Object.keys(refTrial).sort();
      const candKeys = Object.keys(candTrial).sort();
      if (JSON.stringify(refKeys) !== JSON.stringify(candKeys)) {
        errors.push('task row mismatch at block ' + (i + 1) + ', item ' + (j + 1) + ': keys differ');
        break;
      }
    }
  }

  if (errors.length > 0) {
    return [referenceName + ' vs ' + candidateName + ':\n' + errors.join('\n')];
  }
  return [];
}

function main() {
  const relFiles = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_FILES;
  const datasets = relFiles.map((relPath) => ({
    relPath,
    absPath: path.resolve(relPath),
  }));

  const loaded = datasets.map((entry) => ({
    ...entry,
    tasks: loadSequenceFile(entry.absPath),
  }));

  const reference = loaded[0];
  const taskNames = Object.keys(reference.tasks).sort();
  const failures = [];

  for (const dataset of loaded.slice(1)) {
    const candidateTaskNames = Object.keys(dataset.tasks).sort();
    if (JSON.stringify(taskNames) !== JSON.stringify(candidateTaskNames)) {
      failures.push('Task names differ for ' + dataset.relPath + '\n  expected: ' + JSON.stringify(taskNames) + '\n  actual:   ' + JSON.stringify(candidateTaskNames));
      continue;
    }

    for (const taskName of taskNames) {
      failures.push(...compareTask(reference.relPath + '::' + taskName, reference.tasks[taskName], dataset.relPath + '::' + taskName, dataset.tasks[taskName]));
    }
  }

  const summary = taskNames.map((taskName) => {
    const metrics = collectPerTaskMetrics(reference.tasks[taskName]);
    return {
      taskName,
      blockCount: metrics.blockCount,
      trialsPerBlock: metrics.trialsPerBlock,
      fieldSet: metrics.fieldSet,
    };
  });

  console.log('Validated files:');
  loaded.forEach((item) => console.log('- ' + item.relPath));
  console.log('');
  console.log('Reference task summary:');
  for (const item of summary) {
    console.log('- ' + item.taskName + ': blocks=' + item.blockCount + ', trialsPerBlock=' + JSON.stringify(item.trialsPerBlock) + ', fields=' + JSON.stringify(item.fieldSet));
  }
  console.log('');

  if (failures.length > 0) {
    console.error('STRICT VALIDATION FAILED');
    for (const failure of failures) {
      console.error('');
      console.error(failure);
    }
    process.exitCode = 1;
    return;
  }

  console.log('STRICT VALIDATION PASSED');
  console.log('All files have matching task names, nesting shape, field sets, block counts, per-block trial counts, block ids, and trial ranges.');
}

main();
