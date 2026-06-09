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
  exactName?: string;
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

interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    is_day: number;
  };
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
  const [user] = useState<any>(() => {
    const storedUser = localStorage.getItem('@CrudMundo:user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
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
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    exactName: '', // Nome oficial verificado
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
    const token = localStorage.getItem('@CrudMundo:token');

    if (!user || !token) {
      navigate('/');
      return;
    }

    loadData();
  }, [navigate, loadData, user]);

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

  const fetchExternalCountry = useCallback(async (name: string, exact?: string) => {
    setApiLoading(true);
    try {
      let response;
      if (exact) {
        // Se temos o nome exato (em inglês), usamos a busca por texto completo
        response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(exact)}?fullText=true`);
      } else {
        // Se não temos o nome exato, usamos o endpoint de tradução que é mais robusto para inputs em PT-BR
        // e tentamos encontrar a melhor correspondência nos resultados
        response = await axios.get(`https://restcountries.com/v3.1/translation/${encodeURIComponent(name)}`);
        
        if (response.data && response.data.length > 1) {
          // Se houver mais de um resultado (ex: Estados Unidos -> México e USA)
          // Filtramos pelo nome comum ou tradução que bata exatamente com o que o usuário digitou
          const bestMatch = response.data.find((c: any) => {
            const commonName = c.name.common.toLowerCase();
            const portugueseName = c.translations?.por?.common?.toLowerCase();
            const inputName = name.toLowerCase();
            return commonName === inputName || portugueseName === inputName;
          });
          
          if (bestMatch) {
            setExternalCountry(bestMatch);
            setApiLoading(false);
            return;
          }
        }
      }

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
      fetchExternalCountry(selectedCountry.name, selectedCountry.exactName);
    } else {
      setExternalCountry(null);
    }
  }, [selectedCountry, fetchExternalCountry]);

  const fetchWeather = useCallback(async (city: City) => {
    if (!city.latitude || !city.longitude) {
      console.warn(`Cidade ${city.name} sem coordenadas. Clima não disponível.`);
      setWeather(null);
      return;
    }

    setApiLoading(true);
    setWeather(null);

    try {
      // Open-Meteo não precisa de API Key!
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&timezone=auto`;
      
      console.log(`Buscando clima (Open-Meteo) para ${city.name}:`, { lat: city.latitude, lon: city.longitude });
      const response = await axios.get(url);
      console.log('Resposta da Open-Meteo:', response.data);
      setWeather(response.data);
    } catch (err: any) {
      console.error('Erro na Open-Meteo API:', err.message);
      setWeather(null);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Função auxiliar para traduzir códigos da Open-Meteo para ícones/descrições
  const getWeatherInfo = (code: number) => {
    const table: Record<number, { desc: string, icon: string }> = {
      0: { desc: 'Céu Limpo', icon: '01d' },
      1: { desc: 'Principalmente Limpo', icon: '02d' },
      2: { desc: 'Parcialmente Nublado', icon: '03d' },
      3: { desc: 'Encoberto', icon: '04d' },
      45: { desc: 'Nevoeiro', icon: '50d' },
      48: { desc: 'Nevoeiro com Geada', icon: '50d' },
      51: { desc: 'Drizzle Leve', icon: '09d' },
      61: { desc: 'Chuva Leve', icon: '10d' },
      63: { desc: 'Chuva Moderada', icon: '10d' },
      80: { desc: 'Pancadas de Chuva', icon: '09d' },
      95: { desc: 'Trovoada', icon: '11d' },
    };
    return table[code] || { desc: 'Desconhecido', icon: '03d' };
  };

  useEffect(() => {
    if (selectedCity) {
      fetchWeather(selectedCity);
    } else {
      setWeather(null);
    }
  }, [selectedCity, fetchWeather]);

  const verifyCountryWithGroq = async (name: string, continent: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      console.warn('Groq API Key não encontrada no .env');
      return name;
    }

    try {
      console.log('Consultando Groq para:', { name, continent });
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em geografia. Sua tarefa é receber o nome de um país e o continente dele, e retornar APENAS o nome comum desse país em INGLÊS que seja reconhecido pela API restcountries.com. Não explique nada, retorne apenas o nome. Exemplo: "Estados Unidos" na "América" -> "United States".'
            },
            {
              role: 'user',
              content: `País: ${name}, Continente: ${continent}`
            }
          ],
          temperature: 0,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const verifiedName = response.data.choices[0].message.content.trim().replace(/[".]/g, '');
      console.log('Resposta do Groq (Nome Verificado):', verifiedName);
      return verifiedName;
    } catch (err: any) {
      console.error('Erro na requisição ao Groq:', err.response?.data || err.message);
      return name;
    }
  };

  const handleAutoFillCountry = async () => {
    const countryName = formData.name;
    const continentName = selectedContinent?.name;

    if (!countryName || !continentName) {
      setError('Digite o nome do país e selecione o continente primeiro.');
      return;
    }

    setApiLoading(true);
    setError('');
    try {
      // 1. Groq valida o nome
      const verifiedName = await verifyCountryWithGroq(countryName, continentName);
      
      // 2. Busca na RestCountries com o nome exato
      // Usamos um try/catch interno para capturar 404 da RestCountries separadamente
      let response;
      try {
        response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(verifiedName)}?fullText=true`);
      } catch (restErr: any) {
        if (restErr.response?.status === 404) {
          setError(`País "${verifiedName}" não encontrado na API RestCountries.`);
          return;
        }
        throw restErr; // Repassa outros erros (conexão, etc.)
      }
      
      if (response && response.data && response.data.length > 0) {
        const data = response.data[0];
        const lang = data.languages ? Object.values(data.languages)[0] : '';
        const currObj = data.currencies ? Object.values(data.currencies)[0] : null;
        const curr = currObj ? (currObj as any).name : '';
        
        setFormData({
          ...formData,
          exactName: verifiedName,
          population: data.population.toString(),
          officialLanguage: lang as string,
          currency: curr as string
        });
      } else {
        setError('Nenhum dado retornado para este país.');
      }
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      setError('Erro de conexão ou falha no serviço de verificação.');
    } finally {
      setApiLoading(false);
    }
  };

  const handleAutoFillCity = async () => {
    const cityName = formData.name;
    const country = selectedCountry;

    if (!cityName || !country) {
      setError('Digite o nome da cidade e selecione o país primeiro.');
      return;
    }

    setApiLoading(true);
    setError('');

    try {
      // 1. Buscar Coordenadas via OpenStreetMap (Nominatim)
      const query = `${cityName}, ${country.name}`;
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      
      const geoRes = await axios.get(geoUrl, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' }
      });

      let lat = '';
      let lon = '';
      let population = formData.population;

      if (geoRes.data && geoRes.data.length > 0) {
        lat = geoRes.data[0].lat.toString();
        lon = geoRes.data[0].lon.toString();
      }

      // 2. Buscar População via OpenDataSoft (Geonames dataset)
      try {
        const popUrl = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&q=${encodeURIComponent(cityName)}&facet=country&refine.country=${encodeURIComponent(country.name)}`;
        const popRes = await axios.get(popUrl);
        
        if (popRes.data.records && popRes.data.records.length > 0) {
          // Pega a população do registro mais relevante
          const cityData = popRes.data.records[0].fields;
          population = cityData.population.toString();
          
          // Se o OSM falhou mas o Geonames tem coordenadas, usamos as do Geonames
          if (!lat && cityData.coordinates) {
            lat = cityData.coordinates[0].toString();
            lon = cityData.coordinates[1].toString();
          }
        }
      } catch (popErr) {
        console.warn('Não foi possível obter a população, mantendo apenas coordenadas.', popErr);
      }

      if (lat || population !== formData.population) {
        setFormData({
          ...formData,
          latitude: lat || formData.latitude,
          longitude: lon || formData.longitude,
          population: population
        });
      } else {
        setError('Cidade não encontrada nas bases de dados.');
      }
    } catch (err) {
      console.error('Erro ao buscar dados da cidade via OSM:', err);
      setError('Erro ao consultar a API do OpenStreetMap.');
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
        data.exactName = formData.exactName;
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
        data.exactName = formData.exactName;
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
      exactName: (activeItem as Country).exactName || '',
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
      exactName: '',
      description: '',
      population: '',
      officialLanguage: '',
      currency: '',
      latitude: '',
      longitude: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '24px', backgroundColor: '#f8faff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #e1e8ed', paddingBottom: '16px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50', fontWeight: 700, letterSpacing: '-0.5px' }}>CrudMundo <span style={{ color: '#4a90e2', fontWeight: 400 }}>Explorer</span></h2>
        <div>
          <span style={{ marginRight: '16px', color: '#7f8c8d' }}>Olá, <strong style={{ color: '#2c3e50' }}>{user?.name}</strong></span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #e1e8ed', color: '#e74c3c', fontWeight: 500 }}>Sair</button>
        </div>
      </header>

      <div style={{ border: 'none', borderRadius: '16px', padding: '24px', marginBottom: '24px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          {selectedContinent && (
            <button 
              onClick={handleBack} 
              style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0f4f8', border: 'none', color: '#4a90e2', borderRadius: '8px', fontWeight: 600 }}
            >
              ← Voltar
            </button>
          )}
          <h3 style={{ margin: 0, color: '#34495e', fontSize: '1.25rem' }}>Navegação Geográfica</h3>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f8c8d' }}>CONTINENTE</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={selectedContinent?.id || ''} 
                onChange={(e) => {
                  const item = continents.find(c => c.id === e.target.value);
                  setSelectedContinent(item || null);
                  setSelectedCountry(null);
                  setSelectedState(null);
                  setSelectedCity(null);
                }}
                style={{ padding: '10px', minWidth: '180px', backgroundColor: '#fff' }}
              >
                <option value="">Selecione...</option>
                {continents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => startAdd('continent')} style={{ backgroundColor: '#4a90e2', color: '#fff', border: 'none', padding: '0 12px', fontSize: '1.2rem' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: selectedContinent ? 1 : 0.5 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f8c8d' }}>PAÍS</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                disabled={!selectedContinent}
                value={selectedCountry?.id || ''} 
                onChange={(e) => {
                  const item = countries.find(c => c.id === e.target.value);
                  setSelectedCountry(item || null);
                  setSelectedState(null);
                  setSelectedCity(null);
                }}
                style={{ padding: '10px', minWidth: '180px' }}
              >
                <option value="">Selecione...</option>
                {filteredCountries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button disabled={!selectedContinent} onClick={() => startAdd('country')} style={{ backgroundColor: '#4a90e2', color: '#fff', border: 'none', padding: '0 12px', fontSize: '1.2rem' }}>+</button>
            </div>
          </div>

          {selectedCountry && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f8c8d' }}>ESTADO</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {hasStates ? (
                  <select 
                    value={selectedState?.id || ''} 
                    onChange={(e) => {
                      const item = states.find(s => s.id === e.target.value);
                      setSelectedState(item || null);
                      setSelectedCity(null);
                    }}
                    style={{ padding: '10px', minWidth: '180px' }}
                  >
                    <option value="">Selecione...</option>
                    {filteredStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <span style={{ padding: '10px', color: '#bdc3c7', fontSize: '0.9rem' }}>Nenhum estado</span>
                )}
                <button onClick={() => startAdd('state')} style={{ backgroundColor: '#4a90e2', color: '#fff', border: 'none', padding: '0 12px', fontSize: '1.2rem' }}>+</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: selectedCountry ? 1 : 0.5 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f8c8d' }}>CIDADE</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                disabled={!selectedCountry}
                value={selectedCity?.id || ''} 
                onChange={(e) => {
                  const item = cities.find(c => c.id === e.target.value);
                  setSelectedCity(item || null);
                }}
                style={{ padding: '10px', minWidth: '180px' }}
              >
                <option value="">Selecione...</option>
                {filteredCitiesDropdown.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button disabled={!selectedCountry} onClick={() => startAdd('city')} style={{ backgroundColor: '#4a90e2', color: '#fff', border: 'none', padding: '0 12px', fontSize: '1.2rem' }}>+</button>
            </div>
          </div>
        </div>

        {isAdding && (
          <div style={{ marginTop: '24px', padding: '24px', border: '1px solid #e1e8ed', borderRadius: '12px', backgroundColor: '#fcfdfe' }}>
            <h4 style={{ marginTop: 0, color: '#4a90e2' }}>Adicionar Novo(a) {isAdding === 'continent' ? 'Continente' : isAdding === 'country' ? 'País' : isAdding === 'state' ? 'Estado' : 'Cidade'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              
              {isAdding === 'country' && (
                <input type="text" placeholder="Nome Exato (Inglês p/ API)" value={formData.exactName} onChange={e => setFormData({...formData, exactName: e.target.value})} />
              )}

              {isAdding === 'continent' && (
                <input type="text" placeholder="Descrição" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              )}
              
              {(isAdding === 'country' || isAdding === 'city') && (
                <input type="number" placeholder="População" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} />
              )}
              
              {isAdding === 'country' && (
                <>
                  <input type="text" placeholder="Idioma Oficial" value={formData.officialLanguage} onChange={e => setFormData({...formData, officialLanguage: e.target.value})} />
                  <input type="text" placeholder="Moeda" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} />
                  <button 
                    type="button" 
                    onClick={handleAutoFillCountry} 
                    disabled={apiLoading}
                    style={{ backgroundColor: '#f0f4f8', color: '#4a90e2', border: 'none', fontWeight: 600, padding: '10px' }}
                  >
                    {apiLoading ? 'Buscando...' : 'Auto-preencher País'}
                  </button>
                </>
              )}
              
              {isAdding === 'city' && (
                <>
                  <input type="number" step="any" placeholder="Latitude" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                  <input type="number" step="any" placeholder="Longitude" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                  <button 
                    type="button" 
                    onClick={handleAutoFillCity} 
                    disabled={apiLoading}
                    style={{ backgroundColor: '#f0f4f8', color: '#4a90e2', border: 'none', fontWeight: 600, padding: '10px' }}
                  >
                    {apiLoading ? 'Buscando...' : 'Auto-preencher Cidade'}
                  </button>
                </>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button onClick={handleCreate} style={{ padding: '10px 24px', backgroundColor: '#4a90e2', color: '#fff', border: 'none', fontWeight: 600 }}>Salvar</button>
              <button onClick={() => setIsAdding(null)} style={{ padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid #e1e8ed', color: '#7f8c8d' }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ border: 'none', borderRadius: '16px', padding: '24px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #f0f4f8', paddingBottom: '16px', color: '#34495e' }}>Detalhes do Local</h3>
        
        {loading ? (
          <p style={{ color: '#4a90e2' }}>Carregando dados...</p>
        ) : activeItem ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#bdc3c7', display: 'block', marginBottom: '4px' }}>TIPO</label>
                <span style={{ fontWeight: 600, color: '#4a90e2' }}>{activeType?.toUpperCase()}</span>
              </div>
              
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#bdc3c7', display: 'block', marginBottom: '4px' }}>NOME</label>
                {isEditing ? (
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%' }} />
                ) : <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeItem.name}</span>}
              </div>
              
              {activeType === 'Continente' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#bdc3c7', display: 'block', marginBottom: '4px' }}>DESCRIÇÃO</label>
                  {isEditing ? (
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', minHeight: '80px' }} />
                  ) : <p style={{ margin: 0, lineHeight: 1.6 }}>{(selectedContinent as Continent).description || 'Sem descrição.'}</p>}
                </div>
              )}

              {activeType === 'País' && (
                <>
                  {externalCountry && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '12px', border: '1px solid #d0e7ff', marginBottom: '16px' }}>
                      <img src={externalCountry.flags.svg} alt="Bandeira" style={{ width: '120px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', flex: 1 }}>
                        <div><strong>Capital:</strong><br/>{externalCountry.capital?.[0] || 'N/A'}</div>
                        <div><strong>Área:</strong><br/>{externalCountry.area.toLocaleString()} km²</div>
                        <div><strong>População:</strong><br/>{externalCountry.population.toLocaleString()}</div>
                        <div><strong>Idiomas:</strong><br/>{externalCountry.languages ? Object.values(externalCountry.languages).join(', ') : 'N/A'}</div>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <>
                      <div><strong>População (DB):</strong><br/>{selectedCountry?.population?.toLocaleString() || 'N/A'}</div>
                      <div><strong>Idioma (DB):</strong><br/>{selectedCountry?.officialLanguage || 'N/A'}</div>
                      <div><strong>Moeda (DB):</strong><br/>{selectedCountry?.currency || 'N/A'}</div>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <div><label>População:</label><input type="number" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} style={{ width: '100%' }} /></div>
                      <div><label>Idioma:</label><input type="text" value={formData.officialLanguage} onChange={e => setFormData({...formData, officialLanguage: e.target.value})} style={{ width: '100%' }} /></div>
                      <div><label>Moeda:</label><input type="text" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ width: '100%' }} /></div>
                      <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                        <button onClick={handleAutoFillCountry} disabled={apiLoading} style={{ backgroundColor: '#f0f4f8', color: '#4a90e2', border: 'none', padding: '8px 16px', fontWeight: 600 }}>Recarregar via API</button>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeType === 'Cidade' && (
                <>
                  {apiLoading && !weather && (
                    <div style={{ gridColumn: '1 / -1', padding: '16px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#4a90e2' }}>
                      Buscando informações climáticas...
                    </div>
                  )}

                  {weather && (
                    <div style={{ 
                      gridColumn: '1 / -1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '24px', 
                      backgroundColor: '#eef6ff', 
                      padding: '24px', 
                      borderRadius: '16px', 
                      border: '1px solid #bcdbff', 
                      marginBottom: '20px',
                      boxShadow: '0 4px 12px rgba(74, 144, 226, 0.08)'
                    }}>
                      <div style={{ backgroundColor: '#4a90e2', borderRadius: '50%', padding: '8px', boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)' }}>
                        <img 
                          src={`https://openweathermap.org/img/wn/${getWeatherInfo(weather.current_weather.weathercode).icon}@2x.png`} 
                          alt="Clima" 
                          style={{ width: '64px', height: '64px' }} 
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '20px', flex: 1 }}>
                        <div>
                          <small style={{ color: '#5dade2', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>CONDIÇÃO</small>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2c3e50' }}>{getWeatherInfo(weather.current_weather.weathercode).desc}</div>
                        </div>
                        <div>
                          <small style={{ color: '#5dade2', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>TEMPERATURA</small>
                          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4a90e2' }}>{Math.round(weather.current_weather.temperature)}°C</div>
                        </div>
                        <div>
                          <small style={{ color: '#5dade2', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>VENTO</small>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{weather.current_weather.windspeed} km/h</div>
                        </div>
                        <div>
                          <small style={{ color: '#5dade2', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>PERÍODO</small>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{weather.current_weather.is_day ? '☀ Dia' : '🌙 Noite'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div><strong>População:</strong><br/>{isEditing ? (
                    <input type="number" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} style={{ width: '100%' }} />
                  ) : (selectedCity as City).population?.toLocaleString() || 'N/A'}</div>
                  <div><strong>Latitude:</strong><br/>{isEditing ? (
                    <input type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} style={{ width: '100%' }} />
                  ) : (selectedCity as City).latitude || 'N/A'}</div>
                  <div><strong>Longitude:</strong><br/>{isEditing ? (
                    <input type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} style={{ width: '100%' }} />
                  ) : (selectedCity as City).longitude || 'N/A'}</div>
                  
                  {isEditing && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                      <button onClick={handleAutoFillCity} disabled={apiLoading} style={{ backgroundColor: '#f0f4f8', color: '#4a90e2', border: 'none', padding: '8px 16px', fontWeight: 600 }}>Recarregar via API</button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {isEditing ? (
                <>
                  <button onClick={handleUpdate} style={{ padding: '12px 32px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', fontWeight: 700 }}>SALVAR ALTERAÇÕES</button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '12px 32px', backgroundColor: 'transparent', border: '1px solid #e1e8ed', color: '#7f8c8d' }}>CANCELAR</button>
                </>
              ) : (
                <>
                  <button onClick={startEdit} style={{ padding: '12px 32px', backgroundColor: '#4a90e2', color: '#fff', border: 'none', fontWeight: 700 }}>EDITAR</button>
                  <button onClick={handleDelete} style={{ padding: '12px 32px', backgroundColor: 'transparent', border: '1px solid #ff7675', color: '#d63031', fontWeight: 600 }}>EXCLUIR</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#bdc3c7', border: '2px dashed #f0f4f8', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>Selecione um local na navegação acima para visualizar ou editar os detalhes.</p>
          </div>
        )}
      </div>

      {activeItem && children && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {children.subCountries.length > 0 && (
            <div style={{ border: 'none', borderRadius: '16px', padding: '24px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <h4 style={{ marginTop: 0, color: '#34495e', marginBottom: '20px' }}>Países em {activeItem.name}</h4>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', padding: 0, listStyle: 'none' }}>
                {children.subCountries.map(c => (
                  <li key={c.id} style={{ padding: '16px', border: '1px solid #f0f4f8', borderRadius: '12px', backgroundColor: '#fff', transition: 'all 0.2s ease' }}>
                    <div style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '4px' }}>{c.name}</div>
                    <small style={{ color: '#7f8c8d' }}>População: {c.population?.toLocaleString() || '-'}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {children.subCities.length > 0 && (
            <div style={{ border: 'none', borderRadius: '16px', padding: '24px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <h4 style={{ marginTop: 0, color: '#34495e', marginBottom: '20px' }}>Cidades em {activeItem.name}</h4>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', padding: 0, listStyle: 'none' }}>
                {children.subCities.map(c => (
                  <li key={c.id} style={{ padding: '16px', border: '1px solid #f0f4f8', borderRadius: '12px', backgroundColor: '#fff' }}>
                    <div style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '4px' }}>{c.name}</div>
                    <small style={{ color: '#7f8c8d' }}>População: {c.population?.toLocaleString() || '-'}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', color: '#fff', padding: '16px 24px', borderRadius: '12px', backgroundColor: '#e74c3c', boxShadow: '0 8px 24px rgba(231, 76, 60, 0.25)', fontWeight: 600 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
