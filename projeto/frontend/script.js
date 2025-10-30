const API = "http://127.0.0.1:5000";

let token = localStorage.getItem("token"); // Tenta carregar o token imediatamente
const listaTarefas = document.getElementById("listaTarefas"); 

// Variáveis que serão preenchidas no bloco de inicialização (abaixo)
let usuario, senha, msgLogin;
let titulo, descricao, data, prioridade, categoria, status;

// Função para fazer o binding dos elementos no HTML
function initializeDOM() {
    if (document.getElementById("usuario")) {
        // PÁGINA: index.html (Login)
        usuario = document.getElementById("usuario");
        senha = document.getElementById("senha");
        msgLogin = document.getElementById("msgLogin");
        
        // Conexão do botão Login (já estava correta no HTML)
    }

    if (document.getElementById("titulo")) {
        // PÁGINA: tarefas.html
        titulo = document.getElementById("titulo");
        descricao = document.getElementById("descricao");
        data = document.getElementById("data"); 
        prioridade = document.getElementById("prioridade");
        categoria = document.getElementById("categoria");
        status = document.getElementById("status");
        
        // Conexão do botão Adicionar Tarefa
    }
}
// Chamada da função de inicialização
initializeDOM();

// Função de Login
function login() {
    // Verifica se os campos existem antes de tentar acessar o .value
    if (!usuario || !senha) {
        console.error("Erro de DOM: Elementos de usuário ou senha não encontrados.");
        return;
    }
    
    fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario: usuario.value,
            senha: senha.value
        })
    })
    .then(r => {
        if (!r.ok) { 
            return r.json().then(data => { 
                if (msgLogin) {
                    msgLogin.textContent = data.erro || "Erro desconhecido ao tentar logar.";
                }
                throw new Error(data.erro); 
            });
        }
        return r.json(); 
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location = "tarefas.html";
        }
    })
    .catch(error => {
        console.error("Erro no processo de login:", error);
    });
}

// Função de Logout
function logout() {
    localStorage.removeItem("token");
    window.location = "index.html";
}

// Carregar Tarefas (GET)
function carregarTarefas() {
    if (!token || !listaTarefas) return;

    fetch(`${API}/tarefas`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
        if (r.status === 401) {
            console.error("Token de autenticação inválido ou expirado. Redirecionando...");
            logout();
            throw new Error("Token expirado.");
        }
        return r.json();
    })
    .then(tarefas => {
        listaTarefas.innerHTML = "";
        tarefas.forEach(t => criarCard(t));
    })
    .catch(error => {
        console.error("Erro ao carregar tarefas:", error);
    });
}

// Adicionar Tarefa
function adicionarTarefa() {
    if (!token || !titulo) {
        console.error("Erro: Não foi possível carregar o token ou elementos de formulário.");
        return;
    }
    
    const dados = {
        titulo: titulo.value,
        descricao: descricao.value,
        data_entrega: data.value,
        prioridade: prioridade.value,
        categoria: categoria.value,
        status: status.value
    };
    
    // Verificação simples se o título não está vazio
    if (!dados.titulo || !dados.descricao) {
        alert("O título e a descrição são obrigatórios!");
        return;
    }

    fetch(`${API}/tarefas`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dados)
    })
    .then(r => {
        if (r.status === 401) {
            logout(); 
            throw new Error("Token expirado.");
        }
        if (r.ok) {
            // Limpa os campos após a adição bem-sucedida
            titulo.value = '';
            descricao.value = '';
            data.value = '';
            carregarTarefas(); // Recarrega a lista
        } else {
            return r.json().then(data => { 
                alert(`Erro ao adicionar: ${data.erro}`);
                throw new Error(data.erro);
            });
        }
    })
    .catch(error => {
        console.error("Erro ao adicionar tarefa:", error);
    });
}

// Edição de Tarefa
function editarTarefa(id, novosDados) {
    if (!token) return;

    fetch(`${API}/tarefas/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(novosDados)
    })
    .then(r => {
        if (r.status === 401) {
            logout();
            throw new Error("Token expirado.");
        }
        if (r.ok) {
            carregarTarefas(); 
        } else {
            return r.json().then(data => {
                console.error("Erro na edição:", data);
            });
        }
    })
    .catch(error => {
        console.error("Erro na comunicação para editar tarefa:", error);
    });
}

// Excluir Tarefa
function excluirTarefa(id) {
    if (!token || !confirm(`Tem certeza que deseja excluir a tarefa ${id}?`)) return;

    fetch(`${API}/tarefas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
        if (r.status === 401) {
            logout(); 
            throw new Error("Token expirado.");
        }
        // Status 204 significa No Content (sucesso sem corpo de resposta)
        if (r.ok || r.status === 204) {
             carregarTarefas();
        } else if (r.status === 404) {
            alert("Tarefa já excluída ou não encontrada.");
        }
    })
    .catch(error => {
        console.error("Erro ao excluir tarefa:", error);
    });
}

// Criar card de tarefa
function criarCard(tarefa) {
    const card = document.createElement("div");
    // Classe para estilização de prioridade
    card.className = `card prioridade-${tarefa.prioridade.toLowerCase()}`;
    card.innerHTML = `
        <h3>${tarefa.titulo} (ID: ${tarefa.id})</h3>
        <p>${tarefa.descricao}</p>
        <span>**Entrega:** ${tarefa.data_entrega}</span><br>
        <span>**Categoria:** ${tarefa.categoria}</span><br>
        <span>**Prioridade:** **${tarefa.prioridade}**</span><br>
        <span>**Status:** ${tarefa.status}</span>
        
        <div class="card-actions">
            <button class="edit-btn" onclick="iniciarEdicaoModal(${tarefa.id}, '${tarefa.titulo}', '${tarefa.status}', '${tarefa.descricao}')">Editar Status</button>
            <button class="delete-btn" onclick="excluirTarefa(${tarefa.id})">Excluir</button>
        </div>
    `;
    if (listaTarefas) {
        listaTarefas.appendChild(card);
    }
}

// Gatilho de Edição
function iniciarEdicaoModal(id, currentTitulo, currentStatus, currentDescricao) {
    const novoStatus = prompt(`Alterar status da tarefa "${currentTitulo}" (Status atual: ${currentStatus}). Digite o novo status (Pendente ou Concluída):`);

    if (novoStatus !== null && novoStatus !== "" && (novoStatus.toLowerCase() === 'pendente' || novoStatus.toLowerCase() === 'concluída')) {
        const novosDadosParaAPI = {
            status: novoStatus
            // Para editar tudo, você precisaria de um formulário modal completo
        };
        editarTarefa(id, novosDadosParaAPI);
    } else if (novoStatus !== null && novoStatus !== "") {
         alert("Status inválido. Use 'Pendente' ou 'Concluída'.");
    }
}

// Proteção e carregamento da página tarefas.html
if (window.location.pathname.includes("tarefas.html")) {
    // A variável 'token' já foi carregada no topo do script
    if (!token) {
        window.location = "index.html"; // redireciona se não estiver logado
    } else {
        // As tarefas são carregadas após a verificação
        carregarTarefas();
    }
}