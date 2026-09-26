# Ritmo

App mobile de rotina: **treino, alimentação, compras e cozinha**, com planejamento semanal, checklist de execução diária e histórico local.

A ideia central é separar **plano** (o que você pretende fazer) de **execução** (o que você de fato fez). É a execução que alimenta o histórico e, no futuro, as métricas de adesão.

O app é **local-first**: sem backend, sem servidor de notificações. Tudo fica em SQLite no dispositivo, e o login é local (usuário e senha salvos no próprio aparelho).

---

## Status atual

| Módulo | Cadastro | Planejamento semanal | Execução diária | Testes |
| --- | --- | --- | --- | --- |
| **Auth local** (login/cadastro) | — | — | — | 9 |
| **Treino** | ✅ completo | ✅ completo | ✅ completo | 30 |
| **Alimentação** | ✅ completo | ✅ completo | ✅ completo | 41 |
| **Compras** | ⬜ placeholder | ⬜ placeholder | ⬜ placeholder | 1 (fumaça) |
| **Cozinha** | ⬜ placeholder | ⬜ placeholder | ⬜ placeholder | 1 (fumaça) |
| **Home** (resumo do dia) | ✅ completo | ✅ completo | — | 9 |
| **Peso corporal** | ⬜ tabela criada, sem uso | — | — | — |
| **Notificações** | ⬜ dependência instalada, sem uso | — | — | — |
| **Métricas** | ⬜ não iniciado | — | — | — |

Mais 16 testes de utils puras e da tela de planejamento. Total: **142** em 19 suítes.

Treino e Alimentação estão completos de ponta a ponta: cadastro → planejamento por dia da semana com horário → checklist de execução com quantidades, itens extras e observações.

A Home resume o dia: agenda de treino e alimentação ordenada por horário, estado de cada item (pendente, concluído, parcial, ignorado) e atalho para a execução da próxima atividade pendente. As métricas ainda não existem.

Compras e Cozinha são telas de 10 linhas que renderizam `ModulePlaceholder`. As tabelas `grocery_items` e `cooking_items` já existem no schema, mas nenhuma tela as consome ainda.

