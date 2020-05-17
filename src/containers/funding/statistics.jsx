import React from 'react';
import { Indicators, Card, ContainerCard } from '../../components/index';
import { CYBER, DISTRIBUTION, GENESIS_SUPPLY } from '../../utils/config';
import { formatNumber } from '../../utils/utils';

const { DENOM_CYBER, DENOM_CYBER_G } = CYBER;

const Statistics = ({ atomLeff, price, discount, time }) => (
  <ContainerCard styles={{ alignItems: 'center', gridGap: '20px' }} col="3">
    <Card
      tooltipValue="The time left untill the end of the donations, in the case where less than 600000 ATOMs are donated"
      positionTooltip="bottom"
      title="Donations ends"
      value={time}
    />
    <Card
      title="ATOM/GCYB"
      value={formatNumber(Math.floor(price * 1000) / 1000)}
      positionTooltip="bottom"
      tooltipValue="The current ATOM/GCYBs price. 1 Giga CYB = 1,000,000,000 CYB. Calculated as a relation between the won CYBs and accumulated ATOMs. This price excludes the order of donation advantages."
    />
    <Card
      title="GCYB left"
      value={atomLeff}
      positionTooltip="bottom"
      tooltipValue="The accumulated ATOMs left before the end of the donations, in the case where less than 90 days pass from the start"
    />
  </ContainerCard>
);

export default Statistics;
