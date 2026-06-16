// ====================== VARIÁVEIS GLOBAIS ======================
let produtos = [];           // Array para armazenar todos os produtos
let orcamentoDisponivel = 0; // Número para armazenar o orçamento

// ====================== REFERÊNCIAS DO DOM ======================
// DOM = Document Object Model - representa a estrutura da página HTML
const produtoNomeInput = document.getElementById('produtoNome');
const produtoPrecoInput = document.getElementById('produtoPreco');
const produtoPrioridadeSelect = document.getElementById('produtoPrioridade');
const adicionarBtn = document.getElementById('adicionarBtn');
const salvarOrcamentoBtn = document.getElementById('salvarOrcamentoBtn');
const orcamentoInput = document.getElementById('orcamento');
const totalCompraSpan = document.getElementById('totalCompra');
const restanteSpan = document.getElementById('restante');
const alertaOrcamentoDiv = document.getElementById('alertaOrcamento');
const listaProdutosDiv = document.getElementById('listaProdutos');
const sugestoesContainer = document.getElementById('sugestoesContainer');

// ====================== FUNÇÕES DE PERSISTÊNCIA (LOCALSTORAGE) ======================

// Salvar dados no LocalStorage
function salvarDados() {
    // O LocalStorage só aceita strings (texto)
    // JSON.stringify converte objetos/arrays em string JSON
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('orcamento', orcamentoDisponivel.toString());
}

// Carregar dados do LocalStorage
function carregarDados() {
    // localStorage.getItem busca os dados pela chave
    const produtosSalvos = localStorage.getItem('produtos');
    const orcamentoSalvo = localStorage.getItem('orcamento');
    
    if (produtosSalvos) {
        // JSON.parse converte string JSON de volta para objeto/array
        produtos = JSON.parse(produtosSalvos);
    }
    
    if (orcamentoSalvo) {
        orcamentoDisponivel = parseFloat(orcamentoSalvo);
        orcamentoInput.value = orcamentoDisponivel;
    }
}

// ====================== FUNÇÕES DE CÁLCULO ======================

// Calcular o total da compra (soma todos os preços dos produtos)
function calcularTotalCompra() {
    // reduce percorre o array e acumula um valor
    // soma todos os preços dos produtos
    const total = produtos.reduce((soma, produto) => soma + produto.preco, 0);
    return total;
}

// Calcular quanto resta do orçamento
function calcularRestante() {
    return orcamentoDisponivel - calcularTotalCompra();
}

// Atualizar exibição do orçamento na tela
function atualizarDisplayOrcamento() {
    const total = calcularTotalCompra();
    const restante = calcularRestante();
    
    // toFixed(2) formata com 2 casas decimais
    totalCompraSpan.textContent = total.toFixed(2);
    restanteSpan.textContent = restante.toFixed(2);
    
    // Verificar se estourou o orçamento
    if (restante < 0) {
        alertaOrcamentoDiv.innerHTML = '⚠️ ATENÇÃO: Você ultrapassou o orçamento disponível! ⚠️';
        alertaOrcamentoDiv.className = 'alerta estouro';
    } else {
        alertaOrcamentoDiv.innerHTML = 'Orçamento dentro do limite!';
        alertaOrcamentoDiv.className = 'alerta ok';
    }
}

// ====================== FUNÇÃO DE SUGESTÃO INTELIGENTE ======================

