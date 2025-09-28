// Função auxiliar para obter e salvar dados no armazenamento local
const STORAGE_KEY = 'barberShopData';

function getStorageData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        // O Matheus está na inicialização padrão
        return data ? JSON.parse(data) : {
            records: [],
            config: {
                title: 'Painel Barbearia',
                logo: 'logo.jpg',
                users: {
                    pierote: 'ownerpass',
                    luis: 'luis123',
                    matheus: 'matheus123' // Matheus definido aqui
                },
                commissionPct: 40
            }
        };
    } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
        return { records: [], config: {} };
    }
}

function saveStorageData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        alert('Dados salvos com sucesso!');
    } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", e);
        alert('Erro ao salvar dados.');
    }
}

// Variáveis e elementos do DOM
const loginCard = document.getElementById('loginCard');
const actionsCard = document.getElementById('actionsCard');
const reportCard = document.getElementById('reportCard');
const myRecordsCard = document.getElementById('myRecordsCard');
const configCard = document.getElementById('configCard');
const welcomeTxt = document.getElementById('welcomeTxt');
const inpUser = document.getElementById('inpUser');
const inpPass = document.getElementById('inpPass');
const loginBtn = document.getElementById('loginBtn');
const demoBtn = document.getElementById('demoBtn');
const openReportBtn = document.getElementById('openReport');
const myRecordsBtn = document.getElementById('myRecordsBtn');
const configBtn = document.getElementById('configBtn');
const reportList = document.getElementById('recordsList');
const myRecList = document.getElementById('myRecList');
const summaryArea = document.getElementById('summaryArea');
const exportCsvBtn = document.getElementById('exportCsv');
const fromDateInput = document.getElementById('fromDate');
const toDateInput = document.getElementById('toDate');
const applyRangeBtn = document.getElementById('applyRange');
const presetRangeSelect = document.getElementById('presetRange');
const reportUserSelect = document.getElementById('reportUserSelect'); // NOVO: Filtro de Funcionário
const svcBtns = document.querySelectorAll('.svcBtn');
const saveCfgBtn = document.getElementById('saveCfgBtn');
const resetBtn = document.getElementById('resetBtn');

let currentUser = null;
let data = getStorageData();

// Lógica de login
loginBtn.addEventListener('click', () => {
    const user = inpUser.value.toLowerCase();
    const pass = inpPass.value;
    // Verifica se o usuário existe e se a senha está correta
    if (data.config.users[user] && data.config.users[user] === pass) {
        currentUser = user;
        showActions();
    } else {
        alert('Usuário ou senha incorretos.');
    }
});

demoBtn.addEventListener('click', () => {
    currentUser = 'pierote';
    showActions();
});

function populateReportUserSelect() {
    // Adiciona todos os usuários, exceto o proprietário ('pierote'), no filtro
    const users = Object.keys(data.config.users).filter(user => user !== 'pierote');
    reportUserSelect.innerHTML = '<option value="">Todos</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        // Capitaliza a primeira letra para exibir
        option.textContent = user.charAt(0).toUpperCase() + user.slice(1);
        reportUserSelect.appendChild(option);
    });
}

function showActions() {
    loginCard.style.display = 'none';
    actionsCard.style.display = 'block';
    reportCard.style.display = 'none';
    myRecordsCard.style.display = 'none';
    configCard.style.display = 'none';
    welcomeTxt.textContent = Bem-vindo, ${currentUser};

    // Mostra/Esconde botões de proprietário (Relatório e Configuração)
    // Assume que 'pierote' é o proprietário, mas usa a senha de proprietário para garantir
    const isOwner = currentUser === 'pierote';
    openReportBtn.style.display = isOwner ? 'block' : 'none';
    configBtn.style.display = isOwner ? 'block' : 'none';
    
    // NOVO: Preenche a lista de seleção de usuário no relatório
    if (isOwner) {
        populateReportUserSelect();
        reportUserSelect.style.display = 'inline-block';
    } else {
         reportUserSelect.style.display = 'none';
    }
}

// Lógica de registro de serviço
svcBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const serviceName = btn.getAttribute('data-service');
        const priceMatch = btn.textContent.match(/\(R\$(\d+)\)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0; 
        
        const isProduct = ['Pomada', 'Minoxidil'].includes(serviceName);
        // Calcula a comissão de produto como R$5 fixos se for produto, senão usa a porcentagem
        const commission = isProduct ? 5 : (price * data.config.commissionPct / 100);

        const newRecord = {
            id: Date.now(),
            user: currentUser,
            service: serviceName,
            price: price,
            commission: commission,
            isProduct: isProduct,
            date: new Date().toISOString()
        };
        data.records.push(newRecord);
        saveStorageData(data);
        alert(Serviço "${serviceName}" registrado com sucesso para ${currentUser}.);
    });
});

