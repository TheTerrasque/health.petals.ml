import React, { useEffect, useState } from 'react';
import './App.css';
import { IHealth } from './interfaces/IHealth';
import { Bootstrap } from './components/bootstrap';
import { Model } from './components/model';

function App() {
  const apiUrl = process.env.REACT_APP_API_URL_DEVELOPMENT || '/health.json';
  const [health, setHealth] = useState<IHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(null); 

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => { setHealth(data); setLoading(false); })
      .catch(error => {
        console.error(error)
        setError(error)
        alert("Error fetching health data from server. Please check the server logs.\n\n" + error)
      });
  }, []);

  return (
    <div className="containery">
      <div className='row gy-5'>
        <a target="_blank" href="https://petals.ml"><img src="https://petals.ml/logo.svg" height="50" className="rot-image" /></a>
        <h1>Petals server status</h1>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div>Error getting status: {error}</div>}
      <div className='row gy-5'>
        {health && <Bootstrap servers={health.bootstrap_servers} />}
      </div>
      <div className='row gy-5'>
        {health && health.models.map((model) => <Model model={model} key={model.name} />)}
      </div>
    </div>
  );
}

export default App;
