import * as Promise from 'bluebird';
import * as fs from 'fs-extra-promise';
import { IHashResult, ILookupResult, IReference, IRule } from 'modmeta-db';
import { log, types, util } from 'nmm-api';
import * as path from 'path';
import {IFileEntry as FileEntry, IModEntry as ModEntry} from '../types/nmmEntries';

const virtualConfigFilename: string = 'VirtualModConfig.xml';

export function parseNMMInstall(nmmFilePath: string, mods: any): Promise<ModEntry[]> {
  const nmmModList: ModEntry[] = [];
  const parser = new DOMParser();
  const sourceFile = path.join(nmmFilePath, virtualConfigFilename);
  const modListSet = new Set(Object.keys(mods).map((key: string) => mods[key].id));

  return fs.readFileAsync(sourceFile)
  .then((data) => {
    const xmlDoc = parser.parseFromString(data.toString('utf-8'), 'text/xml');
    const version = xmlDoc.getElementsByTagName('virtualModActivator')[0];

    if (version === null) {
      throw new Error('The selected folder does not contain a valid VirtualModConfig.xml file.');
    } else if (version.getAttribute('fileVersion') !== '0.3.0.0') {
      throw new Error('The selected folder contains an older VirtualModConfig.xml file,'
        + 'you need to upgrade your NMM before proceeding with the mod import.');
    }

    const modInfoList = xmlDoc.getElementsByTagName('modInfo');
    if (modInfoList === undefined || modInfoList.length <= 0) {
      throw new Error('The selected folder contains an empty VirtualModConfig.xml file.');
    }

    for (const modInfo of modInfoList) {
      if (!modInfo.hasChildNodes) {
        continue;
      }

      const elementModId = modInfo.getAttribute('modId');
      const elementDownloadId = modInfo.getAttribute('downloadId');
      const elementModName = modInfo.getAttribute('modName');
      const elementModFilename = modInfo.getAttribute('modFileName');
      const elementArchivePath = modInfo.getAttribute('modFilePath');
      const elementModVersion = modInfo.getAttribute('FileVersion');

      const modFileEntries: FileEntry[] = [];

      for (const fileLink of modInfo.getElementsByTagName('fileLink')) {
        const nodeRealPath = fileLink.getAttribute('realPath');
        const nodeVirtualPath = fileLink.getAttribute('virtualPath');
        const nodeLinkPriority = fileLink.childNodes[0].nodeValue;
        const nodeIsActive = fileLink.childNodes[1].nodeValue;

        const fileEntry: FileEntry = {
          fileSource: nodeRealPath,
          fileDestination: nodeVirtualPath,
          isActive: (nodeIsActive === 'true'),
          filePriority: (parseInt(nodeLinkPriority, 10)),
        };

        modFileEntries.push(fileEntry);
      }

      const modFilePath = path.join(elementArchivePath, elementModFilename);
      let fileMD5: string = '';

      const { genHash } = require('modmeta-db');
      genHash(modFilePath)
        .then((hashResult: IHashResult) => {
           fileMD5 = hashResult.md5sum;
        });

      const derivedId: string = util.deriveInstallName(elementModName, '');

      const modEntry: ModEntry = {
        nexusId: elementModId,
        vortexId: derivedId,
        downloadId: elementDownloadId,
        modName: elementModName,
        modFilename: elementModFilename,
        archivePath: elementArchivePath,
        modVersion: elementModVersion,
        archiveMD5: fileMD5,
        importFlag: true,
        isAlreadyManaged: modListSet.has(derivedId),
        fileEntries: modFileEntries,
      };

      nmmModList.push(modEntry);
    }
  })
  .then(() => {
    return Promise.resolve(nmmModList);
  });
}

export default parseNMMInstall;
