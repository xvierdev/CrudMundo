import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Continent {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  continentId: string;
}

interface State {
  id: string;
  name: string;
  countryId: string;
}

interface City {
  id: string;
  name: string;
  stateId?: string | null;
  countryId: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Data lists
  const [continents, setContinents] = useState<Continent[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Selections
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState<'continent' | 'country' | 'state' | 'city' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');

  const handleLogout = useCallback(() => {
    localStorage.removeItem('@CrudMundo:token');
    localStorage.removeItem('@CrudMundo:user');
    navigate('/');
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contRes, countRes, stateRes, cityRes] = await Promise.all([
        api.get('/continents'),
        api.get('/countries'),
        api.get('/states'),
        api.get('/cities'),
      ]);
      setContinents(contRes.data);
      setCountries(countRes.data);
      setStates(stateRes.data);
      setCities(cityRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError('Erro ao carregar dados do servidor.');
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const storedUser = localStorage.getItem('@CrudMundo:user');
    const token = localStorage.getItem('@CrudMundo:token');

    if (!storedUser || !token) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(storedUser));
    loadData();
  }, [navigate, loadData]);

  // Derived filtered lists
  const filteredCountries = countries.filter(c => c.continentId === selectedContinent?.id);
  const filteredStates = states.filter(s => s.countryId === selectedCountry?.id);
  const hasStates = filteredStates.length > 0;
  const filteredCities = cities.filter(c => {
    if (selectedState) return c.stateId === selectedState.id;
    if (selectedCountry) return c.countryId === selectedCountry.id && !c.stateId;
    return false;
  });

  const activeItem = selectedCity || selectedState || selectedCountry || selectedContinent;
  const activeType = selectedCity ? 'Cidade' : selectedState ? 'Estado' : selectedCountry ? 'País' : selectedContinent ? 'Continente' : null;

  const handleBack = () => {
    if (selectedCity) setSelectedCity(null);
    else if (selectedState) setSelectedState(null);
    else if (selectedCountry) setSelectedCountry(null);
    else if (selectedContinent) setSelectedContinent(null);
    
    setIsEditing(false);
    setIsAdding(null);
    setError('');
  };

