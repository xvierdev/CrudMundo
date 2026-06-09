# Sistema de Gerenciamento Geográfico (CrudMundo)

Este projeto é uma aplicação web completa, desenvolvida com TypeScript, para o gerenciamento de dados geográficos, incluindo continentes, países, estados e cidades. O sistema permite operações CRUD completas e integra APIs externas para enriquecer as informações exibidas.

## 🏗️ Arquitetura
- **Front-end:** React com TypeScript.
- **Back-end:** Node.js com TypeScript (Express).
- **Banco de Dados:** PostgreSQL.
- **ORM:** Prisma.

## 🚀 Funcionalidades
- **Gestão de Usuários:** Autenticação e cadastro (JWT).
- **Gestão de Continentes:** Criar, visualizar, atualizar e excluir.
- **Gestão de Países:** Vinculados a continentes, com dados de população, idioma e moeda.
- **Gestão de Estados:** Vinculados a países.
- **Gestão de Cidades:** Vinculadas a estados e países, com dados de população e coordenadas geográficas.
- **Integração com APIs Externas:**
  - Enriquecimento de dados (ex: OpenWeatherMap).
  - Inteligência Artificial (ex: GROQ API).

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v18+)
- Docker e Docker Compose

### Configuração de Ambiente
Crie os arquivos `.env` baseando-se nos `.env.example` existentes nos diretórios `/backend` e `/frontend`.

#### Variáveis Necessárias (Backend)
- `DATABASE_URL`: URL de conexão com o PostgreSQL (ex: `postgresql://user:password@db:5432/db_name`)
- `JWT_SECRET`: Chave secreta para autenticação JWT.
- `PORT`: Porta do servidor backend.
- `VITE_GROQ_API_KEY`: Chave da API GROQ.
- `VITE_OPENWEATHER_API_KEY`: Chave da API OpenWeather (opcional).

### Rodando o Projeto (Docker)
Para rodar o ambiente completo (banco de dados e aplicação):

```bash
docker-compose up --build
```

### Rodando o Projeto (Local - Desenvolvimento)
1. **Banco de Dados:**
   ```bash
   docker-compose up db
   ```
2. **Back-end:**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```
3. **Front-end:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔐 Manual de Uso
1. Acesse o sistema via navegador na porta definida no frontend.
2. Realize o Login para acessar as funcionalidades.
3. Utilize o menu lateral para navegar entre as entidades (Continentes, Países, Estados, Cidades).
4. Utilize as telas de cadastro para gerenciar os registros.
5. Dados complementares e automações via APIs serão carregados automaticamente nas visualizações.
