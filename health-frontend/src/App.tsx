import React, { useEffect, useState } from 'react';
import './App.css';
import { IHealth } from './interfaces/IHealth';
import { Bootstrap } from './components/bootstrap';
import { Model } from './components/model';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

function App() {
  const apiUrl = process.env.REACT_APP_API_URL_DEVELOPMENT || '/health.json';
  const [health, setHealth] = useState<IHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  function loadHealth() {
    setLoading(true);
    setError(null);

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => { setHealth(data); setLoading(false); })
      .catch(error => {
        console.error(error)
        console.error(apiUrl)
        setError(error)
        alert("Error fetching health data from server. Please check the server logs.\n\n" + error)
      });
  }

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="containery">
      <div>
        <header>
          <div className="logo">
            <a target="_blank" href="https://petals.ml"><img src="https://petals.ml/logo.svg" height="50" className="rot-image" /></a>
          </div>
          <h1>Petals <span className='hmtext'>Health Monitor</span></h1>
        </header>
      </div>
      {loading && <div className="loading">Fetching fresh data...</div>}
      {!loading && health && <div className="notLoading">
          Data updated at {moment(health.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          <FontAwesomeIcon icon={faSync} onClick={loadHealth} className="reloadButton" />
        </div>
      }
      {error && <div className="error">Error getting status: <span className='error-text'>{error}</span></div>}
      {!health && <div className='no-data'>No data to display yet</div>}
      <div className='section-bootstrap'>
        {health && <Bootstrap servers={health.bootstrap_servers} />}
      </div>
      <div className='section-models'>
        {health && health.models.map((model) => <Model model={model} key={model.name} />)}
      </div>
    </div>
  );
}

export default App;
