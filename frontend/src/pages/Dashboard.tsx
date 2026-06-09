import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

interface Continent {
  id: string;
  name: string;
  description?: string;
}

interface Country {
  id: string;
  name: string;
  continentId: string;
  population?: number;
  officialLanguage?: string;
  currency?: string;
}

interface ExternalCountryData {
  flags: { svg: string };
  capital?: string[];
  area: number;
  population: number;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol: string }>;
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
  population?: number;
  latitude?: number;
  longitude?: number;
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
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState<'continent' | 'country' | 'state' | 'city' | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // External Data
  const [externalCountry, setExternalCountry] = useState<ExternalCountryData | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    population: '',
    officialLanguage: '',
    currency: '',
    latitude: '',
    longitude: ''
  });

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
  
  // Logic for children listing in sub-containers
  const getChildrenData = () => {
    if (selectedCity) return null; // No children for city
    
    let subCountries: Country[] = [];
    let subStates: State[] = [];
    let subCities: City[] = [];

    if (selectedState) {
      subCities = cities.filter(c => c.stateId === selectedState.id);
    } else if (selectedCountry) {
      subStates = states.filter(s => s.countryId === selectedCountry.id);
      subCities = cities.filter(c => c.countryId === selectedCountry.id);
    } else if (selectedContinent) {
      subCountries = countries.filter(c => c.continentId === selectedContinent.id);
      const countryIds = subCountries.map(c => c.id);
      subStates = states.filter(s => countryIds.includes(s.countryId));
      subCities = cities.filter(c => countryIds.includes(c.countryId));
    }

    return { subCountries, subStates, subCities };
  };

  const children = getChildrenData();

  const filteredCitiesDropdown = cities.filter(c => {
    if (selectedState) return c.stateId === selectedState.id;
    if (selectedCountry) return c.countryId === selectedCountry.id && !c.stateId;
    return false;
  });

  const activeItem = selectedCity || selectedState || selectedCountry || selectedContinent;
  const activeType = selectedCity ? 'Cidade' : selectedState ? 'Estado' : selectedCountry ? 'País' : selectedContinent ? 'Continente' : null;

  const fetchExternalCountry = useCallback(async (name: string) => {
    setApiLoading(true);
    try {
      const response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`);
      if (response.data && response.data.length > 0) {
        setExternalCountry(response.data[0]);
      } else {
        setExternalCountry(null);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da API externa', err);
      setExternalCountry(null);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchExternalCountry(selectedCountry.name);
    } else {
      setExternalCountry(null);
    }
  }, [selectedCountry, fetchExternalCountry]);

  const handleAutoFillCountry = async () => {
    if (!formData.name) {
      setError('Digite o nome do país primeiro para buscar os dados.');
      return;
    }
    setApiLoading(true);
    setError('');
    try {
      const response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(formData.name)}`);
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        const lang = data.languages ? Object.values(data.languages)[0] : '';
        const curr = data.currencies ? Object.values(data.currencies)[0].name : '';
        
        setFormData({
          ...formData,
          population: data.population.toString(),
          officialLanguage: lang as string,
          currency: curr as string
        });
      } else {
        setError('País não encontrado na API externa.');
      }
    } catch (err) {
      setError('Erro ao buscar dados para preenchimento automático.');
    } finally {
      setApiLoading(false);
    }
  };

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
    if (!formData.name) return;
    setError('');
    try {
      let endpoint = '';
      let data: any = { name: formData.name };

      if (isAdding === 'continent') {
        endpoint = '/continents';
        data.description = formData.description;
      } else if (isAdding === 'country') {
        endpoint = '/countries';
        data.continentId = selectedContinent?.id;
        data.population = formData.population;
        data.officialLanguage = formData.officialLanguage;
        data.currency = formData.currency;
      } else if (isAdding === 'state') {
        endpoint = '/states';
        data.countryId = selectedCountry?.id;
      } else if (isAdding === 'city') {
        endpoint = '/cities';
        data.countryId = selectedCountry?.id;
        data.stateId = selectedState?.id || null;
        data.population = formData.population;
        data.latitude = formData.latitude;
        data.longitude = formData.longitude;
      }

      await api.post(endpoint, data);
      resetForm();
      setIsAdding(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar item.');
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !activeItem) return;
    setError('');
    try {
      let endpoint = '';
      let data: any = { name: formData.name };

      if (selectedCity) {
        endpoint = `/cities/${selectedCity.id}`;
        data.countryId = selectedCity.countryId;
        data.stateId = selectedCity.stateId;
        data.population = formData.population;
        data.latitude = formData.latitude;
        data.longitude = formData.longitude;
      }
      else if (selectedState) {
        endpoint = `/states/${selectedState.id}`;
        data.countryId = selectedState.countryId;
      }
      else if (selectedCountry) {
        endpoint = `/countries/${selectedCountry.id}`;
        data.continentId = selectedCountry.continentId;
        data.population = formData.population;
        data.officialLanguage = formData.officialLanguage;
        data.currency = formData.currency;
      }
      else if (selectedContinent) {
        endpoint = `/continents/${selectedContinent.id}`;
        data.description = formData.description;
      }

      await api.put(endpoint, data);
      setIsEditing(false);
      resetForm();
      await loadData();
      
      // Re-sync local selection
      const updatedItemRes = await api.get(endpoint);
      if (selectedCity) setSelectedCity(updatedItemRes.data);
      else if (selectedState) setSelectedState(updatedItemRes.data);
      else if (selectedCountry) setSelectedCountry(updatedItemRes.data);
      else if (selectedContinent) setSelectedContinent(updatedItemRes.data);

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
    setFormData({
      name: activeItem.name,
      description: (activeItem as Continent).description || '',
      population: (activeItem as any).population?.toString() || '',
      officialLanguage: (activeItem as Country).officialLanguage || '',
      currency: (activeItem as Country).currency || '',
      latitude: (activeItem as City).latitude?.toString() || '',
      longitude: (activeItem as City).longitude?.toString() || '',
    });
    setIsEditing(true);
    setIsAdding(null);
  };

  const startAdd = (type: 'continent' | 'country' | 'state' | 'city') => {
    setIsAdding(type);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      population: '',
      officialLanguage: '',
      currency: '',
      latitude: '',
      longitude: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>CrudMundo - Explorer Pro</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Olá, <strong>{user?.name}</strong></span>
          <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>Sair</button>
        </div>
      </header>

      {/* Quadrante Superior: Seleção */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '10px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={handleBack} 
            disabled={!selectedContinent}
            style={{ padding: '8px 15px', cursor: 'pointer', display: selectedContinent ? 'block' : 'none' }}
          >
            ← Voltar
          </button>
          <h3 style={{ margin: 0 }}>Navegação Geográfica</h3>
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
              {filteredCitiesDropdown.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button disabled={!selectedCountry} onClick={() => startAdd('city')} style={{ cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {isAdding && (
          <div style={{ marginTop: '20px', padding: '20px', border: '1px dashed #007bff', borderRadius: '8px', backgroundColor: '#f8fbff' }}>
            <h4 style={{ marginTop: 0 }}>Adicionar Novo(a) {isAdding === 'continent' ? 'Continente' : isAdding === 'country' ? 'País' : isAdding === 'state' ? 'Estado' : 'Cidade'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '8px' }} />
              
              {isAdding === 'continent' && (
                <input type="text" placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '8px' }} />
              )}
              
              {(isAdding === 'country' || isAdding === 'city') && (
                <input type="number" placeholder="População" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} style={{ padding: '8px' }} />
              )}
              
              {isAdding === 'country' && (
                <>
                  <input type="text" placeholder="Idioma Oficial" value={formData.officialLanguage} onChange={e => setFormData({...formData, officialLanguage: e.target.value})} style={{ padding: '8px' }} />
                  <input type="text" placeholder="Moeda" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ padding: '8px' }} />
                  <button 
                    type="button" 
                    onClick={handleAutoFillCountry} 
                    disabled={apiLoading}
                    style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    {apiLoading ? 'Buscando...' : 'Auto-preencher via API'}
                  </button>
                </>
              )}
              
              {isAdding === 'city' && (
                <>
                  <input type="number" step="any" placeholder="Latitude" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} style={{ padding: '8px' }} />
                  <input type="number" step="any" placeholder="Longitude" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} style={{ padding: '8px' }} />
                </>
              )}
            </div>
            <div style={{ marginTop: '15px' }}>
              <button onClick={handleCreate} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
              <button onClick={() => setIsAdding(null)} style={{ padding: '10px 20px', marginLeft: '10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Quadrante Inferior: Informações Principais */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalhes do Local</h3>
        
        {loading ? (
          <p>Carregando...</p>
        ) : activeItem ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div><strong>Tipo:</strong> {activeType}</div>
              <div><strong>Nome:</strong> {isEditing ? (
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '5px' }} />
              ) : activeItem.name}</div>
              
              {/* Campos dinâmicos baseados no tipo */}
              {activeType === 'Continente' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Descrição:</strong> {isEditing ? (
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '5px' }} />
                  ) : (selectedContinent as Continent).description || 'N/A'}
                </div>
              )}

              {activeType === 'País' && (
                <>
                  {externalCountry && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '8px', border: '1px solid #b8daff', marginBottom: '10px' }}>
                      <img src={externalCountry.flags.svg} alt="Bandeira" style={{ width: '100px', border: '1px solid #ccc' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                        <div><strong>Capital:</strong> {externalCountry.capital?.[0] || 'N/A'}</div>
                        <div><strong>Área:</strong> {externalCountry.area.toLocaleString()} km²</div>
                        <div><strong>População (API):</strong> {externalCountry.population.toLocaleString()}</div>
                        <div><strong>Idiomas (API):</strong> {externalCountry.languages ? Object.values(externalCountry.languages).join(', ') : 'N/A'}</div>
                        <div><strong>Moedas (API):</strong> {externalCountry.currencies ? Object.values(externalCountry.currencies).map(c => `${c.name} (${c.symbol})`).join(', ') : 'N/A'}</div>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <>
                      <div><strong>População (DB):</strong> {selectedCountry?.population?.toLocaleString() || 'N/A'}</div>
                      <div><strong>Idioma (DB):</strong> {selectedCountry?.officialLanguage || 'N/A'}</div>
                      <div><strong>Moeda (DB):</strong> {selectedCountry?.currency || 'N/A'}</div>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <div><strong>População:</strong> <input type="number" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} style={{ padding: '5px' }} /></div>
                      <div><strong>Idioma:</strong> <input type="text" value={formData.officialLanguage} onChange={e => setFormData({...formData, officialLanguage: e.target.value})} style={{ padding: '5px' }} /></div>
                      <div><strong>Moeda:</strong> <input type="text" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ padding: '5px' }} /></div>
                      <div style={{ gridColumn: '1 / -1', marginTop: '5px' }}>
                        <button 
                          type="button" 
                          onClick={handleAutoFillCountry} 
                          disabled={apiLoading}
                          style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85em' }}
                        >
                          {apiLoading ? 'Buscando...' : 'Usar API'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeType === 'Cidade' && (
                <>
                  <div><strong>População:</strong> {isEditing ? (
                    <input type="number" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} style={{ padding: '5px' }} />
                  ) : (selectedCity as City).population?.toLocaleString() || 'N/A'}</div>
                  <div><strong>Latitude:</strong> {isEditing ? (
                    <input type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} style={{ padding: '5px' }} />
                  ) : (selectedCity as City).latitude || 'N/A'}</div>
                  <div><strong>Longitude:</strong> {isEditing ? (
                    <input type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} style={{ padding: '5px' }} />
                  ) : (selectedCity as City).longitude || 'N/A'}</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {isEditing ? (
                <>
                  <button onClick={handleUpdate} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>Cancelar</button>
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
          <p style={{ color: '#666', fontStyle: 'italic' }}>Selecione um local para ver detalhes.</p>
        )}
      </div>

      {/* Containers de Listagem Adicionais */}
      {activeItem && children && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Container Países */}
          {children.subCountries.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0 }}>Países ({children.subCountries.length})</h4>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: 0, listStyle: 'none' }}>
                {children.subCountries.map(c => (
                  <li key={c.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                    <strong>{c.name}</strong><br/>
                    <small>Pop: {c.population?.toLocaleString() || '-'}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Container Estados */}
          {children.subStates.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0 }}>Estados ({children.subStates.length})</h4>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: 0, listStyle: 'none' }}>
                {children.subStates.map(s => (
                  <li key={s.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Container Cidades */}
          {children.subCities.length > 0 && (
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0 }}>Cidades ({children.subCities.length})</h4>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: 0, listStyle: 'none' }}>
                {children.subCities.map(c => (
                  <li key={c.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                    <strong>{c.name}</strong><br/>
                    <small>Pop: {c.population?.toLocaleString() || '-'}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: 'red', marginTop: '20px', padding: '10px', border: '1px solid red', borderRadius: '4px', backgroundColor: '#fff' }}>{error}</div>}
    </div>
  );
};

export default Dashboard;
