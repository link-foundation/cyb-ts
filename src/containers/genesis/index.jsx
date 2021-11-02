import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import Iframe from 'react-iframe';
import Timer from './timer';

function Genesis({ block }) {
  const time = true;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div>{block}</div>
      {time ? (
        <Timer />
      ) : (
        <Iframe
          width="100%"
          height="100%"
          id="iframeCid"
          className="iframe-SearchItem"
          src="http://127.0.0.1:8080/ipfs/QmadZMMwcAkgwVQ5vd6bbRpSQo1NVe9ihmsdYc8HwJhSLu/"
        />
      )}
    </div>
  );
}

const mapStateToProps = (store) => {
  return {
    block: store.block.block,
  };
};

export default connect(mapStateToProps)(Genesis);
// export default Genesis;