function gerarSugestoes() {
    // Limpar sugestões anteriores
    sugestoesContainer.innerHTML = '';
    
    const total = calcularTotalCompra();
    const restante = calcularRestante();
    
    // Só gerar sugestões se estourou o orçamento
    if (restante >= 0) {
        sugestoesContainer.innerHTML = '<p class="sem-sugestoes" Orçamento OK! Nenhuma sugestão necessária.</p>';
        return;
    }
    
    // Valor que precisa ser economizado (quanto está acima do orçamento)
    const valorExcedente = Math.abs(restante);
    
    // Separar produtos por prioridade (apenas produtos NÃO comprados)
    // filter cria um novo array com produtos que atendem à condição
    const produtosNaoComprados = produtos.filter(p => p.status !== 'Comprado');
    
    const produtosBaixa = produtosNaoComprados.filter(p => p.prioridade === 'Baixa');
    const produtosMedia = produtosNaoComprados.filter(p => p.prioridade === 'Média');
    const produtosAlta = produtosNaoComprados.filter(p => p.prioridade === 'Alta');
    
    let sugestoes = [];
    let valorEconomizado = 0;
    
    // Sugerir remover primeiro produtos de prioridade BAIXA
    for (let produto of produtosBaixa) {
        if (valorEconomizado < valorExcedente) {
            sugestoes.push(produto);
            valorEconomizado += produto.preco;
        } else {
            break;
        }
    }
    
    // Se ainda não foi suficiente, sugerir produtos de prioridade MÉDIA
    for (let produto of produtosMedia) {
        if (valorEconomizado < valorExcedente) {
            sugestoes.push(produto);
            valorEconomizado += produto.preco;
        } else {
            break;
        }
    }
    
    // Se ainda não foi suficiente, sugerir produtos de prioridade ALTA
    for (let produto of produtosAlta) {
        if (valorEconomizado < valorExcedente) {
            sugestoes.push(produto);
            valorEconomizado += produto.preco;
        } else {
            break;
        }
    }
    
    // Exibir sugestões na tela
    if (sugestoes.length > 0) {
        const titulo = document.createElement('p');
        titulo.innerHTML = `<strong>💡 Para ficar dentro do orçamento, considere remover:</strong>`;
        titulo.style.marginBottom = '10px';
        sugestoesContainer.appendChild(titulo);
        
        sugestoes.forEach(produto => {
            const sugestaoDiv = document.createElement('div');
            sugestaoDiv.className = 'sugestao-item';
            sugestaoDiv.innerHTML = `
                🛍️ ${produto.nome} - R$ ${produto.preco.toFixed(2)} 
                (Prioridade: ${produto.prioridade})
                <button onclick="sugerirRemover('${produto.id}')" class="btn-danger" style="margin-left: 10px;">Remover</button>
            `;
            sugestoesContainer.appendChild(sugestaoDiv);
        });
    } else {
        sugestoesContainer.innerHTML = '<p class="sem-sugestoes">⚠️ Mesmo removendo todos os produtos, ainda será necessário aumentar o orçamento!</p>';
    }
}

// Função chamada pelo botão de remover nas sugestões
function sugerirRemover(id) {
    excluirProduto(id);
}

// ====================== FUNÇÃO PARA RENDERIZAR A LISTA (READ) ======================

function renderizarLista() {
    // Limpar a div da lista
    listaProdutosDiv.innerHTML = '';
    
    // Verificar se não há produtos
    if (produtos.length === 0) {
        listaProdutosDiv.innerHTML = '<p class="lista-vazia">Nenhum produto cadastrado.</p>';
        return;
    }
    
    // Percorrer o array de produtos e criar elementos HTML para cada um
    produtos.forEach(produto => {
        // Criar o card do produto
        const produtoCard = document.createElement('div');
        produtoCard.className = 'produto-card';
        
        // Adicionar classe de status comprado para estilização
        if (produto.status === 'Comprado') {
            produtoCard.classList.add('status-comprado');
        }
        
        // Definir a cor da prioridade
        let prioridadeClass = '';
        if (produto.prioridade === 'Alta') prioridadeClass = 'prioridade-alta';
        else if (produto.prioridade === 'Média') prioridadeClass = 'prioridade-media';
        else prioridadeClass = 'prioridade-baixa';
        
        // Criar div com as informações do produto
        const infoDiv = document.createElement('div');
        infoDiv.className = 'produto-info';
        infoDiv.innerHTML = `
            <span class="produto-nome">${produto.nome}</span>
            <span class="produto-preco">R$ ${produto.preco.toFixed(2)}</span>
            <span class="${prioridadeClass}">🎯 ${produto.prioridade}</span>
            <span>📌 Status: ${produto.status}</span>
        `;
        
        // Criar div com os botões de ação
        const acoesDiv = document.createElement('div');
        acoesDiv.className = 'produto-acoes';
        
        // Botão para alternar status (Pendente <-> Comprado)
        const toggleStatusBtn = document.createElement('button');
        toggleStatusBtn.textContent = produto.status === 'Pendente' ? '✅ Marcar Comprado' : '🔄 Marcar Pendente';
        toggleStatusBtn.className = 'btn-warning';
        toggleStatusBtn.onclick = () => alternarStatus(produto.id);
        
        // Botão para editar
        const editarBtn = document.createElement('button');
        editarBtn.textContent = '✏️ Editar';
        editarBtn.className = 'btn-primary';
        editarBtn.onclick = () => editarProduto(produto.id);
        
        // Botão para excluir
        const excluirBtn = document.createElement('button');
        excluirBtn.textContent = '🗑️ Excluir';
        excluirBtn.className = 'btn-danger';
        excluirBtn.onclick = () => excluirProduto(produto.id);
        
        acoesDiv.appendChild(toggleStatusBtn);
        acoesDiv.appendChild(editarBtn);
        acoesDiv.appendChild(excluirBtn);
        
        produtoCard.appendChild(infoDiv);
        produtoCard.appendChild(acoesDiv);
        
        listaProdutosDiv.appendChild(produtoCard);
    });
}

// ====================== FUNÇÃO PARA ADICIONAR PRODUTO (CREATE) ======================

