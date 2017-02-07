import React from 'react';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {
  };
}

function mapDispatchToProps(dispatch) {
  return {
  };
}

export class Wrapper extends React.Component {
  render() {
    const attrs = {
      main: {
        className: PreStyle`
          color: blue;
          text-align: center;
        `
      },
      button: {
        className: <PreStyle>
          appearance: none;
          color: blue;
        </PreStyle>
      },
    };

    return (
      <main {...attrs.main}>
        <button {...attrs.button}>I'm an example button!</button>
      </main>
    );
  }
}

Wrapper.propTypes = {
};


export default connect(mapStateToProps, mapDispatchToProps)(Wrapper);
