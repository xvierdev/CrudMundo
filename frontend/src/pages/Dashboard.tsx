import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Continent {
  id: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [newContinentName, setNewContinentName] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('@CrudMundo:user');
    const token = localStorage.getItem('@CrudMundo:token');

    if (!storedUser || !token) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(storedUser));
    loadContinents();
  }, [navigate]);

  const loadContinents = async () => {
    try {
      const response = await api.get('/continents');
      setContinents(response.data);
    } catch (err: any) {
      setError('Erro ao carregar continentes');
    }
  };

  const handleCreateContinent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newContinentName) return;

    try {
      await api.post('/continents', { name: newContinentName });
      setNewContinentName('');
      loadContinents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar continente');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@CrudMundo:token');
    localStorage.removeItem('@CrudMundo:user');
    navigate('/');
  };

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard - CrudMundo</h1>
        <div>
          <span>Bem-vindo, {user?.name}! </span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <section style={{ marginTop: '20px' }}>
        <h2>Cadastrar Continente</h2>
        <form onSubmit={handleCreateContinent}>
          <input
            type="text"
            placeholder="Nome do continente"
            value={newContinentName}
            onChange={(e) => setNewContinentName(e.target.value)}
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <button type="submit" style={{ padding: '8px' }}>Adicionar</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      <section style={{ marginTop: '30px' }}>
        <h2>Continentes</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {continents.map((continent) => (
            <li key={continent.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
              {continent.name}
            </li>
          ))}
          {continents.length === 0 && <p>Nenhum continente cadastrado.</p>}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