// Lógica de relatório
openReportBtn.addEventListener('click', () => {
    // Garante que o filtro de usuário seja redefinido para 'Todos' ao abrir o relatório
    reportUserSelect.value = ''; 
    showReport();
});

myRecordsBtn.addEventListener('click', () => {
    showMyRecords();
});

function showReport(startDate, endDate, targetUser = reportUserSelect.value) { // Adicionado targetUser
    actionsCard.style.display = 'none';
    myRecordsCard.style.display = 'none';
    configCard.style.display = 'none';
    reportCard.style.display = 'block';

    const isOwner = currentUser === 'pierote';
    
    // Aplica o filtro de usuário (se for dono e tiver um usuário selecionado, usa o selecionado)
    const userToFilter = isOwner && targetUser !== '' ? targetUser : '';

    const filteredRecords = data.records.filter(rec => {
        const recDate = new Date(rec.date);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        
        // Filtro por data
        const dateMatch = recDate >= start && recDate <= end;

        // Filtro por funcionário
        const userMatch = userToFilter === '' || rec.user === userToFilter;

        return dateMatch && userMatch;

    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    renderRecords(filteredRecords, reportList);
    renderSummary(filteredRecords);
}

function showMyRecords() {
    actionsCard.style.display = 'none';
    reportCard.style.display = 'none';
    configCard.style.display = 'none';
    myRecordsCard.style.display = 'block';
    const myFilteredRecords = data.records.filter(rec => rec.user === currentUser)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    renderRecords(myFilteredRecords, myRecList, true);
}

function renderRecords(records, container, showDelete = false) {
    container.innerHTML = '';
    if (records.length === 0) {
        container.innerHTML = '<div class="muted" style="text-align:center;">Nenhum registro encontrado.</div>';
        return;
    }
    records.forEach(rec => {
        const recordDiv = document.createElement('div');
        recordDiv.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        recordDiv.style.padding = '8px 0';
        recordDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${rec.user}</strong> - ${rec.service} (R$${rec.price.toFixed(2)})<br/>
                    <span class="small muted">${new Date(rec.date).toLocaleString('pt-BR')}</span>
                </div>
                <div>
                    <span style="font-weight:bold;color:#eab869;">R$${rec.commission.toFixed(2)}</span>
                    ${showDelete ? <button data-id="${rec.id}" class="deleteBtn small" style="background:none; border:1px solid #f00; color:#f00; padding:2px 6px; border-radius:4px; margin-left:8px;">X</button> : ''}
                </div>
            </div>
        `;
        container.appendChild(recordDiv);
    });

    if (showDelete) {
        container.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm('Tem certeza que deseja apagar este registro?')) {
                    data.records = data.records.filter(rec => rec.id !== id);
                    saveStorageData(data);
                    showMyRecords(); // Recarrega a lista
                }
            });
        });
    }
}

function renderSummary(records) {
    const totalSales = records.reduce((sum, rec) => sum + rec.price, 0);
    const totalCommission = records.reduce((sum, rec) => sum + rec.commission, 0);
    const totalServices = records.length;

    const userSummary = records.reduce((acc, rec) => {
        if (!acc[rec.user]) {
            acc[rec.user] = { sales: 0, commission: 0, count: 0 };
        }
        acc[rec.user].sales += rec.price;
        acc[rec.user].commission += rec.commission;
        acc[rec.user].count++;
        return acc;
    }, {});

    summaryArea.innerHTML = `
        <div style="display:flex;gap:24px;flex-wrap:wrap;border-bottom:1px solid #333;padding-bottom:10px;margin-bottom:10px;">
            <div style="text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#eab869;">R$${totalSales.toFixed(2)}</div>
                <div class="small muted">Total de Vendas</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#eab869;">R$${totalCommission.toFixed(2)}</div>
                <div class="small muted">Total de Comissão</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#eab869;">${totalServices}</div>
                <div class="small muted">Total de Serviços</div>
            </div>
        </div>
    `;

    for (const user in userSummary) {
        summaryArea.innerHTML += `
            <div style="border-bottom:1px solid #333; padding:8px 0;">
                <strong>${user}:</strong> Vendas: R$${userSummary[user].sales.toFixed(2)} | Comissão: R$${userSummary[user].commission.toFixed(2)} (${userSummary[user].count} serviços)
            </div>
        `;
    }
}

// Atualiza a chamada do relatório para incluir o filtro de funcionário
applyRangeBtn.addEventListener('click', () => {
    showReport(fromDateInput.value, toDateInput.value, reportUserSelect.value);
});

// NOVO: Adiciona listener para o filtro de funcionário
reportUserSelect.addEventListener('change', () => {
    showReport(fromDateInput.value, toDateInput.value, reportUserSelect.value);
});

presetRangeSelect.addEventListener('change', () => {
    const today = new Date();
    let startDate, endDate = today;

    switch (presetRangeSelect.value) {
        case 'today':
            startDate = today;
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'last7':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        default:
            return;
    }
    // Formata a data para o input date (YYYY-MM-DD)
    const formatDate = (date) => date.toISOString().split('T')[0];
    fromDateInput.value = formatDate(startDate);
    toDateInput.value = formatDate(endDate);
    
    // Passa o filtro de usuário existente
    showReport(fromDateInput.value, toDateInput.value, reportUserSelect.value); 
});

exportCsvBtn.addEventListener('click', () => {
    // Usa o filtro de data e funcionário atual do relatório
    const userToFilter = reportUserSelect.value;
    const start = fromDateInput.value ? new Date(fromDateInput.value) : new Date(0);
    const end = toDateInput.value ? new Date(toDateInput.value) : new Date();
    end.setHours(23, 59, 59, 999);

    const headers = ["ID", "Usuário", "Serviço", "Preço", "Comissão", "Data"];
    
    const recordsToExport = data.records.filter(rec => {
        const recDate = new Date(rec.date);
        const dateMatch = recDate >= start && recDate <= end;
        const userMatch = userToFilter === '' || rec.user === userToFilter;
        return dateMatch && userMatch;
    });

    const rows = recordsToExport.map(rec => [
        rec.id,
        rec.user,
        rec.service,
        rec.price.toFixed(2),
        rec.commission.toFixed(2),
        new Date(rec.date).toLocaleString('pt-BR')
    ]);

    let csvContent = headers.join(";") + "\n";
    rows.forEach(row => {
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", relatorio-${userToFilter || 'geral'}.csv);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Lógica de configuração
configBtn.addEventListener('click', () => {
    actionsCard.style.display = 'none';
    reportCard.style.display = 'none';
    myRecordsCard.style.display = 'none';
    configCard.style.display = 'block';
    
    // Preenche os campos com os dados atuais
    document.getElementById('cfgTitle').value = data.config.title;
    document.getElementById('cfgPct').value = data.config.commissionPct;

    const users = Object.keys(data.config.users);
    
    // Tentativa de carregar os 3 campos corretamente, assumindo a ordem padrão
    // Isso é mais robusto para manter os nomes dos 3 usuários que você tem.
    document.getElementById('cfgUser1').value = users[0] || '';
    document.getElementById('cfgPass1').value = data.config.users[users[0]] || '';
    
    document.getElementById('cfgUser2').value = users[1] || '';
    document.getElementById('cfgPass2').value = data.config.users[users[1]] || '';
    
    document.getElementById('cfgUser3').value = users[2] || '';
    document.getElementById('cfgPass3').value = data.config.users[users[2]] || '';

});

saveCfgBtn.addEventListener('click', () => {
    const newConfig = {
        title: document.getElementById('cfgTitle').value,
        users: {},
        commissionPct: parseFloat(document.getElementById('cfgPct').value)
    };
    
    // Processa o primeiro usuário (Geralmente Proprietário)
    const user1 = document.getElementById('cfgUser1').value.toLowerCase();
    const pass1 = document.getElementById('cfgPass1').value;
    if (user1 && pass1) {
        newConfig.users[user1] = pass1;
    }
    
    // Processa o segundo usuário (Funcionário - Luís)
    const user2 = document.getElementById('cfgUser2').value.toLowerCase();
    const pass2 = document.getElementById('cfgPass2').value;
    if (user2 && pass2) {
        newConfig.users[user2] = pass2;
    }
    
    // Processa o terceiro usuário (Funcionário - Matheus)
    const user3 = document.getElementById('cfgUser3').value.toLowerCase();
    const pass3 = document.getElementById('cfgPass3').value;
    if (user3 && pass3) {
        newConfig.users[user3] = pass3;
    }

    data.config = newConfig;
    saveStorageData(data);
    showActions(); // Volta para a tela principal
});

resetBtn.addEventListener('click', () => {
    if (confirm('Isso irá APAGAR TODOS os registros de serviços. Você tem certeza?')) {
        data.records = [];
        saveStorageData(data);
        showActions();
    }
});