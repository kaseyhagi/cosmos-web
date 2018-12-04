import React from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Home from './components/Home';
import Orbit from './components/Orbit';
import Attitude from './components/Attitude';
import Plot from './components/Plot';
import Path from './components/Path';
import DataPlot from './components/DataPlot';
import AgentList from './components/Cosmos/AgentList';

const App = ({}) => (
  <div>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/orbit" component={Orbit} />
        <Route exact path="/attitude" component={Attitude} />
        <Route exact path="/plot" component={Plot} />
        <Route exact path="/path" component={Path} />
        <Route exact path="/dataplot" component={DataPlot} />
        <Route exact path="/agentlist" component={AgentList} />
      </Switch>
    </Router>
  </div>
);

export default App;
