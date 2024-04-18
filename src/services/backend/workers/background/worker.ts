import { ProxyMarked, Remote, proxy } from 'comlink';

import { initIpfsNode } from 'src/services/ipfs/node/factory';

import {
  CybIpfsNode,
  IpfsContentType,
  IpfsOptsType,
} from 'src/services/ipfs/types';

import QueueManager from 'src/services/QueueManager/QueueManager';

// import { CozoDbWorkerApi } from 'src/services/backend/workers/db/worker';

import {
  QueueItemCallback,
  QueueItemOptions,
  QueuePriority,
} from 'src/services/QueueManager/types';
import { ParticleCid } from 'src/types/base';
import { LinkDto } from 'src/services/CozoDb/types/dto';
import { BehaviorSubject, Subject } from 'rxjs';
import { PipelineType, pipeline } from '@xenova/transformers';

import { exposeWorkerApi } from '../factoryMethods';

import { SyncService } from '../../services/sync/sync';
import { SyncServiceParams } from '../../services/sync/types';

import DbApi from '../../services/DbApi/DbApi';

import BroadcastChannelSender from '../../channels/BroadcastChannelSender';
import DeferredDbSaver from '../../services/DeferredDbSaver/DeferredDbSaver';
import { SyncEntryName } from '../../types/services';

type MlModelParams = {
  name: PipelineType;
  model: string;
};
const mlModelMap: Record<string, MlModelParams> = {
  featureExtractor: {
    name: 'feature-extraction',
    model: 'Xenova/all-MiniLM-L6-v2',
  },
  summarization: {
    name: 'summarization',
    model: 'ahmedaeb/distilbart-cnn-6-6-optimised',
  },
};
const createBackgroundWorkerApi = () => {
  const dbInstance$ = new Subject<DbApi | undefined>();

  const ipfsInstance$ = new BehaviorSubject<CybIpfsNode | undefined>(undefined);

  const params$ = new BehaviorSubject<SyncServiceParams>({
    myAddress: null,
  });

  let ipfsNode: CybIpfsNode | undefined;
  const defferedDbSaver = new DeferredDbSaver(dbInstance$);

  const mlInstances: Record<keyof typeof mlModelMap, any> = {};

  const ipfsQueue = new QueueManager(ipfsInstance$, {
    defferedDbSaver,
  });
  const broadcastApi = new BroadcastChannelSender();

  //   const generator = await pipeline('summarization', 'ahmedaeb/distilbart-cnn-6-6-optimised');
  // const text = 'The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, ' +
  //   'and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. ' +
  //   'During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest ' +
  //   'man-made structure in the world, a title it held for 41 years until the Chrysler Building in New ' +
  //   'York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to ' +
  //   'the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the ' +
  //   'Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second ' +
  //   'tallest free-standing structure in France after the Millau Viaduct.';
  // const output = await generator(text, {
  //   max_new_tokens: 100,
  // });

  const initMlInstance = async (name: keyof typeof mlModelMap) => {
    if (!mlInstances[name]) {
      broadcastApi.postServiceStatus('ml', 'starting');
      const model = mlModelMap[name];
      mlInstances[name] = await pipeline(model.name, model.model, {
        progress_callback: (progress: any) => {
          console.log('progress_callback', name, progress);
        },
        // if (progress.status === "ready") {
        //   broadcastApi.postServiceStatus('ml', 'started')
        //   }
      })
        .then((result) => {
          broadcastApi.postServiceStatus('ml', 'started');
          return result;
        })
        .catch((e) =>
          broadcastApi.postServiceStatus('ml', 'error', e.toString())
        );
      console.log('----mlInstances', mlInstances);
    }
  };

  // service to sync updates about cyberlinks, transactions, swarm etc.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const syncService = new SyncService({
    waitForParticleResolve: async (
      cid: ParticleCid,
      priority: QueuePriority = QueuePriority.MEDIUM
    ) => ipfsQueue.enqueueAndWait(cid, { postProcessing: true, priority }),
    dbInstance$,
    ipfsInstance$,
    params$,
  });

  const init = async (dbApiProxy: DbApi & ProxyMarked) => {
    dbInstance$.next(dbApiProxy);
    initMlInstance('featureExtractor');
  };

  const stopIpfs = async () => {
    if (ipfsNode) {
      await ipfsNode.stop();
    }
    ipfsInstance$.next(undefined);
    broadcastApi.postServiceStatus('ipfs', 'inactive');
  };

  const startIpfs = async (ipfsOpts: IpfsOptsType) => {
    try {
      if (ipfsNode) {
        console.log('Ipfs node already started!');
        await ipfsNode.stop();
      }
      broadcastApi.postServiceStatus('ipfs', 'starting');
      ipfsNode = await initIpfsNode(ipfsOpts);

      ipfsInstance$.next(ipfsNode);

      setTimeout(() => broadcastApi.postServiceStatus('ipfs', 'started'), 0);
      return true;
    } catch (err) {
      console.log('----ipfs node init error ', err);
      const msg = err instanceof Error ? err.message : (err as string);
      broadcastApi.postServiceStatus('ipfs', 'error', msg);
      throw Error(msg);
    }
  };

  const defferedDbApi = {
    importCyberlinks: (links: LinkDto[]) => {
      defferedDbSaver.enqueueLinks(links);
    },
  };

  const mlApi = {
    getEmbedding: async (text: string) => {
      const output = await mlInstances.featureExtractor(text, {
        pooling: 'mean',
        normalize: true,
      });

      return output.data;
    },
  };

  const ipfsApi = {
    start: startIpfs,
    stop: stopIpfs,
    getIpfsNode: async () => ipfsNode && proxy(ipfsNode),
    config: async () => ipfsNode?.config,
    info: async () => ipfsNode?.info(),
    fetchWithDetails: async (cid: string, parseAs?: IpfsContentType) =>
      ipfsNode?.fetchWithDetails(cid, parseAs),
    enqueue: async (
      cid: string,
      callback: QueueItemCallback,
      options: QueueItemOptions
    ) => ipfsQueue!.enqueue(cid, callback, options),
    enqueueAndWait: async (cid: string, options?: QueueItemOptions) =>
      ipfsQueue!.enqueueAndWait(cid, options),
    dequeue: async (cid: string) => ipfsQueue.cancel(cid),
    dequeueByParent: async (parent: string) => ipfsQueue.cancelByParent(parent),
    clearQueue: async () => ipfsQueue.clear(),
    addContent: async (content: string | File) => ipfsNode?.addContent(content),
  };

  return {
    init,
    isInitialized: () => !!ipfsInstance$.value,
    // syncDrive,
    ipfsApi: proxy(ipfsApi),
    defferedDbApi: proxy(defferedDbApi),
    mlApi: proxy(mlApi),
    ipfsQueue: proxy(ipfsQueue),
    restartSync: (name: SyncEntryName) => syncService.restart(name),
    setParams: (params: Partial<SyncServiceParams>) =>
      params$.next({ ...params$.value, ...params }),
  };
};

const backgroundWorker = createBackgroundWorkerApi();

export type IpfsApi = Remote<typeof backgroundWorker.ipfsApi>;

export type BackgroundWorker = typeof backgroundWorker;

// Expose the API to the main thread as shared/regular worker
exposeWorkerApi(self, backgroundWorker);
