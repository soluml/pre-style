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
        `
      },
    };

    return (
      <main {...attrs.main}>I'm an example!</main>
    );
  }
}

Wrapper.propTypes = {
};


export default connect(mapStateToProps, mapDispatchToProps)(Wrapper);
