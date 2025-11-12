# Organizador Tick

## Descrição
O Tick é uma aplicação desenvolvida para auxiliar usuários no gerenciamento de suas tarefas diárias, oferecendo controle de prioridades, prazos e organização eficiente das atividades.

### Funcionalidades
Cadastro de tarefas

Título da tarefa

Descrição detalhada

Nível de prioridade

Data de entrega (deadline)

Edição de tarefas existentes

Exclusão de tarefas concluídas

Sistema de autenticação de usuários

Cadastro e login

Logout com encerramento seguro da sessão

## Tecnologias utilizadas
Front-end: HTML, CSS, JavaScript
Back-end: Python Flask, Flask-JWT-Extended (Autenticação)

## Estrtura do projeto
```
Tick/
├── frontend/
│   ├── index.html
│   ├── tarefas.html
│   ├── style.css
│   └── script.js
└── backend/
    ├── app.py (ou server.py)
    ├── database.json (opcional)
    └── requirements.txt
```

## Instrução de instalação
Backend:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
A API irá rodar em:

http://127.0.0.1:5000

Frontend: 
Basta abrir o arquivo:
```bash
frontend/index.html
```
Obs: Para evitar problemas de CORS, recomenda-se usar Live Server ou servir com um host local.

### Fluxo de Uso

Usuário acessa index.html → Insere credenciais (obs: as credenciais para teste por enquanto são: usuario= admin.  senha=123)

Token é armazenado → usuário é direcionado para tarefas.html

Pode criar, listar, editar e excluir tarefas

Logout remove o token e retorna para login

## 👨‍💻 Autores

<a href="https://github.com/Yago-crv" target="_blank">Yago Carvalho</a>

<a href="https://github.com/p91561145" target="_blank"> Pedro Melo</a>
