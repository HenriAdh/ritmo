# AGENTS.md — Ritmo

Guia para qualquer agente (ou dev) que for codar neste projeto. Leia antes de implementar qualquer coisa.

---

## 1. Visão geral do projeto

App mobile de treino, alimentação, compras e cozinha, com checklists de execução, notificações locais e métricas de evolução. Ver `ritmo-orientacao-projeto.md` para o contexto completo do produto (entidades, fluxos, roadmap).

Este arquivo (`AGENTS.md`) trata só de **como codar**, não do que construir.

---

## 2. Stack técnica (fixa — não trocar sem discutir antes)

- React Native + **Expo**
- **TypeScript** em modo `strict` — nada de `any` sem justificativa em comentário
- **Expo Router** para navegação (arquivos em `app/`)
- **SQLite local** via `expo-sqlite` + **Drizzle ORM**
- **Zustand** para estado global
- **NativeWind** (Tailwind) para estilização — evitar `StyleSheet.create` misturado com className, escolher um padrão por componente
- **expo-notifications** para lembretes locais
- Login local (sem backend) — usuário/senha salvos no dispositivo

---

## 3. Estrutura de pastas

```
app/                    # rotas (Expo Router) — cada arquivo é uma tela
  (tabs)/                # navegação principal por abas
  workout/
  nutrition/
  shopping/
  cooking/
src/
  components/            # componentes reutilizáveis de UI
  db/
    schema.ts            # definição das tabelas (Drizzle)
    migrations/
    client.ts            # instância do banco
  services/              # regras de negócio (não misturar com telas)
  stores/                # stores Zustand
  hooks/
  utils/
  types/
```

Regra geral: **tela não fala direto com o banco**. Tela chama `services/`, que chama `db/`. Isso evita lógica de negócio espalhada em componente.

---

## 4. Convenções de código

- Nomes de arquivos de componente: `PascalCase.tsx` (ex: `WorkoutCard.tsx`)
- Nomes de hooks: `useSomething.ts` (ex: `useWorkouts.ts`)
- Nomes de tabelas/colunas no banco: `snake_case`, em inglês (ex: `workouts`, `exercises`, `grocery_items`)
- Variáveis e funções no código: `camelCase`, em inglês
- Sempre tipar props de componente com `interface` ou `type`, nunca props implícitas
- Nunca duplicar tipo — se uma entidade já existe em `types/`, reaproveitar
- Componente de tela fica magro: busca dado via hook/service, renderiza. Lógica de cálculo (ex: taxa de adesão) fica em `services/` ou `utils/`, não dentro do JSX

---

## 5. Banco de dados

- Toda mudança de schema passa por **migration do Drizzle** — nunca alterar tabela na mão
- Antes de criar uma tabela nova, checar se ela já está descrita em `ritmo-orientacao-projeto.md` — se não estiver, avisar antes de criar (pode ser desalinhamento)
- Relacionamentos (ex: exercício pertence a treino) sempre com chave estrangeira explícita, nunca lógica de "achar por nome"

---

## 6. Testes

- Toda função em `services/` que tem regra de negócio (cálculo de adesão, geração de notificação, etc.) precisa de teste unitário
- Toda tela nova precisa de pelo menos um teste de fumaça (renderiza sem quebrar)
- Rodar testes antes de considerar qualquer tarefa concluída

---

## 7. Commits

- Conventional Commits, mensagens em português
  - `feat: adiciona checklist de treino`
  - `fix: corrige cálculo de série realizada`
  - `chore: configura drizzle`
- Um commit por unidade lógica de mudança — evitar commit gigante misturando telas diferentes

---

## 8. Definição de "tarefa concluída"

Uma tarefa só está pronta quando:

1. Código implementado seguindo a estrutura de pastas da seção 3
2. Testes relevantes escritos e passando
3. Sem `console.log` esquecido
4. Sem `any` sem justificativa
5. Commit feito seguindo o padrão da seção 7

---

## 9. O que nunca fazer

- Não criar tabela ou campo novo sem checar o schema oficial primeiro
- Não colocar chamada de banco direto dentro de componente de tela
- Não misturar StyleSheet e NativeWind no mesmo componente
- Não commitar com testes quebrados
- Não assumir sincronização em nuvem — o app é local-first, qualquer feature de rede precisa ser discutida antes de implementada
