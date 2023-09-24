import { join } from 'node:path';
import { Config } from '@config';
import { connectToMongo } from '../database/connection';
import { loadCoreModels, loadMockedData } from './dynamic-import-all-files';
import * as coreModels from '@ufabcnext/models';

// TODO: refactor this for the monorepo

type PopulateOptions = {
  operation: string;
  whichModels: string;
  readonly COMMUNITY?: 'test';
};

// this file populates MongoDB test database with data
(async () => {
  try {
    await populate();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

async function populate() {
  const populateOpts = {
    operation: process.argv[2],
    whichModels: process.argv[3],
    // DO NOT CHANGE THIS
    COMMUNITY: 'test',
    // DO NOT CHANGE THIS
  } satisfies PopulateOptions;

  if (Config.NODE_ENV === 'prod') {
    throw new Error('You cannot populate under production mode!!!');
  }

  if (!['insert', 'delete', 'reset'].includes(populateOpts.operation)) {
    throw new Error('Wrong operation. Choose between: insert, delete or reset')
      .message;
  }

  console.info('Running populate...');
  if (populateOpts.operation === 'insert') {
    await connectToMongo();
    console.log('inserting...');
    await createDatabases(populateOpts);
    console.log(`finished inserting in ${populateOpts.COMMUNITY}...`);
  }
  if (populateOpts.operation === 'delete') {
    await connectToMongo();
    await dumpDatabases(populateOpts);
  }
  if (populateOpts.operation === 'reset') {
    await connectToMongo();
    await dumpDatabases(populateOpts);
    await createDatabases(populateOpts);
  }
}

async function createDatabases({ whichModels }: PopulateOptions) {
  const data = join(__dirname, './data');
  const files = await loadMockedData(data);
  const appModels = await loadCoreModels();
  const ids: Record<string, string[]> = {};
  for (const model in files) {
    if (whichModels?.includes(model)) continue;
    const models = files[model];
    const data = models(ids);
    const Model = appModels[model];

    ids[model] = [];
    const content = data.map(async (value: any) => {
      try {
        const createdInstance = await Model.create(value);
        ids[model].push(createdInstance._id.toString());
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
    await Promise.all(content);
    console.log('populating database...');
  }
  return ids;
}

async function dumpDatabases({ whichModels, COMMUNITY }: PopulateOptions) {
  const appModels = await loadCoreModels();
  console.log('dropping database', COMMUNITY);
  for (const modelName in appModels) {
    if (whichModels?.includes(modelName)) continue;
    try {
      const model = appModels[modelName];
      const collection = model.collection;
      await collection.conn.db.dropDatabase();
    } catch (error) {
      console.error('broken db drop', error);
      throw error;
    }
  }
  console.log('dropped successfully');
}
