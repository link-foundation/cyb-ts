import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'src/contexts/queryClient';
import { CONTRACT_ADDRESS_PASSPORT } from 'src/containers/portal/utils';

// TODO: add type
// https://github.com/cybercongress/cw-cybergift/tree/main/contracts/cw-cyber-passport/schema
type Query = {
  [key: string]: any;
};

type Props = {
  query: Query;
  skip?: boolean;
};

function usePassportContract<DataType>({ query, skip }: Props) {
  const [data, setData] = useState<DataType>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const queryClient = useQueryClient();

  const lastQuery = useRef<Query>();

  async function queryContract(query: Query) {
    if (!queryClient) {
      return;
    }

    try {
      setLoading(true);
      const response = await queryClient.queryContractSmart(
        CONTRACT_ADDRESS_PASSPORT,
        query
      );

      setData(response);
    } catch (error) {
      console.error(error);
      setError(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (skip) {
      return;
    }

    if (JSON.stringify(lastQuery.current) === JSON.stringify(query)) {
      return;
    }

    lastQuery.current = query;
    queryContract(query);
  }, [query, skip]);

  return {
    data,
    loading,
    // loadData: queryContract,
    error,
  };
}

export default usePassportContract;
