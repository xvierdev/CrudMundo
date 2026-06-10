# Sistema de Gerenciamento Geográfico (CrudMundo)

Este projeto é uma aplicação web desenvolvida com TypeScript, para o gerenciamento de dados geográficos, 
incluindo continentes, países, estados e cidades. O sistema permite operações CRUD completas e integra APIs
externas para enriquecer as informações exibidas conforme solicitado pelos requisitos fornecidos pelo professor.

🎥 **Vídeo de Apresentação:** [Assista aqui](https://youtu.be/p3EbQ5oLqjg)

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
  - Enriquecimento de dados:
    - [restcountries.com](https://restcountries.com) (Bandeira e nomes)
    - [Open-Meteo](https://open-meteo.com) (Clima)
    - [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org) (Geocodificação)
    - [OpenDataSoft](https://www.opendatasoft.com) (População)
  - Inteligência Artificial para preenchimento automático e validação ([GROQ API](https://console.groq.com) - *obtenção de token gratuita*).

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v18+)
- Docker e Docker Compose para deploy

### Configuração de Ambiente
Crie os arquivos `.env` baseando-se nos `.env.example` existentes nos diretórios `/backend` e `/frontend`.

#### Variáveis Necessárias (Backend - `/backend/.env`)
- `DATABASE_URL`: URL de conexão com o PostgreSQL (ex: `postgresql://user:password@db:5432/db_name?schema=public`)
- `JWT_SECRET`: Chave secreta para autenticação JWT.
- `PORT`: Porta do servidor backend.

#### Variáveis Necessárias (Frontend - `/frontend/.env`)
- `VITE_GROQ_API_KEY`: Chave da API GROQ usada para validação de inputs do usuário.

### Rodando o Projeto (Docker)
Para rodar o ambiente completo (banco de dados, backend, frontend e tunnel):

Certifique-se de configurar as variáveis de ambiente necessárias (`DATABASE_URL`, `JWT_SECRET`, `VITE_GROQ_API_KEY`, e `TUNNEL_TOKEN`) antes de subir os containers.

```bash
docker-compose up --build
```

Caso queira subir apenas o banco de dados separadamente para desenvolvimento local:
```bash
docker-compose up dbms
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

## 🤝 Agradecimentos
Agradecer ao aluno **Nícolas Ferreira Fernandes** por ter realizado os testes deste projeto. 
- [Relatório de Testes (PDF)](./teste_crudmundo.pdf)
