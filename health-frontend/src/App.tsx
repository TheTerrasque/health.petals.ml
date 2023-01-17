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
    <div className="App">
      <h1>Petals server status</h1>
      {!health && <div>Loading...</div>}
      {health && <Bootstrap servers={health.bootstrap_servers} />}
      {health && health.models.map((model)=>  <Model model={model} key={model.name} />)}
    </div>
  );
}

export default App;
