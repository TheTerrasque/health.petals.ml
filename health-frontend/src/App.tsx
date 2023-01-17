import React, { useEffect, useState } from 'react';
import './App.css';
import { IHealth } from './interfaces/IHealth';
import { Bootstrap } from './components/bootstrap';
import { Model } from './components/model';

function App() {
  // get health from backend via ajax:

  const [health, setHealth] = useState<IHealth | null>(null);
  useEffect(() => {
    fetch('http://localhost:5990/health.json')
      .then(response => response.json())
      .then(data => setHealth(data));
  }, []);

  return (
    <div className="containery">
      <div className='row gy-5'>
        <a target="_blank" href="https://petals.ml"><img src="https://petals.ml/logo.svg" height="50" className="rot-image" /></a>
        <h1>Petals server status</h1>
      </div>
      {!health && <div>Loading...</div>}
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
