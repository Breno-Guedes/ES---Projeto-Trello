// --- Estado Global (Banco de dados em memória) ---
const cardDataStore = new Map();
// Começa em 5 pois já temos 4 cards fixos no HTML
let cardIdCounter = 5; 

// Populando dados para os cards iniciais que estão no HTML
// Card 1: Backlog
cardDataStore.set('card-1', {
    comments: [
        { text: "Precisamos marcar reunião com o cliente.", date: "15/01/2026 09:30" },
        { text: "Já enviei o e-mail.", date: "15/01/2026 10:15" }
    ],
    attachments: ["Briefing.pdf"]
});

// Card 2: A Fazer
cardDataStore.set('card-2', {
    comments: [],
    attachments: []
});

// Card 3: Fazendo
cardDataStore.set('card-3', {
    comments: [
        { text: "API de autenticação está dando erro 500.", date: "14/01/2026 16:20" },
        { text: "Corrigido. Era uma variável de ambiente.", date: "14/01/2026 17:00" },
        { text: "Testando com JWT agora.", date: "15/01/2026 08:00" },
        { text: "Tudo ok no ambiente local.", date: "15/01/2026 11:00" },
        { text: "Subindo para homologação.", date: "15/01/2026 11:30" }
    ],
    attachments: ["Log_Erro.txt", "Print_Erro.png"]
});

// Card 4: Concluído
cardDataStore.set('card-4', {
    comments: [{ text: "Ambiente configurado com Docker.", date: "10/01/2026 14:00" }],
    attachments: []
});

// --- Elementos do DOM ---
const modal = document.getElementById('card-modal');
const modalTitle = document.getElementById('modal-card-title');
const commentsList = document.getElementById('comments-list');
const attachmentList = document.getElementById('attachment-list');
const commentInput = document.getElementById('new-comment-text');
const fileInput = document.getElementById('file-input');

// Elementos do Modal de Delete
const deleteModal = document.getElementById('delete-modal');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');

let currentOpenCardId = null;
let cardToDeleteId = null;

// --- Funções Drag & Drop ---
function addDragEvents(card) {
    card.addEventListener('dragstart', e => {
        e.currentTarget.classList.add('dragging');
    });

    card.addEventListener('dragend', e => {
        e.currentTarget.classList.remove('dragging');
    });
}

// --- Interações do Card (Delete e Detalhes) ---
function addCardInteractions(card) {
    // Botão de Excluir (Abre Modal de Confirmação)
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(card.id);
        });
    }

    // Clique no Card (Ícone Comentário ou Anexo ou Corpo) para abrir Detalhes
    // Vamos adicionar o evento ao card inteiro, mas ignorar se clicar no delete
    card.addEventListener('click', (e) => {
        // Se clicou no botão de delete ou dentro dele, não abre o modal de detalhes
        if (e.target.closest('.btn-delete')) return;
        
        openModal(card.id, card.querySelector('.card-title').innerText);
    });
}

// --- Lógica Modal de Delete ---
function openDeleteModal(cardId) {
    cardToDeleteId = cardId;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    cardToDeleteId = null;
    deleteModal.classList.add('hidden');
}

btnCancelDelete.addEventListener('click', closeDeleteModal);

btnConfirmDelete.addEventListener('click', () => {
    if (cardToDeleteId) {
        const card = document.getElementById(cardToDeleteId);
        if (card) {
            card.remove(); // Remove do DOM
            cardDataStore.delete(cardToDeleteId); // Remove da memória
        }
        closeDeleteModal();
    }
});

// Fechar modal de delete clicando fora
deleteModal.addEventListener('click', (e) => {
    if(e.target === deleteModal) closeDeleteModal();
});


// --- Lógica Modal de Detalhes ---
function openModal(cardId, title) {
    currentOpenCardId = cardId;
    modalTitle.innerText = title;
    
    // Cria entrada vazia se não existir
    if (!cardDataStore.has(cardId)) {
        cardDataStore.set(cardId, { comments: [], attachments: [] });
    }

    renderModalContent();
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    currentOpenCardId = null;
}

function renderModalContent() {
    const data = cardDataStore.get(currentOpenCardId);
    
    // Renderiza Comentários
    commentsList.innerHTML = '';
    if (data.comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #ccc; font-style: italic; font-size: 13px;">Nenhum comentário ainda.</p>';
    } else {
        data.comments.forEach(comment => {
            const div = document.createElement('div');
            div.classList.add('comment-item');
            div.innerHTML = `
                <div class="comment-header"><span>Usuário</span> <span>${comment.date}</span></div>
                <div>${comment.text}</div>
            `;
            commentsList.appendChild(div);
        });
    }

    // Renderiza Anexos
    attachmentList.innerHTML = '';
    if (data.attachments.length === 0) {
        attachmentList.innerHTML = '<li style="background: transparent; border: none; padding: 0; color: #ccc;">Nenhum anexo.</li>';
    } else {
        data.attachments.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-file-lines" style="color: #4f46e5;"></i> ${file}`;
            attachmentList.appendChild(li);
        });
    }
}

