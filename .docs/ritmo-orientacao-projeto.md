# Ritmo — Documento de Orientação do Projeto

> Nome provisório: **Ritmo** (fácil de trocar depois — outras opções consideradas: Rotina Certa, Prep, Fica Pronto, Comeu?)

## 1. Visão geral

App mobile (React Native + Expo) para organizar treino, alimentação, compras de mercado e preparo de comida, com checklist de execução, notificações e métricas de evolução.

A ideia central: separar o que é **plano** (o que eu pretendo fazer) do que é **execução** (o que eu de fato fiz). A execução é o que alimenta as métricas e o histórico.

---

## 2. Módulos de cadastro (o "plano")

### 2.1 Treino

- **Treino**: título (ex: "Treino A - Peito e tríceps")
- **Exercício** (vinculado a um treino): nome, séries x repetições planejadas

### 2.2 Alimentação

- **Refeição**: nome do prato, horário, dia da semana
- (Opcional, mas recomendado): ingredientes de cada refeição — isso permite gerar automaticamente a lista de compras e o planejamento de cozinha, evitando digitar tudo de novo

### 2.3 Compras

- **Item de compra**: nome, dia planejado para comprar, quantidade
- Pode ser criado manualmente ou sugerido a partir dos ingredientes das refeições da semana

### 2.4 Cozinha

- **Item de cozinha**: o que cozinhar, quando cozinhar
- Pode indicar antecedência necessária (ex: tirar do freezer X horas antes)
- Pode se vincular à refeição que ele vai abastecer

---

## 3. Camada de execução (checklists)

Cada módulo acima ganha uma camada de registro do que foi realmente feito:

| Módulo   | O que é registrado                                                |
| -------- | ----------------------------------------------------------------- |
| Treino   | Feito? (sim/não), peso usado, séries/reps reais, data, observação |
| Refeição | Comeu? (sim/não/parcial), data, observação                        |
| Compras  | Comprado? (sim/não), data da compra                               |
| Cozinha  | Feito? (sim/não), data que foi feito                              |

**Por que treino tem mais detalhe:** é o único módulo que se repete semanalmente e onde o histórico de carga (peso ao longo do tempo) importa de verdade. Compras e cozinha são mais "binários" — feito ou não, não precisam de tanto detalhe.

---

## 4. Acompanhamento de peso corporal

- O app pergunta o peso atual periodicamente (intervalo definido pelo usuário, ex: a cada 7 dias)
- Opcional: medidas corporais (cintura, braço, etc.)
- Alimenta gráfico de evolução, cruzado com o histórico de carga do treino

---

## 5. Notificações

Não é uma tela de cadastro — é um motor que lê as outras tabelas e dispara avisos:

- Hora da refeição → lembrete para comer
- Antecedência definida → lembrete para tirar algo do freezer
- Hora de cozinhar → lembrete de preparo
- Dia de compra → lembrete com os itens do dia
- Periodicidade → pergunta de peso corporal

---

## 6. Métricas

Alimentadas pelos dados registrados nos checklists:

- Evolução de carga por exercício (peso x tempo)
- Evolução do peso corporal
- Taxa de adesão ao treino (dias treinados / dias planejados)
- Taxa de adesão à dieta (refeições feitas / planejadas)
- % de compras e itens de cozinha em dia vs. atrasados

---

## 7. Ideias extras (pós-v1, não essenciais no início)

**Ligadas ao bem-estar geral**

- Foto de progresso (linha do tempo visual) — entregue como `photo_uri` em
  `weigh_ins`, mas continua listado aqui porque a versão original do documento
  não previa foto nenhuma na tabela.
- Nível de energia/disposição no dia do treino
- Água bebida no dia
- Horas de sono

**Ligadas ao treino**

- Timer de descanso entre séries
- Recorde pessoal automático (o app percebe quando bateu o maior peso)
- Divisão de treino por dia da semana (Treino A na segunda, B na quarta, etc.)

**Ligadas à alimentação/cozinha**

- Receitas com modo de preparo anexado à refeição
- Estoque de freezer/despensa (para não comprar duplicado)
- Lista de compras agrupada por categoria (hortifruti, açougue, mercado)

**Big picture**

- Tela inicial (home) resumindo o dia: próximo treino, próxima refeição, o que cozinhar, o que comprar
- Streak / sequência de dias seguindo o plano

**Widgets de tela inicial (fase avançada)**

- Possível via lib `expo-widgets` (iOS) ou módulos nativos customizados (Android)
- Requer sair do Expo Go e usar Expo Dev Client — não é passo trivial, deixar para depois do app principal estar estável

---

## 8. Ordem sugerida de construção

1. Cadastros básicos (treino, alimentação, compras, cozinha)
2. Checklists de execução
3. Acompanhamento de peso corporal
4. Notificações
5. Métricas
6. Extras (ideias da seção 7) e widgets

---

## 9. Stack técnica

- **Framework**: React Native + Expo
- **Linguagem**: TypeScript
- **Banco de dados**: SQLite local (`expo-sqlite` + Drizzle ORM)
- **Navegação**: Expo Router
- **Estado global**: Zustand
- **Notificações**: `expo-notifications` (locais, sem depender de servidor)
- **Estilização**: NativeWind (Tailwind para React Native)
- **Plataformas**: Android e iOS
- **Login**: local, sem servidor (usuário + senha salvos no próprio dispositivo). Não há recuperação de senha por e-mail nesta fase. Estrutura pensada para permitir migração futura para autenticação em nuvem sem grande retrabalho
- **Fase inicial**: Expo Go é suficiente
- **Fase de widgets**: exige migração para Expo Dev Client

---

## 10. Schema do banco de dados (SQLite)

### users

`id, name, password_hash, created_at`

### workouts

`id, user_id, title, created_at`

### exercises

`id, workout_id, name, planned_sets, planned_reps`

### exercise_logs (checklist do treino)

`id, exercise_id, date, done, weight_used, actual_sets, actual_reps, notes`

### meals

`id, user_id, name, time, weekday`

### ingredients (opcional, ligado à refeição — permite gerar compras/cozinha automaticamente)

`id, meal_id, name, quantity, unit`

### meal_logs (checklist de alimentação)

`id, meal_id, date, status (eaten / not_eaten / partial), notes`

### grocery_items

`id, user_id, name, planned_day, quantity, purchased, purchased_at`

### cooking_items

`id, user_id, what_to_cook, when_to_cook, lead_time_hours, meal_id (opcional), done, done_at`

### weigh_ins (acompanhamento de peso corporal)

`id, user_id, date, weight, photo_uri (opcional), measurements (opcional)`

`photo_uri` guarda a referência ao asset escolhido na galeria, não uma cópia do
arquivo. Consequência aceita: se a pessoa apagar a foto da galeria, o registro
perde a imagem e a tela mostra "Foto indisponível" no lugar.

### settings

`id, user_id, weigh_in_interval_days`

> Notificações não são uma tabela — são geradas dinamicamente a partir dos horários/datas das tabelas acima.