  const handleCreate = async () => {
    if (!formName) return;
    setError('');
    try {
      let endpoint = '';
      let data: any = { name: formName };

      if (isAdding === 'continent') {
        endpoint = '/continents';
      } else if (isAdding === 'country') {
        endpoint = '/countries';
        data.continentId = selectedContinent?.id;
      } else if (isAdding === 'state') {
        endpoint = '/states';
        data.countryId = selectedCountry?.id;
      } else if (isAdding === 'city') {
        endpoint = '/cities';
        data.countryId = selectedCountry?.id;
        data.stateId = selectedState?.id || null;
      }

      await api.post(endpoint, data);
      setFormName('');
      setIsAdding(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar item.');
    }
  };

  const handleUpdate = async () => {
    if (!formName || !activeItem) return;
    setError('');
    try {
      let endpoint = '';
      let data: any = { name: formName };

      if (selectedCity) {
        endpoint = `/cities/${selectedCity.id}`;
        data.countryId = selectedCity.countryId;
        data.stateId = selectedCity.stateId;
      }
      else if (selectedState) {
        endpoint = `/states/${selectedState.id}`;
        data.countryId = selectedState.countryId;
      }
      else if (selectedCountry) {
        endpoint = `/countries/${selectedCountry.id}`;
        data.continentId = selectedCountry.continentId;
      }
      else if (selectedContinent) {
        endpoint = `/continents/${selectedContinent.id}`;
      }

      await api.put(endpoint, data);
      setIsEditing(false);
      setFormName('');
      await loadData();
      
      // Update selected reference locally
      if (selectedCity) setSelectedCity({ ...selectedCity, name: formName });
      else if (selectedState) setSelectedState({ ...selectedState, name: formName });
      else if (selectedCountry) setSelectedCountry({ ...selectedCountry, name: formName });
      else if (selectedContinent) setSelectedContinent({ ...selectedContinent, name: formName });

    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar item.');
    }
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    if (!window.confirm(`Deseja realmente excluir ${activeType}: ${activeItem.name}?`)) return;

    setError('');
    try {
      let endpoint = '';
      if (selectedCity) endpoint = `/cities/${selectedCity.id}`;
      else if (selectedState) endpoint = `/states/${selectedState.id}`;
      else if (selectedCountry) endpoint = `/countries/${selectedCountry.id}`;
      else if (selectedContinent) endpoint = `/continents/${selectedContinent.id}`;

      await api.delete(endpoint);
      
      // Clear selection
      if (selectedCity) setSelectedCity(null);
      else if (selectedState) setSelectedState(null);
      else if (selectedCountry) setSelectedCountry(null);
      else if (selectedContinent) setSelectedContinent(null);

      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir item.');
    }
  };

  const startEdit = () => {
    if (!activeItem) return;
    setFormName(activeItem.name);
    setIsEditing(true);
    setIsAdding(null);
  };

  const startAdd = (type: 'continent' | 'country' | 'state' | 'city') => {
    setIsAdding(type);
    setIsEditing(false);
    setFormName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>CrudMundo - Explorer</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Olá, <strong>{user?.name}</strong></span>
          <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>Sair</button>
        </div>
      </header>

      {/* Quadrante Superior: Seleção */}
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={handleBack} 
            disabled={!selectedContinent}
            style={{ padding: '8px 15px', cursor: 'pointer', display: selectedContinent ? 'block' : 'none' }}
          >
            ← Voltar
          </button>
          <h3 style={{ margin: 0 }}>Filtros</h3>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Continente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>Continente:</label>
            <select 
              value={selectedContinent?.id || ''} 
              onChange={(e) => {
                const item = continents.find(c => c.id === e.target.value);
                setSelectedContinent(item || null);
                setSelectedCountry(null);
                setSelectedState(null);
                setSelectedCity(null);
              }}
              style={{ padding: '5px', minWidth: '150px' }}
            >
              <option value="">Selecione...</option>
              {continents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => startAdd('continent')} style={{ cursor: 'pointer' }}>+</button>
          </div>

          {/* País */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: selectedContinent ? 1 : 0.5 }}>
            <label>País:</label>
            <select 
              disabled={!selectedContinent}
              value={selectedCountry?.id || ''} 
              onChange={(e) => {
                const item = countries.find(c => c.id === e.target.value);
                setSelectedCountry(item || null);
                setSelectedState(null);
                setSelectedCity(null);
              }}
              style={{ padding: '5px', minWidth: '150px' }}
            >
              <option value="">Selecione...</option>
              {filteredCountries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button disabled={!selectedContinent} onClick={() => startAdd('country')} style={{ cursor: 'pointer' }}>+</button>
          </div>

          {/* Estado */}
          {selectedCountry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <label>Estado:</label>
              {hasStates ? (
                <select 
                  value={selectedState?.id || ''} 
                  onChange={(e) => {
                    const item = states.find(s => s.id === e.target.value);
                    setSelectedState(item || null);
                    setSelectedCity(null);
                  }}
                  style={{ padding: '5px', minWidth: '150px' }}
                >
                  <option value="">Selecione...</option>
                  {filteredStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <span style={{ color: '#888', fontSize: '0.9em' }}>N/A</span>
              )}
              <button onClick={() => startAdd('state')} style={{ cursor: 'pointer' }} title="Adicionar Estado">+</button>
            </div>
          )}

          {/* Cidade */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: selectedCountry ? 1 : 0.5 }}>
            <label>Cidade:</label>
            <select 
              disabled={!selectedCountry}
              value={selectedCity?.id || ''} 
              onChange={(e) => {
                const item = cities.find(c => c.id === e.target.value);
                setSelectedCity(item || null);
              }}
              style={{ padding: '5px', minWidth: '150px' }}
            >
              <option value="">Selecione...</option>
              {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button disabled={!selectedCountry} onClick={() => startAdd('city')} style={{ cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {isAdding && (
          <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed blue', borderRadius: '5px' }}>
            <h4>Adicionar Novo(a) {isAdding === 'continent' ? 'Continente' : isAdding === 'country' ? 'País' : isAdding === 'state' ? 'Estado' : 'Cidade'}</h4>
            <input 
              type="text" 
              value={formName} 
              onChange={(e) => setFormName(e.target.value)} 
              placeholder="Nome"
              style={{ padding: '5px', marginRight: '10px' }}
            />
            <button onClick={handleCreate} style={{ padding: '5px 15px', backgroundColor: '#e7f3ff', cursor: 'pointer' }}>Salvar</button>
            <button onClick={() => setIsAdding(null)} style={{ padding: '5px 15px', marginLeft: '5px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        )}
      </div>

      {/* Quadrante Inferior: Informações */}
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalhes do Local</h3>
        
        {loading ? (
          <p>Carregando...</p>
        ) : activeItem ? (
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Tipo:</strong> {activeType}</p>
              <p><strong>Nome:</strong> {isEditing ? (
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  style={{ padding: '5px' }}
                />
              ) : activeItem.name}</p>
              <p><strong>ID:</strong> {activeItem.id}</p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              {isEditing ? (
                <>
                  <button onClick={handleUpdate} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar Alterações</button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', cursor: 'pointer' }}>Cancelar</button>
                </>
              ) : (
                <>
                  <button onClick={startEdit} style={{ padding: '10px 20px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                  <button onClick={handleDelete} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Selecione um local no painel superior para ver detalhes.</p>
        )}

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Dashboard;
