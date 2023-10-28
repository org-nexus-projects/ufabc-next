import { statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import * as coreModels from '@next/models';

export function loadCoreModels() {
  const orderedModels = [coreModels].reverse();
  const result = Object.assign({}, ...orderedModels);
  return result;
}

export async function loadMockedData(directoryPath: string) {
  const files = await readdir(directoryPath);
  const importPromises = files.map(async (file) => {
    const filePath = `${directoryPath}/${file}`;
    const files = await import(filePath);
    if (statSync(filePath).isFile()) {
      return files;
    }
  });
  const importedModules = await Promise.all(importPromises);
  const orderedModels = importedModules
    .filter((models) => models !== null)
    .reverse();
  const result = Object.assign({}, ...orderedModels);
  return result;
}
