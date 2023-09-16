import { IPFSContent } from 'src/utils/ipfs/ipfs';
import { mapParticleToCozoEntity } from './dto';
import dbService from './db.service';

export const importParicle = async (particle: IPFSContent) => {
  try {
    const entity = mapParticleToCozoEntity(particle);
    const result = (await dbService.executePutCommand('particle', entity)).ok;
    // console.log('importParicle', result, entity);
    return result;
  } catch (e) {
    console.error('importParicle', e);
  }
};

export const importCyberlink = async ({
  from,
  to,
  neuronAddress = '',
}: {
  from: string;
  to: string;
  neuronAddress: string;
}) => {
  try {
    const entity = { from, to, neuron_address: neuronAddress };
    const result = (await dbService.executePutCommand('link', entity)).ok;
    console.log('importCyberlink', result, entity);
    return result;
  } catch (e) {
    console.error('importCyberlink', e);
  }
};

type PlainCyberLink = {
  from: string;
  to: string;
};
export const importCyberlinks = async (links: PlainCyberLink[]) => {
  try {
    await dbService.executeBatchPutCommand(
      'link',
      links.map((l) => ({ ...l, neuron_address: '' })),
      100
    );
  } catch (e) {
    console.error('importCyberlinks', e);
  }
};
