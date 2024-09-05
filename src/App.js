import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SideBar from './components/SideBar';
import PageLogin from './components/PageLogin';
import { FirewallPage, ObjetosPage, EnviosPage, ConfiguracoesPage, AjudaPage } from './router';
import '../src/App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <SideBar />} {/* Renderiza a SideBar somente se autenticado */}
        <Routes>
          <Route path="/login" element={<PageLogin setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/firewall" element={isAuthenticated ? <FirewallPage /> : <Navigate to="/login" />} />
          <Route path="/objetos" element={isAuthenticated ? <ObjetosPage /> : <Navigate to="/login" />} />
          <Route path="/tarefas" element={isAuthenticated ? <EnviosPage /> : <Navigate to="/login" />} />
          <Route path="/configuracoes" element={isAuthenticated ? <ConfiguracoesPage /> : <Navigate to="/login" />} />
          <Route path="/ajuda" element={isAuthenticated ? <AjudaPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
