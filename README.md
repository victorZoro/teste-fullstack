# Teste Fullstack (Parking Management)

Este repositório contém a solução do teste técnico para Desenvolvedor Full-Stack Pleno. 
O projeto é um sistema de gerenciamento de estacionamento. 
Foi desenvolvido com **.NET 8 (Web API)** no backend, **React (Vite)** no frontend e banco de dados **PostgreSQL** com **EF Core**.

---

## Documentação de Decisões Técnicas (System Design)

As decisões arquiteturais foram tomadas visando escalabilidade, performance e manutenibilidade. 
O foco foi justificar o motivo das escolhas técnicas e documentar as alternativas descartadas.

### Arquitetura Base
As regras de negócio foram extraídas dos *Controllers* para uma camada dedicada de *Services*.
Foi adotado o padrão `ServiceResult<T>`. 
O objetivo foi evitar o uso de *Exceptions* para o controle de fluxo. 
O uso de exceções em C# consome muita memória e CPU.
O `ServiceResult` garante um roteamento rápido e isola a responsabilidade dos *Controllers* (Princípio SRP do SOLID).

**Alternativa Descartada:** A adoção do padrão CQRS com MediatR foi descartada por ser complexa demais (*over-engineering*) para um sistema predominantemente CRUD.

### Tarefa 1: Completar a Tela de Cliente
Foi implementada a edição de clientes reaproveitando os componentes existentes.
O formulário utiliza uma propriedade simples para alternar entre criação e edição. 
Isso evita duplicação de código (Princípio DRY).
O campo de telefone tornou-se obrigatório. 
Foi adicionada uma restrição de unicidade e criado um índice no banco de dados para a combinação de nome e telefone.
O índice maximiza a performance das consultas.
A estrutura do banco foi desenhada seguindo um padrão de *migrations*. 
Isso facilitará a adoção futura de sistemas formais de migração, como o Flyway.

**Alternativa Descartada:** A criação de modais ou páginas separadas para 
"Criar" e "Editar" foi descartada. 
Isso geraria duplicação de HTML e de regras de validação.
O uso de um componente híbrido foi preferido pela simplicidade (KISS).

### Tarefa 2: Completar a Tela de Veículos
Foi criada a tabela `veiculo_cliente_historico`. 
Ela atua como um registro imutável das trocas de dono do veículo ao longo do tempo.
A atualização do veículo e a inserção no histórico ocorrem dentro de uma **Transação Explícita** (`BeginTransactionAsync`). 
Isso garante a atomicidade da operação (tudo ou nada). 
Se houver falha na rede, ocorre o *rollback*, impedindo inconsistências financeiras.

Outra alternativa seria a adoção de *Event Sourcing*.
Contudo, tais padrões adicionariam uma complexidade desnecessária para o escopo do projeto.
A tabela relacional paralela resolveu o problema sem quebrar a modelagem legada.

### Tarefa 3: Melhorar Upload CSV
A rotina de upload de CSV foi refatorada.
Foi implementada uma validação linha a linha. 
Se uma linha possuir colunas insuficientes, o processamento daquela linha é interrompido amigavelmente. 
Isso evita erros abruptos, como `IndexOutOfRangeException`, e mantém a estabilidade da aplicação.
A leitura do arquivo foi mantida de forma **síncrona**. 
Ele entrega o resultado instantaneamente na tela do usuário.

Uma alternativa mais robusta seria a adoção de uma arquitetura assíncrona. 
Essa solução seria ideal apenas para cenários de *Big Data*.
Para o volume atual, o processamento síncrono atende perfeitamente sem onerar a infraestrutura.

### Tarefa 4: Faturamento Parcial
O cálculo da mensalidade deixou de usar um valor fixo de 30 dias. 
Foi adotada a função `DateTime.DaysInMonth` como divisor dinâmico.
Dividir por 30 gera cobranças acima do teto contratual em meses de 31 dias. 
Também gera perdas financeiras em fevereiro. 
O divisor dinâmico garante que o teto da mensalidade seja cravado exatamente em 100%.

### Melhorias de UI/UX e Confiabilidade
- Os alertas nativos do navegador (`window.alert`) foram substituídos por modais globais e `react-hot-toast`. 
  - Alertas nativos travam a *thread* principal do JavaScript. 
  - A nova abordagem garante uma interface fluida e acessível.
- O framework **React** foi mantido. 
  - A troca de framework exigiria reescrever as configurações iniciais. 
  - Isso consumiria o tempo útil do teste sem agregar valor imediato de negócio.
- Foram implementadas validações espelhadas no Frontend e Backend.
  - No frontend, foram aplicadas máscaras visuais (CPF, Placa, Telefone) e limites de caracteres.
  - No backend, foram aplicadas anotações de dados (`[Required]`, `[MaxLength]`) nos *Models*.
  - A validação dupla garante a integridade dos dados mesmo se o frontend for burlado.

---

## Guia de Execução Local

### Pré-requisitos
- .NET 8 SDK
- Node.js (versão recente)
- PostgreSQL (em execução na porta 5432)

### Banco PostgreSQL
1. Crie um banco local (ex.: `parking_test`). 
2. Ajuste a `ConnectionString` no arquivo `src/backend/appsettings.json`, se necessário.  
3. Execute o script abaixo no terminal para criar as tabelas e popular os dados iniciais:  
   ```bash
   psql -h localhost -U postgres -d parking_test -f scripts/seed.sql
   ```  

### Backend (.NET Web API)
```bash
cd src/backend
dotnet restore
dotnet run
```
A API iniciará na porta `5000`. 
A documentação (Swagger) fica disponível em `http://localhost:5000/swagger`.

### Frontend (React/Vite)
```bash
cd src/frontend
npm install
npm run dev
```
A aplicação web iniciará em `http://localhost:5173`. 
Se a porta do backend for alterada, lembre-se de atualizar a variável `VITE_API_URL` no frontend.
