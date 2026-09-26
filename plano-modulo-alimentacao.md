# Plano — Módulo de Alimentação (CRUD de refeições + ingredientes)

> Status: planejado, não iniciado.
> Base: `main` em `f044fcd feat: move planejamento para aba própria com horário e seções do dia`.

## Contexto

O módulo de treino está completo (CRUD, execução, planejamento semanal). Os módulos de
alimentação, compras, cozinha e a Home continuam como `ModulePlaceholder`.

A tabela `meals` já existe no schema desde a migration `0000`, com `user_id`, `name`, `time`
e `weekday` — mas não há service, hook, componente ou tela que a use.

## Decisões já tomadas

- **Escopo:** só o CRUD nesta primeira parte. A execução diária (`meal_logs`) fica para depois.
- **Schema:** manter como está. `meals.weekday` é embutido, então a mesma refeição em dois dias
  vira duas linhas com ingredientes duplicados. Não criar `meal_schedules`.
- **Aba Planejar:** `plan/[weekday].tsx` continua mostrando "Em breve" na seção Alimentação.

## Etapa 1 — Extrair `WEEKDAY_NAMES` para util compartilhado

Hoje `WEEKDAY_NAMES` e `weekdayName` vivem em `src/services/workout-plan.ts`. O módulo de
alimentação também precisa deles. Extrair para `src/utils/weekday.ts`, ao lado de `date.ts`
e `reps.ts`.

- Novo: `src/utils/weekday.ts`
- Modificados: `src/services/workout-plan.ts`, `app/(tabs)/plan/index.tsx`, `app/(tabs)/plan/[weekday].tsx`
- Testes: o bloco `weekdayName` sai de `__tests__/services/workout-plan.test.ts` e vira
  `__tests__/utils/weekday.test.ts`

Refactor mecânico, sem mudança de comportamento.

## Etapa 2 — Service e hooks

### `src/services/meals.ts`

Espelha `src/services/workouts.ts`: validação com `throw new Error`, `normalizeIngredients`
descartando ingrediente sem nome, e transaction para gravar meal + ingredientes.

| Função | Retorno |
| --- | --- |
| `listMealsByWeekday(userId)` | `Partial<Record<number, MealListItem[]>>`, agrupado por `weekday`, ordenado por `time` e depois `name` |
| `getMealDetail(mealId)` | `{ meal, ingredients }`, lança `'Refeição não encontrada'` |
| `createMeal(input)` | `Meal` — insere meal e ingredientes em transaction |
| `updateMeal(input)` | `void` — atualiza meal, deleta e reinsere os ingredientes |
| `deleteMeal(mealId)` | `void` |

Types no padrão do arquivo: `IngredientInput`, `MealListItem` (`Meal & { ingredientCount: number }`),
`MealDetail`, `CreateMealInput`, `UpdateMealInput`. Reaproveita `Meal` e `Ingredient` de
`src/types/index.ts`.

### Hooks

Mesmo shape de `useWorkouts.ts` e `useWorkout.ts`, com `useFocusEffect`:

- `src/hooks/useMeals.ts` → `{ byWeekday, error, refresh }`
- `src/hooks/useMeal.ts` → `{ detail, error, refresh }`

## Etapa 3 — Telas

Converter o placeholder em rotas aninhadas, espelhando `app/(tabs)/workout/`:

- Remover `app/(tabs)/nutrition.tsx` (vira `nutrition/index.tsx`; o nome da aba em
  `app/(tabs)/_layout.tsx` continua válido)
- `app/(tabs)/nutrition/_layout.tsx` — `Stack` com `index` "Refeições", `new` "Nova refeição",
  `[id]/index` "Refeição", `[id]/edit` "Editar refeição"
- `app/(tabs)/nutrition/index.tsx` — `ScrollView` com as 7 seções na ordem de `WEEKDAY_NAMES`,
  cada uma mostrando hora, nome e contagem de ingredientes; `Button` "Nova refeição" no rodapé
- `app/(tabs)/nutrition/new.tsx` — `<MealForm onSaved={() => router.back()} />`
- `app/(tabs)/nutrition/[id]/index.tsx` — detalhe, ingredientes em cards, `Button` "Editar" e
  "Excluir refeição" com `Alert.alert` e `variant="danger"`
- `app/(tabs)/nutrition/[id]/edit.tsx` — `useMeal` + `<MealForm initial={detail} />`, com
  `ActivityIndicator` enquanto carrega
- `src/components/nutrition/MealForm.tsx` — espelha `WorkoutForm.tsx`: título, horário, seletor de
  dia da semana em 7 chips pressionáveis, linhas dinâmicas de ingrediente (nome, quantidade,
  unidade) com adicionar e remover. Usa `useKeyboardHeight` e `keyboardShouldPersistTaps="handled"`

Validação no form: nome obrigatório, horário obrigatório no formato `HH:MM`, e quantidade de
ingrediente quando informada precisa ser número maior ou igual a zero.

## Testes

- Novo `__tests__/services/meals.test.ts` — `listMealsByWeekday` agrupa e ordena;
  `createMeal` filtra ingrediente sem nome e grava em transaction; `updateMeal` substitui
  ingredientes; `getMealDetail` lança quando não acha; `deleteMeal` remove
- Novo `__tests__/screens/nutrition-screens.test.tsx` — fumaça da lista, do detalhe e do form,
  mockando `expo-router`, `auth-store` e `services/meals` como em `plan-screens.test.tsx`
- Modificar `__tests__/screens/tab-screens.test.tsx` — remover o caso "renderiza a aba
  Alimentação"; Compras e Cozinha seguem placeholders

## Commits

1. `refactor: extrai nomes dos dias da semana para util compartilhado`
2. `feat: adiciona service e hooks de refeições com ingredientes`
3. `feat: adiciona telas de listagem e edição de refeições`

Um commit por unidade lógica, conforme AGENTS.md.

## Verificação

`npx tsc --noEmit`, `npm test` e `npm run lint` antes de cada commit.

## Riscos

- **Timeout de 5s nos testes** — já houve flake em `workout-screens.test.tsx` com cache frio.
  Os testes de tela novos somam renderizações; se voltarem a estourar, subir o `testTimeout` no
  `jest.config.js` em vez de deixar a suíte instável.
- **Nenhuma migration** — nenhuma etapa cria tabela, então `drizzle-kit` não é chamado.
- **`meal_logs` sem consumidor** — `MealLog` já está exportado em `src/types/index.ts` e segue
  sem uso até a etapa de execução diária. Não mexer agora.

## Fora de escopo

- Execução diária de refeições (`meal_logs`)
- Lista de compras derivada dos ingredientes (`grocery_items`)
- Cozinha (`cooking_items`)
- Home com o resumo do dia
- Notificações locais (`expo-notifications` está instalado e nunca foi importado)
- Balanço e métricas (`weigh_ins`, `settings`)
