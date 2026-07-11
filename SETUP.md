# Como colocar o New Feed CRM no ar (sem saber programar)

Tempo total: ~30 minutos. Custo: R$ 0. Você vai criar 2 contas gratuitas e copiar/colar algumas coisas. Nada de terminal.

---

## Parte 1 — Banco de dados (Supabase) · ~10 min

1. Acesse **supabase.com** e clique em **Start your project**. Crie a conta (pode usar o Google).
2. Clique em **New project**:
   - Nome: `newfeed-crm`
   - Database password: crie uma senha forte e **guarde-a**
   - Região: `South America (São Paulo)`
3. Espere o projeto ficar pronto (~2 min).
4. No menu lateral, abra o **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/migrations/0001_initial.sql` desta pasta, copie **todo** o conteúdo, cole no editor e clique em **Run**. Deve aparecer "Success".
6. Ainda no Supabase, vá em **Authentication → Sign In / Up** (ou Providers) e em **Email** **desative** a opção "Confirm email". Isso deixa você criar sua conta e entrar direto, sem confirmação. (Pode reativar depois que a equipe toda estiver cadastrada.)
7. Vá em **Project Settings → API** e deixe essa aba aberta — você vai precisar de dois valores:
   - **Project URL** (algo como `https://abcd1234.supabase.co`)
   - **anon public key** (um texto longo)

## Parte 2 — Subir o código (GitHub) · ~10 min

1. Acesse **github.com** e crie uma conta gratuita.
2. Clique em **+** (canto superior direito) → **New repository**:
   - Nome: `newfeed-crm`
   - Marque **Private**
   - Clique em **Create repository**
3. Na página do repositório, clique em **uploading an existing file**.
4. Abra a pasta `CRM/app` no seu computador, selecione **todos os arquivos e pastas** de dentro dela e arraste para a página do GitHub.
   - ⚠️ Arraste o **conteúdo** da pasta `app`, não a pasta em si.
   - Se alguma pasta não subir arrastando, use o botão "choose your files".
5. Clique em **Commit changes** e espere terminar.

## Parte 3 — Publicar (Vercel) · ~10 min

1. Acesse **vercel.com** e clique em **Sign Up** → **Continue with GitHub** (use a conta que acabou de criar).
2. Clique em **Add New → Project** e escolha o repositório `newfeed-crm` → **Import**.
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione as duas variáveis (valores da aba do Supabase que ficou aberta):
   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | a Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a anon public key |
4. Clique em **Deploy** e espere (~2 min).
5. Pronto! A Vercel mostra o endereço do seu CRM (algo como `newfeed-crm.vercel.app`). Salve nos favoritos — funciona no computador e no celular.

## Parte 4 — Primeiro acesso

1. Abra o endereço do CRM e clique em **Primeira vez? Criar conta**.
2. **A primeira conta criada vira administrador automaticamente** — crie a sua antes de convidar a equipe.
3. Primeiros passos dentro do sistema:
   1. **Caixa** → informe o saldo atual do banco/conta da agência em "Saldo inicial" e a data de hoje.
   2. **Clientes** → cadastre seus clientes.
   3. **Receitas** → lance as mensalidades (marque "Recorrente por 12 meses" para gerar o ano todo).
   4. **Despesas** → lance aluguel, ferramentas, salários etc. com a recorrência certa.
   5. Volte ao **Dashboard**: seus números estarão vivos.

---

## Dúvidas comuns

**Errei algo no Supabase, posso rodar o SQL de novo?**
Não na mesma base (vai dar erro de "already exists"). Mais fácil: apague o projeto no Supabase, crie outro e rode o SQL de novo.

**Como adiciono alguém da equipe?**
Peça para a pessoa criar conta na tela de login. Ela entra como "visualizador"; a gestão fina de papéis chega na Entrega 5.

**Meus dados estão seguros?**
Sim: o banco exige login para qualquer acesso (RLS ativa), a conexão é HTTPS e o Supabase faz backup automático diário.

**E se eu quiser mudar algo no sistema?**
Volte ao Claude com o pedido — os próximos módulos (contratos, equipamentos, relatórios, exportação PDF/Excel) já estão planejados nos docs da pasta `CRM/docs`.