function updateCardCounters(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const data = cardDataStore.get(cardId);
    
    const commentCount = card.querySelector('.count-comments');
    const attachCount = card.querySelector('.count-attachments');

    if (commentCount) commentCount.innerText = data.comments.length;
    if (attachCount) attachCount.innerText = data.attachments.length;
}

// Eventos Modal Detalhes
document.getElementById('close-modal').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Salvar Comentário
document.getElementById('btn-save-comment').addEventListener('click', () => {
    const text = commentInput.value.trim();
    if (!text || !currentOpenCardId) return;

    const data = cardDataStore.get(currentOpenCardId);
    data.comments.push({
        text: text,
        date: new Date().toLocaleString()
    });

    commentInput.value = '';
    renderModalContent();
    updateCardCounters(currentOpenCardId);
});

// Adicionar Anexo
document.getElementById('btn-add-attachment').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0 && currentOpenCardId) {
        const fileName = e.target.files[0].name;
        const data = cardDataStore.get(currentOpenCardId);
        
        data.attachments.push(fileName);
        
        renderModalContent();
        updateCardCounters(currentOpenCardId);
        
        fileInput.value = ''; 
    }
});


// --- Inicialização e Drag & Drop das Colunas ---

// Inicializa cards existentes
document.querySelectorAll('.kanban-card').forEach(card => {
    addDragEvents(card);
    addCardInteractions(card);
});

// Drop zones
document.querySelectorAll('.kanban-cards').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        e.currentTarget.classList.add('cards-hover');
    });

    column.addEventListener('dragleave', e => {
        e.currentTarget.classList.remove('cards-hover');
    });

    column.addEventListener('drop', e => {
        e.currentTarget.classList.remove('cards-hover');
        const dragCard = document.querySelector('.kanban-card.dragging');
        if (dragCard) {
            e.currentTarget.appendChild(dragCard);
        }
    });
});

// Adicionar Novo Card (Formulário)
const addButtons = document.querySelectorAll('.add-card');

addButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Encontra o container da coluna correta
        const titleArea = e.target.closest('.kanban-title');
        const column = titleArea.parentElement;
        const cardsContainer = column.querySelector('.kanban-cards');
        
        if (column.querySelector('.new-card-form')) return;

        const form = document.createElement('div');
        form.classList.add('new-card-form');
        form.innerHTML = `
            <textarea placeholder="Título da tarefa..." rows="2"></textarea>
            <select>
                <option value="low">Baixa Prioridade</option>
                <option value="medium">Média Prioridade</option>
                <option value="high">Alta Prioridade</option>
            </select>
            <div class="form-actions">
                <button class="form-btn btn-cancel">Cancelar</button>
                <button class="form-btn btn-confirm">Adicionar</button>
            </div>
        `;

        cardsContainer.prepend(form);
        const textarea = form.querySelector('textarea');
        textarea.focus();

        form.querySelector('.btn-cancel').addEventListener('click', () => {
            form.remove();
        });

        form.querySelector('.btn-confirm').addEventListener('click', () => {
            const title = textarea.value.trim();
            const priority = form.querySelector('select').value;
            
            if (title === "") return;

            createCard(cardsContainer, title, priority);
            form.remove();
        });
    });
});

function createCard(container, title, priority) {
    const cardId = `card-${cardIdCounter++}`;
    const card = document.createElement('div');
    card.classList.add('kanban-card');
    card.setAttribute('draggable', 'true');
    card.id = cardId;

    cardDataStore.set(cardId, { comments: [], attachments: [] });

    let badgeText = '';
    let badgeClass = priority;

    switch(priority) {
        case 'high': badgeText = 'Alta prioridade'; break;
        case 'medium': badgeText = 'Média prioridade'; break;
        case 'low': badgeText = 'Baixa prioridade'; break;
    }

    card.innerHTML = `
        <div class="card-header">
            <div class="badge ${badgeClass}"><span>${badgeText}</span></div>
            <button class="btn-delete" title="Excluir card"><i class="fa-solid fa-trash"></i></button>
        </div>
        <p class="card-title">${title}</p>
        <div class="card-infos">
            <div class="card-icons">
                <p class="icon-comment"><i class="fa-regular fa-comment"></i> <span class="count-comments">0</span></p>
                <p class="icon-attach"><i class="fa-solid fa-paperclip"></i> <span class="count-attachments">0</span></p>
            </div>
            <div class="user">
                <img src="src/imagens/avatar2.png" alt="Avatar">
            </div>
        </div>
    `;

    addDragEvents(card);
    addCardInteractions(card);
    container.prepend(card);
}