function adicionarProduto() {
    // Obter valores dos inputs
    const nome = produtoNomeInput.value.trim(); // trim remove espaços extras
    const preco = parseFloat(produtoPrecoInput.value);
    const prioridade = produtoPrioridadeSelect.value;
    
    // Validação: verificar se os campos estão preenchidos corretamente
    if (nome === '') {
        alert('Por favor, digite o nome do produto!');
        return;
    }
    
    if (isNaN(preco) || preco <= 0) {
        alert('Por favor, digite um preço válido (maior que zero)!');
        return;
    }
    
    // Criar objeto do produto
    // Date.now() gera um ID único baseado no timestamp atual
    const novoProduto = {
        id: Date.now().toString(), // ID único
        nome: nome,
        preco: preco,
        prioridade: prioridade,
        status: 'Pendente' // Status inicial
    };
    
    // Adicionar ao array de produtos
    produtos.push(novoProduto);
    
    // Salvar no LocalStorage
    salvarDados();
    
    // Atualizar a interface
    renderizarLista();
    atualizarDisplayOrcamento();
    gerarSugestoes();
    
    // Limpar os campos do formulário
    produtoNomeInput.value = '';
    produtoPrecoInput.value = '';
    produtoPrioridadeSelect.value = 'Alta';
    
    // Focar no campo nome para facilitar próxima adição
    produtoNomeInput.focus();
}

// ====================== FUNÇÃO PARA ALTERNAR STATUS (UPDATE) ======================

function alternarStatus(id) {
    // find procura um produto pelo ID no array
    const produto = produtos.find(p => p.id === id);
    
    if (produto) {
        // Alternar entre 'Pendente' e 'Comprado'
        produto.status = produto.status === 'Pendente' ? 'Comprado' : 'Pendente';
        
        // Salvar e atualizar
        salvarDados();
        renderizarLista();
        atualizarDisplayOrcamento();
        gerarSugestoes();
    }
}

// ====================== FUNÇÃO PARA EDITAR PRODUTO (UPDATE) ======================

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    
    if (!produto) return;
    
    // Solicitar novos valores ao usuário (prompt é uma caixa de diálogo simples)
    const novoNome = prompt('Digite o novo nome do produto:', produto.nome);
    if (novoNome && novoNome.trim() !== '') {
        produto.nome = novoNome.trim();
    }
    
    const novoPreco = prompt('Digite o novo preço do produto:', produto.preco);
    if (novoPreco && !isNaN(parseFloat(novoPreco)) && parseFloat(novoPreco) > 0) {
        produto.preco = parseFloat(novoPreco);
    }
    
    const novaPrioridade = prompt('Digite a nova prioridade (Alta, Média ou Baixa):', produto.prioridade);
    if (novaPrioridade && ['Alta', 'Média', 'Baixa'].includes(novaPrioridade)) {
        produto.prioridade = novaPrioridade;
    }
    
    // Salvar e atualizar
    salvarDados();
    renderizarLista();
    atualizarDisplayOrcamento();
    gerarSugestoes();
}

// ====================== FUNÇÃO PARA EXCLUIR PRODUTO (DELETE) ======================

function excluirProduto(id) {
    // Confirmar exclusão com o usuário
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        // filter cria um novo array sem o produto com o ID informado
        produtos = produtos.filter(produto => produto.id !== id);
        
        // Salvar e atualizar
        salvarDados();
        renderizarLista();
        atualizarDisplayOrcamento();
        gerarSugestoes();
    }
}

// ====================== FUNÇÃO PARA SALVAR ORÇAMENTO ======================

function salvarOrcamento() {
    const valor = parseFloat(orcamentoInput.value);
    
    if (isNaN(valor) || valor < 0) {
        alert('Por favor, digite um valor válido para o orçamento!');
        return;
    }
    
    orcamentoDisponivel = valor;
    salvarDados();
    atualizarDisplayOrcamento();
    gerarSugestoes();
    alert('Orçamento salvo com sucesso!');
}

// ====================== INICIALIZAÇÃO DO SISTEMA ======================

function inicializar() {
    // Carregar dados salvos do LocalStorage
    carregarDados();
    
    // Atualizar a interface com os dados carregados
    renderizarLista();
    atualizarDisplayOrcamento();
    gerarSugestoes();
}

// ====================== EVENTOS ======================

// Adicionar evento de clique ao botão
adicionarBtn.addEventListener('click', adicionarProduto);
salvarOrcamentoBtn.addEventListener('click', salvarOrcamento);

// Permitir adicionar produto pressionando Enter nos inputs
produtoNomeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adicionarProduto();
});
produtoPrecoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adicionarProduto();
});

// Inicializar o sistema quando a página carregar
window.addEventListener('DOMContentLoaded', inicializar);