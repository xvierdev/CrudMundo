# Backend - Sistema de Gerenciamento Geográfico

Este é o serviço de backend da aplicação CrudMundo, desenvolvido em Node.js com TypeScript e Express.

## Arquitetura

O projeto segue uma arquitetura baseada em **Camadas (Layered Architecture)**, visando organização, manutenibilidade e separação de responsabilidades:

1.  **Controllers:** Camada responsável por receber as requisições HTTP, validar os dados de entrada básicos, chamar os serviços apropriados e enviar as respostas HTTP para o cliente.
2.  **Services:** Camada de lógica de negócios. É onde residem as regras da aplicação. Os serviços interagem diretamente com o banco de dados via ORM.
3.  **Config:** Arquivos de configuração da aplicação (ex: inicialização do Prisma Client).
4.  **Routes:** Definição dos *endpoints* da API e associação com os *controllers* correspondentes.

## Tecnologias Principais
- **Node.js** com **TypeScript**
- **Express** (Framework Web)
- **Prisma** (ORM para interação com PostgreSQL)
- **JWT** (Autenticação)
