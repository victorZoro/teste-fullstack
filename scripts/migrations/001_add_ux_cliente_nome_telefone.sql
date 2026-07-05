-- Migration 001: Adiciona constraint de unicidade para a combinação (Nome, Telefone) na tabela Cliente

CREATE UNIQUE INDEX ux_cliente_nome_telefone ON "public"."cliente"(nome, telefone);
