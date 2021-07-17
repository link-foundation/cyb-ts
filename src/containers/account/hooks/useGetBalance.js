import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../../../context';
import { coinDecimals, fromBech32 } from '../../../utils/utils';
import { CYBER } from '../../../utils/config';

const initValue = {
  available: 0,
  delegation: 0,
  unbonding: 0,
  rewards: 0,
  total: 0,
};

const initValueToken = {
  sboot: 0,
  amper: 0,
  volt: 0,
};

function useGetBalance(address, updateAddress) {
  const { jsCyber } = useContext(AppContext);
  const [loadingBalanceInfo, setLoadingBalanceInfo] = useState(true);
  const [loadingBalanceToken, setLoadingBalanceToken] = useState(true);
  const [balance, setBalance] = useState(initValue);
  const [balanceToken, setBalanceToken] = useState(initValueToken);

  useEffect(() => {
    const getBalance = async () => {
      try {
        if (jsCyber !== null && address !== null) {
          setBalance(initValue);
          setLoadingBalanceInfo(true);
          const availablePromise = await jsCyber.getBalance(address, 'boot');
          setBalance((item) => ({
            ...item,
            available: parseFloat(availablePromise.amount),
            total: item.total + parseFloat(availablePromise.amount),
          }));

          const delegationsPromise = await jsCyber.getBalance(address, 'sboot');
          setBalance((item) => ({
            ...item,
            delegation: parseFloat(delegationsPromise.amount),
            total: item.total + parseFloat(delegationsPromise.amount),
          }));

          const unbondingPromise = await jsCyber.delegatorUnbondingDelegations(
            address
          );
          if (
            unbondingPromise.unbondingResponses &&
            unbondingPromise.unbondingResponses.length > 0
          ) {
            const { unbondingResponses } = unbondingPromise;
            unbondingResponses.forEach((unbond, i) => {
              unbond.entries.forEach((entry, j) => {
                setBalance((item) => ({
                  ...item,
                  unbonding: Math.floor(
                    item.unbonding + parseFloat(entry.balance)
                  ),
                  total: Math.floor(item.total + parseFloat(entry.balance)),
                }));
              });
            });
          }
          const rewardsPropsise = await jsCyber.delegationTotalRewards(address);
          if (rewardsPropsise.total && rewardsPropsise.total.length > 0) {
            setBalance((item) => ({
              ...item,
              rewards: Math.floor(
                coinDecimals(parseFloat(rewardsPropsise.total[0].amount))
              ),
              total: Math.floor(
                item.total +
                  coinDecimals(parseFloat(rewardsPropsise.total[0].amount))
              ),
            }));
          }
          const dataValidatorAddress = fromBech32(
            address,
            CYBER.BECH32_PREFIX_ACC_ADDR_CYBERVALOPER
          );
          const resultGetDistribution = await jsCyber.validatorCommission(
            dataValidatorAddress
          );
          if (resultGetDistribution.commission.commission.length > 0) {
            const { commission } = resultGetDistribution;
            setBalance((item) => ({
              ...item,
              commission: Math.floor(
                coinDecimals(parseFloat(commission.commission[0].amount))
              ),
              total: Math.floor(
                item.total +
                  coinDecimals(parseFloat(commission.commission[0].amount))
              ),
            }));
          }
        } else {
          setBalance(initValue);
        }
        setLoadingBalanceInfo(false);
      } catch (e) {
        console.log(e);
        setLoadingBalanceInfo(false);
        return {
          available: 0,
          delegations: 0,
          unbonding: 0,
          rewards: 0,
        };
      }
    };
    getBalance();
  }, [jsCyber, address, updateAddress]);

  useEffect(() => {
    const getBalance = async () => {
      try {
        if (jsCyber !== null && address !== null) {
          setBalanceToken(initValueToken);
          setLoadingBalanceToken(true);
          const getAllBalancesPromise = await jsCyber.getAllBalances(address);
          const balancesToken = getCalculationBalance(getAllBalancesPromise);
          setBalanceToken((item) => ({ ...item, ...balancesToken }));
          setLoadingBalanceToken(false);
        } else {
          setBalance(initValueToken);
          setLoadingBalanceToken(false);
        }
      } catch (e) {
        console.log(e);
        setLoadingBalanceToken(false);
        return {
          ...initValueToken,
        };
      }
    };
    getBalance();
  }, [jsCyber, address, updateAddress]);

  const getCalculationBalance = (data) => {
    const balances = {};
    if (Object.keys(data).length > 0) {
      data.forEach((item) => {
        balances[item.denom] = parseFloat(item.amount);
      });
    }

    return balances;
  };

  return { balance, loadingBalanceInfo, balanceToken, loadingBalanceToken };
}

export default useGetBalance;
