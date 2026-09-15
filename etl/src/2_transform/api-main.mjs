import { readFileSync, writeFile } from 'node:fs';
import schema from '../../../src/model/data/fridge/yup/index.js';

import urlExist from 'url-exist';
import * as entities from 'entities';
import { groupWithinBound } from '../../../src/lib/geo.js';

const inputFileName = 'table/main.json';
const outputFileName = 'output/api.json';

async function main() {
  const inputTable = JSON.parse(readFileSync(inputFileName));
  const fridgeList = [];

  for (const record of inputTable) {
    fridgeList.push(await FridgeLexicalValidator(fridgeFromRecord(record)));
  }
  if (ErrorCount > 0) {
    console.error('lexical errors: ' + ErrorCount);
    return 1;
  }

  await FridgeSyntacticValidator(fridgeList);
  if (ErrorCount > 0) {
    console.error('syntactic errors: ' + ErrorCount);
    return 2;
  }

  // transform fridgeList to minimize file space
  let recordCount = 0;
  for (const fridge of fridgeList) {
    recordCount++;
    if (Object.keys(fridge.maintainer).length === 0) {
      delete fridge.maintainer;
    }
  }

  // write data in mock server format
  const mockJsonFormat = JSON.stringify({
    fridges: fridgeList,
    reports: [],
    contact: [],
    photo: [],
  });
  writeFile(outputFileName, mockJsonFormat, { flag: 'w' }, (e) => e);

  // inform user
  console.log(`successfully wrote ${recordCount} records to ${outputFileName}`);
  return 0;
}
process.exit(await main());

let ErrorCount = 0;
function LogError(error) {
  if (error) {
    ErrorCount++;
    console.log(error);
  }
}

// Makes sure input matches schema and returns a valid fridge object.
async function FridgeLexicalValidator(input) {
  let fridge = input;

  try {
    fridge = await schema.Fridge.validate(input, { abortEarly: false });
  } catch (e) {
    LogError({ mainId: e.value.mainId, errors: e.errors });
  }

  return fridge;
}

async function FridgeSyntacticValidator(fridgeList) {
  // test all fridge names are unique
  const nameDict = {};

  for (const fridge of fridgeList) {
    const { id, mainId } = fridge;
    const prior_mainId = nameDict[id];
    if (prior_mainId) {
      LogError({
        mainId,
        errors: ['fridge name is a duplicate of id: ' + prior_mainId],
      });
    } else {
      nameDict[id] = mainId; // todo: use set
    }
  }
  for (const key in nameDict) delete nameDict[key];

  // test for duplicate addresses / locations
  const boundInMeters = 90;
  const geoList = fridgeList.map((e) => ({
    mainId: e.mainId,
    lat: e.location.geoLat,
    lng: e.location.geoLng,
  }));

  groupWithinBound(boundInMeters, geoList).forEach((groupWithDuplicates) => {
    LogError({
      mainId: groupWithDuplicates[0].mainId,
      errors: groupWithDuplicates
        .slice(1)
        .map((c) => 'fridge location is a duplicate of id: ' + c.mainId),
    });
  });

  // test website, instagram links are alive
  const urlDataList = [];
  const urlTestQueue = [];
  const QueueUrlTest = ({ mainId, url }) => {
    if (url) {
      urlDataList.push({ mainId, url });
      urlTestQueue.push(urlExist(url));
    }
  };

  for (const fridge of fridgeList) {
    if (fridge['maintainer']) {
      QueueUrlTest({
        mainId: fridge.mainId,
        url: fridge.maintainer['website'],
      });
      QueueUrlTest({
        mainId: fridge.mainId,
        url: fridge.maintainer['instagram'],
      });
    }
  }

  const urlIsAliveList = await Promise.all(urlTestQueue);

  for (let n = 0; n < urlIsAliveList.length; n++) {
    if (!urlIsAliveList[n]) {
      const { mainId, url } = urlDataList[n];
      LogError({ mainId, errors: ['link is dead: ' + url] });
    }
  }
  urlIsAliveList.length = 0;
  urlDataList.length = 0;
  urlTestQueue.length = 0;
}

function fridgeFromRecord(record) {
  const {
    mainId,
    fridgeName = '',
    fridgeVerified: verified,
    fridgeNotes,
    maintainerName,
    maintainerEmail,
    maintainerOrganization,
    maintainerPhone,
    maintainerInstagram: instagram,
    maintainerWebsite: website,
    locationName,
    locationStreet: street,
    locationCity: city,
    locationState: state,
    locationZip: zip,
    locationGeoLat: geoLat,
    locationGeoLng: geoLng,
  } = record;

  // required fridge fields
  const name = parseFridgeName(fridgeName);
  const fridge = {
    mainId,
    id: createFridgeId(name),
    name,
    verified,
    location: { street, city, state, zip, geoLat, geoLng },
    maintainer: {},
  };

  // optional location fields
  if (locationName) {
    fridge.location['name'] = entities.decodeHTML(locationName);
  }

  // optional fridge fields
  if (fridgeNotes) {
    fridge['notes'] = entities.decodeHTML(fridgeNotes);
  }

  // maintainer
  if (maintainerName) {
    fridge.maintainer['name'] = entities.decodeHTML(maintainerName);
  }
  if (maintainerEmail) {
    fridge.maintainer['email'] = maintainerEmail;
  }
  if (maintainerOrganization) {
    fridge.maintainer['organization'] = entities.decodeHTML(
      maintainerOrganization
    );
  }
  if (maintainerPhone) {
    fridge.maintainer['phone'] = maintainerPhone;
  }
  if (instagram) {
    fridge.maintainer['instagram'] = parseInstagram(instagram);
  }
  if (website) {
    fridge.maintainer['website'] = parseURL(website);
  }

  return fridge;
}

function createFridgeId(name) {
  const lower = name.toLowerCase();
  const replaced = lower.replace(/[^\w\d]/g, '');
  return replaced;
}

function parseFridgeName(name) {
  const decoded = entities.decodeHTML(name);
  return decoded.replace(/^the /i, '');
}

function parseInstagram(handle) {
  return handle.replace(/@([\w\d_]+)/, 'https://www.instagram.com/$1');
}

function parseURL(url) {
  return url.replace(/^([\w\d]+\.)?[\w\d]+\.[\w\d]+/, 'http://$&');
}
