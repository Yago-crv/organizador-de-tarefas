from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import json
from datetime import timedelta
from flask_cors import CORS
import sys

# Inicializa o Flask
app = Flask(__name__)
# Configurações do JWT
app.config["JWT_SECRET_KEY"] = "chave-secreta-super-segura" # Mude isso em produção!
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=2)

CORS(app) # Permite que o front-end acesse a API
jwt = JWTManager(app)

# ==============================
# MODELOS
# ==============================
class Usuario:
    def __init__(self, usuario, senha):
        self.usuario = usuario
        self.senha = senha


class Tarefa:
    def __init__(self, id_tarefa, titulo, descricao, data_entrega, prioridade, categoria, status):
        # Garante que id_tarefa seja um inteiro
        self.id_tarefa = int(id_tarefa) 
        self.titulo = titulo
        self.descricao = descricao
        self.data_entrega = data_entrega
        self.prioridade = prioridade
        self.categoria = categoria
        self.status = status

    def to_dict(self):
        return {
            "id": self.id_tarefa,
            "titulo": self.titulo,
            "descricao": self.descricao,
            "data_entrega": self.data_entrega,
            "prioridade": self.prioridade,
            "categoria": self.categoria,
            "status": self.status
        }


# ==============================
# GERENCIADORES
# ==============================
class SistemaLogin:
    def __init__(self):
        # Usuário de teste
        self.usuarios = {"admin": Usuario("admin", "123")}

    def autenticar(self, usuario, senha):
        return usuario in self.usuarios and self.usuarios[usuario].senha == senha


class GerenciadorTarefas:
    def __init__(self, arquivo_dados="tarefas.json"):
        self.arquivo_dados = arquivo_dados
        self.tarefas = []
        self.carregar_tarefas()

    def salvar_tarefas(self):
        try:
            with open(self.arquivo_dados, "w", encoding="utf-8") as f:
                json.dump([t.to_dict() for t in self.tarefas], f, indent=4, ensure_ascii=False)
        except IOError as e:
            print(f"ERRO ao salvar tarefas: {e}", file=sys.stderr)

    def carregar_tarefas(self):
        try:
            with open(self.arquivo_dados, "r", encoding="utf-8") as f:
                dados = json.load(f)
                self.tarefas = [
                    Tarefa(
                        d["id"], 
                        d["titulo"],
                        d["descricao"],
                        d["data_entrega"],
                        d["prioridade"],
                        d["categoria"],
                        d["status"]
                    ) for d in dados
                ]
        except FileNotFoundError:
            self.tarefas = []
        except json.JSONDecodeError:
            print("AVISO: Arquivo tarefas.json mal formatado ou vazio. Iniciando com lista vazia.", file=sys.stderr)
            self.tarefas = []


    def adicionar_tarefa(self, titulo, descricao, data_entrega, prioridade, categoria, status):
        # Calcula o próximo ID de forma segura (maior ID + 1)
        novo_id = max((t.id_tarefa for t in self.tarefas), default=0) + 1
            
        tarefa = Tarefa(novo_id, titulo, descricao, data_entrega, prioridade, categoria, status)
        self.tarefas.append(tarefa)
        self.salvar_tarefas()
        return tarefa

    def listar_tarefas(self):
        return [t.to_dict() for t in self.tarefas]

    def buscar_tarefa(self, termo):
        termo = termo.lower()
        return [t.to_dict() for t in self.tarefas if termo in t.titulo.lower() or termo in t.descricao.lower()]

    def editar_tarefa(self, id_tarefa, **novos_dados):
        id_tarefa = int(id_tarefa)
        for t in self.tarefas:
            if t.id_tarefa == id_tarefa:
                # Atualiza apenas os campos passados
                t.titulo = novos_dados.get("titulo", t.titulo)
                t.descricao = novos_dados.get("descricao", t.descricao)
                t.data_entrega = novos_dados.get("data_entrega", t.data_entrega)
                t.prioridade = novos_dados.get("prioridade", t.prioridade)
                t.categoria = novos_dados.get("categoria", t.categoria)
                t.status = novos_dados.get("status", t.status)
                self.salvar_tarefas()
                return t.to_dict()
        return None

    def excluir_tarefa(self, id_tarefa):
        id_tarefa = int(id_tarefa)
        # Usando list comprehension para criar uma nova lista sem a tarefa
        tamanho_original = len(self.tarefas)
        self.tarefas = [t for t in self.tarefas if t.id_tarefa != id_tarefa]
        
        if len(self.tarefas) < tamanho_original:
            self.salvar_tarefas()
            return True
        return False


login_system = SistemaLogin()
gerenciador = GerenciadorTarefas()


# ==============================
# ROTAS DA API
# ==============================

@app.route("/login", methods=["POST"])
def autenticar_usuario():
    data = request.json
    usuario = data.get("usuario")
    senha = data.get("senha")

    if login_system.autenticar(usuario, senha):
        token = create_access_token(identity=usuario)
        return jsonify({"mensagem": "Login OK!", "token": token})
    return jsonify({"erro": "Usuário ou senha inválidos"}), 401


@app.route("/tarefas", methods=["GET"])
@jwt_required()
def listar_tarefas():
    return jsonify(gerenciador.listar_tarefas())


@app.route("/tarefas", methods=["POST"])
@jwt_required()
def adicionar_tarefa():
    data = request.json
    # Validação simples de campos obrigatórios
    campos_obrigatorios = ["titulo", "descricao", "data_entrega", "prioridade", "categoria", "status"]
    
    if not all(field in data for field in campos_obrigatorios):
        return jsonify({"erro": "Faltam campos obrigatórios na tarefa."}), 400

    try:
        tarefa = gerenciador.adicionar_tarefa(**data)
        return jsonify(tarefa.to_dict()), 201
    except Exception as e:
        print(f"Erro ao adicionar tarefa: {e}", file=sys.stderr)
        return jsonify({"erro": "Erro interno ao processar a tarefa."}), 500


@app.route("/tarefas/buscar", methods=["GET"])
@jwt_required()
def buscar_tarefa():
    termo = request.args.get("q", "")
    return jsonify(gerenciador.buscar_tarefa(termo))


@app.route("/tarefas/<int:id_tarefa>", methods=["PUT"])
@jwt_required()
def editar_tarefa(id_tarefa):
    data = request.json
    resp = gerenciador.editar_tarefa(id_tarefa, **data)
    if resp:
        return jsonify(resp)
    return jsonify({"erro": "Tarefa não encontrada"}), 404


@app.route("/tarefas/<int:id_tarefa>", methods=["DELETE"])
@jwt_required()
def excluir_tarefa(id_tarefa):
    if gerenciador.excluir_tarefa(id_tarefa):
        # 204 No Content é o padrão para DELETE bem-sucedido
        return '', 204 
    return jsonify({"erro": "Tarefa não encontrada"}), 404


if __name__ == "__main__":
    # Use '0.0.0.0' para acessar de outros dispositivos na mesma rede local
    app.run(debug=True, host='127.0.0.1', port=5000) 
