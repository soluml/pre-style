import css from 'pre-style';
import logo from './logo.svg';
import Test from './Test';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit{' '}
          <code
            className={css`
              color: red;
            `}
          >
            src/App.js
          </code>{' '}
          and save to reload.
        </p>
        <Test />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
