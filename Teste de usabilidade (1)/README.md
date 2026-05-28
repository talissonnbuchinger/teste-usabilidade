# Teste de Usabilidade · Elite

Aplicação estática (HTML + React via Babel/CDN) para condução de testes de usabilidade.

## 🚀 Demo

Após o deploy, acesse: `https://<seu-usuario>.github.io/<nome-do-repo>/`

## 🧱 Stack

- HTML estático + React 18 carregado por CDN
- JSX transpilado no navegador via `@babel/standalone`
- Supabase JS (opcional — sincronização configurável via UI nas Configurações)
- Design tokens do Alfheim Design System

Não há build step. Tudo é servido como arquivo estático.

## 🌐 Hospedar no GitHub Pages

### 1. Criar o repositório

No GitHub, crie um novo repositório (ex.: `teste-usabilidade`).

### 2. Subir os arquivos

A partir desta pasta, no terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/<nome-do-repo>.git
git push -u origin main
```

### 3. Ativar o GitHub Pages

1. No GitHub, abra o repositório → **Settings** → **Pages**
2. Em **Source**, selecione **Deploy from a branch**
3. Em **Branch**, escolha `main` e a pasta `/ (root)`
4. Clique em **Save**

Em ~1 minuto o site estará disponível em:
`https://<seu-usuario>.github.io/<nome-do-repo>/`

### 4. (Opcional) Configurar Supabase

Abra o app → **Configurações** → cole `Project URL` e `anon key` do seu projeto Supabase. As credenciais ficam apenas no `localStorage` do navegador — nada é commitado.

## 📂 Estrutura

```
index.html               ← ponto de entrada (servido pelo GitHub Pages)
Teste de Usabilidade.html ← cópia idêntica do index.html (opcional)
.nojekyll                ← garante que o GH Pages sirva tudo sem processar
app/
  App.jsx                ← raiz React
  Dashboard.jsx
  Editor.jsx
  Settings.jsx
  Common.jsx
  data.js · store.js · supabase.js
  styles.css · tokens.css
```

## ⚠️ Observações

- O `index.html` carrega scripts com caminhos **relativos** (`app/...`), então funciona em qualquer subcaminho (incluindo `username.github.io/repo/`).
- Não é necessário build — basta dar push e ativar o Pages.
- O arquivo `.nojekyll` evita que o GitHub Pages tente processar a pasta com Jekyll (importante porque `app/` poderia conflitar).
