-- Migration 002: Criação da tabela veiculo_cliente_historico
-- Esta tabela guarda o histórico de qual cliente foi dono de qual veículo e em qual período.

CREATE TABLE IF NOT EXISTS "public"."veiculo_cliente_historico" (
    id uuid primary key default uuid_generate_v4(),
    veiculo_id uuid not null references "public"."veiculo"(id) on delete cascade,
    cliente_id uuid not null references "public"."cliente"(id),
    data_inicio timestamp not null,
    data_fim timestamp null
);

CREATE INDEX idx_veiculo_historico_veiculo ON "public"."veiculo_cliente_historico"(veiculo_id);
CREATE INDEX idx_veiculo_historico_cliente ON "public"."veiculo_cliente_historico"(cliente_id);

-- Migrar dados existentes: para cada veículo, cria um histórico com data_inicio = data_inclusao e data_fim = null
INSERT INTO "public"."veiculo_cliente_historico" (veiculo_id, cliente_id, data_inicio, data_fim)
SELECT id, cliente_id, data_inclusao, null
FROM "public"."veiculo";