Ver [Roadmap](#roadmap) para o resto.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | React Native 0.81 + Expo SDK 54 (Nova Arquitetura) |
| Linguagem | TypeScript 5.9 em modo `strict` |
| Navegação | Expo Router 6 (file-based, rotas tipadas) |
| Banco | SQLite local via `expo-sqlite` + Drizzle ORM |
| Estilo | NativeWind 4 (Tailwind 3), com suporte a dark mode |
| Estado global | Zustand 5 (persistido em AsyncStorage) |
| Testes | Jest + `jest-expo` + `@testing-library/react-native` |
| Build | EAS Build (APK de preview, AAB de produção) |

Instaladas e ainda **não usadas** no código: `expo-notifications`, `expo-haptics`, `expo-image`, `expo-symbols`, `expo-web-browser`, `expo-font`, `expo-system-ui`.

---

## Como rodar

Pré-requisitos: Node.js 20.19+ e npm. Para testar no celular, basta o **Expo Go** — o projeto não exige dev client.

```bash
npm install
npm start          # abre o Metro; leia o QR code com o Expo Go
```

Outras opções:

```bash
npm run android    # emulador/dispositivo Android
npm run ios        # simulador iOS (macOS)
npm run web        # navegador (o SQLite roda via wa-sqlite.wasm)
```

O banco é criado automaticamente no primeiro start, em `ritmo.db`, junto com as migrations. Não há passo de setup de banco.

### Verificação de qualidade

```bash
npm test                # 19 suítes, 142 testes, ~6s
npm run lint            # expo lint (eslint-config-expo)
npx tsc --noEmit        # typecheck
```

### Scripts disponíveis

| Script | O que faz |
| --- | --- |
| `npm start` | Sobe o Metro |
| `npm run android` / `ios` / `web` | Sobe o Metro já apontando para a plataforma |
| `npm test` | Jest |
| `npm run lint` | ESLint em `src` e `app` |

Não existem scripts para typecheck nem para migrations. Use os comandos crus:

```bash
npx tsc --noEmit                  # typecheck
npx drizzle-kit generate           # gerar migration a partir do schema
npx drizzle-kit studio             # inspecionar o banco
```

Vale propor adicionar `typecheck`, `db:generate` e `db:studio` ao `package.json`.

---

## Estrutura

```
app/                        rotas do Expo Router — cada arquivo é uma tela
  (auth)/                   login e cadastro
  (tabs)/                   navegação principal por abas
    plan/                   resumo da semana e edição por dia
    workout/                CRUD de treino + execução
    nutrition/              CRUD de refeição + execução
    shopping.tsx            placeholder
    cooking.tsx             placeholder
    index.tsx               Home: resumo do dia e próxima atividade
src/
  components/               UI reutilizável (Button, TextField, formulários, linhas de log)
  components/home/         card de próxima atividade e linha do resumo do dia
  db/
    schema.ts               14 tabelas em Drizzle
    client.ts               instância do drizzle + openDatabaseSync
    migrations-gate.tsx     aplica as migrations antes de montar o app
    migrations/             .sql gerados + migrations.js + meta/
  services/                 regra de negócio — único lugar que fala com o banco
  hooks/                    camada de dados entre tela e service (useFocusEffect)
  stores/                   Zustand (auth persistido)
  utils/                    funções puras (datas, quantidades, agenda, dias da semana)
  types/                    tipos derivados do schema
__tests__/                  services/ (regra de negócio), screens/ (fumaça + interação), utils/
```

### Camadas

O fluxo é sempre **tela → hook → service → banco**. Tela nunca importa `db` diretamente; cálculo de regra de negócio nunca mora no JSX.

```
app/(tabs)/nutrition/[id]/run.tsx
  └─ useMealExecution(mealId, date)          src/hooks/      recarrega no useFocusEffect
      └─ listMealExecution / upsertMealLog   src/services/  regra de negócio
          └─ db                              src/db/        drizzle + SQLite
```

Os hooks de dados seguem um contrato único: retornam `{ dado, error, refresh }`, com `dado === null` significando "carregando" e `[]` significando "vazio".

---

## Rotas

| Rota | Tela | O que faz |
| --- | --- | --- |
| `/login` | Login | Autentica localmente e entra no app |
| `/register` | Cadastro | Cria usuário, senha com hash SHA-256 + salt, e a linha de `settings` |
| `/` | Home | Resumo do dia: próxima atividade pendente com atalho para a execução, e a lista completa com o estado de cada item |
| `/plan` | Planejar | Resumo dos 7 dias, itens de treino e alimentação em ordem de horário, com badge do tipo |
| `/plan/[weekday]` | Planejar dia | Marca itens por dia e define o horário; seções Cozinha e Compras dizem "Em breve" |
| `/workout` | Treinos | Lista de treinos com contagem de exercícios |
| `/workout/new`, `/workout/[id]/edit` | Formulário | Mesmo `WorkoutForm`, criando ou editando |
| `/workout/[id]` | Treino | Detalhe, lista de exercícios planejados, iniciar / editar / excluir |
| `/workout/[id]/run` | Executar treino | Checklist do dia: concluído, carga, reps por série, observações, exercício extra |
| `/nutrition` | Refeições | Lista de refeições com contagem de ingredientes |
| `/nutrition/new`, `/nutrition/[id]/edit` | Formulário | Mesmo `MealForm`, criando ou editando |
| `/nutrition/[id]` | Refeição | Detalhe, dias vinculados, registrar / editar / excluir |
| `/nutrition/[id]/run` | Registrar refeição | Checklist do dia: concluído, quanto comeu de cada ingrediente, ingrediente extra, observações |
| `/shopping` | Compras | Placeholder |
| `/cooking` | Cozinha | Placeholder |

### Execução de refeição

A tela de registrar-refeição espelha a de executar-treino e mostra o status **derivado em tempo real** conforme você digita as quantidades:

| Situação | Status exibido |
| --- | --- |
| Não marquei como concluído | Não comi |
| Concluído, tudo dentro do planejado (ou sem quantidades) | Comi tudo |
| Concluído, alguma quantidade difere do planejado | Comi parcialmente |

A regra vive em `resolveMealStatus()` (`src/services/meal-execution.ts`) e é coberta por testes unitários. **Ingredientes extras não afetam o status**: comer algo além do planejado não torna a refeição parcial.

---

## Banco de dados

14 tabelas em `src/db/schema.ts`, `snake_case` e em inglês, com FK explícita e `onDelete: 'cascade'`.

| Tabela | Papel |
| --- | --- |
| `users` | Usuário local. `name` único, `password_hash` no formato `salt:hash` |
| `settings` | Um registro por usuário (intervalo de pesagem) |
| `workouts` | Treino do usuário |
| `exercises` | Exercício pertencente a um treino, com séries × reps planejadas |
| `workout_schedules` | Dia da semana e horário de um treino. Único por `(workout_id, weekday)` |
| `exercise_logs` | Execução de um exercício em uma data. `exercise_id` XOR `(workout_id` + `exercise_name)` para o exercício extra |
| `meals` | Refeição do usuário |
| `ingredients` | Ingrediente de uma refeição, com quantidade e unidade |
| `meal_schedules` | Dia da semana e horário de uma refeição. Único por `(meal_id, weekday)` |
| `meal_logs` | Registro da refeição em uma data. Único por `(meal_id, date)`, com `status` em `eaten \| not_eaten \| partial` |
| `meal_log_items` | Quanto foi comido de cada ingrediente. `ingredient_id` nulo + `name` = ingrediente extra |
| `grocery_items` | Item de compra. Criada, ainda sem uso |
| `cooking_items` | Item de cozinha, com antecedência e vínculo opcional com uma refeição. Criada, ainda sem uso |
| `weigh_ins` | Pesagem e medidas corporais. Criada, ainda sem uso |

**Convenção de dia da semana:** `0` = Segunda ... `6` = Domingo. Dia e horário vivem nas tabelas de schedule, não em `workouts`/`meals` — assim a mesma refeição pode aparecer em vários dias sem duplicar seus ingredientes. Os services gravam a lista completa de dias de cada item a cada edição (delete + re-insert em transação).

### Criando uma migration

```bash
# 1. edite src/db/schema.ts
npx drizzle-kit generate
```

O `drizzle-kit` gera o `.sql` em `src/db/migrations/` e o snapshot em `meta/`, e **atualiza `_journal.json`**. Só que ele **não regenera `migrations.js`** — e sem essa entrada a migration existe no disco e nunca roda. Registrar manualmente:

```js
// src/db/migrations/migrations.js
import m0008 from './0008_nome_da_migration.sql';
// ...
export default { journal, migrations: { m0000, /* ... */ m0008 } };
```

Na aplicação, nada mais é preciso: o `MigrationGate` roda `useMigrations` antes de qualquer tela aparecer, e o banco de um usuário existente é atualizado no próximo start.

---

## Testes

```bash
npm test
npx jest --maxWorkers=1    # evita flake de I/O em suítes de tela
```

19 suítes, 142 testes, organizados por camada:

| Pasta | Foco |
| --- | --- |
| `__tests__/services/` | Toda função pública de todo service, com o banco mockado via `src/db/__mocks__/client.ts` |
| `__tests__/screens/` | Fumaça e interação de cada tela, com `expo-router` mockado por suíte |
| `__tests__/utils/` | Funções puras: agenda do dia, resumo do dia, dia da semana, datas, quantidade |

Nenhum teste toca SQLite de verdade. O mock do drizzle é determinístico, com fila de resultados por query, o que permite verificar transações e valores gravados:

```ts
getDbMock().setSelectResults([log], [ingredients], [logItems]);
await listMealExecution(1, '2026-09-26');
expect(getDbMock().getInsertValues()).toEqual([/* ... */]);
expect(mockDb.transaction).toHaveBeenCalled();
```

---

## Build

O projeto já está linkado ao EAS (`eas.projectId` em `app.json`).

```bash
npx eas-cli build --profile preview --platform android    # APK para instalar direto
npx eas-cli build --profile production --platform android # AAB para a Play Store
```

- `preview`: distribuição interna, APK.
- `production`: `autoIncrement` de `versionCode`, AAB.
- Versão vem do `app.json` (`appVersionSource: local`).
- **iOS não está pronto para build**: falta `ios.bundleIdentifier` em `app.json`.

---

## Roadmap

Próximos passos, em ordem de dependência:

1. **Compras** — lista derivada dos ingredientes da semana (`grocery_items` já existe).
2. **Cozinha** — o que cozinhar, quando e a antecedência (`cooking_items` já existe).
3. **Notificações** — `expo-notifications` está instalado, mas nunca importado, e falta o plugin em `app.json`. Vai ser um motor que lê os horários das tabelas, não uma tela.
4. **Peso corporal** — `weigh_ins` existe; falta tela e o gráfico de evolução.
5. **Métricas** na Home — adesão ao treino, adesão à dieta, evolução de carga e de peso.
6. **Sair da conta** — `signOut` existe no store, mas nenhuma tela chama.

Pendências técnicas conhecidas:

- `reactCompiler: true` está ligado em `app.json` sem o `babel-plugin-react-compiler` instalado.
- `time` é texto livre: nada valida `HH:MM` na hora de salvar, só na hora de ordenar a agenda.
- `/plan/[weekday]` não valida o parâmetro da rota (`NaN` passaria).
- `listWorkouts` e `listMeals` contam exercícios/ingredientes buscando todas as linhas sem filtro e filtram em memória.
- `MigrationGate` não tem botão de tentar novamente em caso de erro.
- `expo-asset` está aninhado em `node_modules/expo/node_modules` e não resolve fora do Metro; `expo-font` (usado por `@expo/vector-icons`, importado no layout das abas) depende dele. Rodar `npx expo install expo-asset` deixa a resolução explícita.

---

## Convenções

O guia completo de código está em [`AGENTS.md`](./AGENTS.md) — leia antes de implementar qualquer coisa. O resumo:

- Tela magra: busca dado via hook/service e renderiza. Cálculo mora em `services/` ou `utils/`.
- Banco só é chamado de `src/services/`. Toda regra de negócio tem teste unitário.
- Toda mudança de schema passa por migration do Drizzle. Nunca alterar tabela na mão.
- Componente em `PascalCase.tsx`, hook em `useSomething.ts`, tabelas e colunas em `snake_case`.
- NativeWind para estilo, sem misturar com `StyleSheet.create`.
- TypeScript `strict`, sem `any` sem justificativa em comentário.
- Conventional Commits em português, um commit por unidade lógica.

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | Como codar neste projeto |
| [`.docs/ritmo-orientacao-projeto.md`](./.docs/ritmo-orientacao-projeto.md) | Visão do produto, módulos, roadmap original e o schema acordado |
| [`plano-modulo-alimentacao.md`](./plano-modulo-alimentacao.md) | Plano do módulo de alimentação (concluído, mantido como registro) |

> O `.docs/ritmo-orientacao-projeto.md` §10 ainda descreve 11 tabelas — hoje são 14. `workout_schedules`, `meal_schedules` e `meal_log_items` foram criadas depois e não estão lá.
