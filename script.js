// Função auxiliar para obter e salvar dados no armazenamento local
const STORAGE_KEY = 'barberShopData';

function getStorageData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        // Garante que os 3 usuários (incluindo Matheus) estejam sempre na configuração padrão
        const defaultData = {
            records: [],
            config: {
                title: 'Painel Barbearia',
                logo: 'logo.jpg',
                users: {
                    pierote: 'ownerpass',
                    luis: 'luis123',
                    matheus: 'matheus123' 
                },
                commissionPct: 40
            }
        };
        
        // Se houver dados salvos, carrega, mas garante que a estrutura 'users' existe
        if (data) {
            const parsedData = JSON.parse(data);
            // Se o Matheus ou Luis tiverem sido apagados na Config, restaura eles se não estiverem presentes nos dados salvos
            if (!parsedData.config.users.matheus) {
                parsedData.config.users.matheus = 'matheus123';
            }
             if (!parsedData.config.users.luis) {
                parsedData.config.users.luis = 'luis123';
            }
            return parsedData;
        }

        return defaultData;

    } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
        return { records: [], config: { users: { pierote: 'ownerpass' }, commissionPct: 40 } };
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
// O elemento reportUserSelect AINDA não existe no HTML que você forneceu, mas o JS já o adiciona a lógica
const reportUserSelect = document.getElementById('reportUserSelect'); 
const svcBtns = document.querySelectorAll('.svcBtn');
const saveCfgBtn = document.getElementById('saveCfgBtn');
const resetBtn = document.getElementById('resetBtn');

let currentUser = null;
let data = getStorageData();

// Lógica de login
loginBtn.addEventListener('click', () => {
    const user = inpUser.value.toLowerCase();
    const pass = inpPass.value;
    
    // CORRIGIDO: Garante que a checagem de senha seja direta.
    if (data.config.users[user] === pass) {
        currentUser = user;
        showActions();
        // Limpa a senha após o login por segurança
        inpPass.value = ''; 
    } else {
        alert('Usuário ou senha incorretos.');
    }
});

demoBtn.addEventListener('click', () => {
    currentUser = 'pierote';
    showActions();
});

function populateReportUserSelect() {
    // Se o elemento não existir (com o seu HTML atual), retorna para evitar erro
    if (!reportUserSelect) return; 
    
    // Adiciona todos os usuários, exceto o proprietário, no filtro
    const users = Object.keys(data.config.users).filter(user => user !== 'pierote');
    reportUserSelect.innerHTML = '<option value="">Todos</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
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
    welcomeTxt.textContent = 'Bem-vindo, $ {currentUser}';

    // Mostra/Esconde botões de proprietário (Relatório e Configuração)
    const isOwner = data.config.users[currentUser] === 'ownerpass' || currentUser === 'pierote';
    openReportBtn.style.display = isOwner ? 'block' : 'none';
    configBtn.style.display = isOwner ? 'block' : 'none';
    
    // Se o elemento reportUserSelect existir, preenche ele
    if (isOwner && reportUserSelect) {
        populateReportUserSelect();
    }
}

// Lógica de registro de serviço
svcBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const serviceName = btn.getAttribute('data-service');
        const priceMatch = btn.textContent.match(/\(R\$(\d+)\)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0; 
        
        const isProduct = ['Pomada', 'Minoxidil'].includes(serviceName);
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
        alert('Serviço "${serviceName}" registrado com sucesso para ${currentUser}.');
    });
});

// Lógica de relatório
openReportBtn.addEventListener('click', () => {
    // Se o elemento existir, redefine o filtro
    if(reportUserSelect) reportUserSelect.value = ''; 
    showReport();
});

myRecordsBtn.addEventListener('click', () => {
    showMyRecords();
});

function showReport(startDate, endDate, targetUser = reportUserSelect ? reportUserSelect.value : '') { 
    actionsCard.style.display = 'none';
    myRecordsCard.style.display = 'none';
    configCard.style.display = 'none';
    reportCard.style.display = 'block';

    const isOwner = currentUser === 'pierote';
    
    // Aplica o filtro de usuário apenas se for dono E um usuário estiver selecionado
    const userToFilter = isOwner && targetUser !== '' ? targetUser : '';

    const filteredRecords = data.records.filter(rec => {
        const recDate = new Date(rec.date);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        
        const dateMatch = recDate >= start && recDate <= end;
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

applyRangeBtn.addEventListener('click', () => {
    showReport(fromDateInput.value, toDateInput.value, reportUserSelect ? reportUserSelect.value : '');
});

// Adiciona listener para o filtro de funcionário, se existir
if (reportUserSelect) {
    reportUserSelect.addEventListener('change', () => {
        showReport(fromDateInput.value, toDateInput.value, reportUserSelect.value);
    });
}

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
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    fromDateInput.value = formatDate(startDate);
    toDateInput.value = formatDate(endDate);
    
    showReport(fromDateInput.value, toDateInput.value, reportUserSelect ? reportUserSelect.value : ''); 
});

exportCsvBtn.addEventListener('click', () => {
    const userToFilter = reportUserSelect ? reportUserSelect.value : '';
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
    link.setAttribute("download", `relatorio-${userToFilter || 'geral'}.csv`);
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
    
    document.getElementById('cfgTitle').value = data.config.title;
    document.getElementById('cfgPct').value = data.config.commissionPct;

    // Converte os usuários em um array de pares [usuário, senha]
    const userEntries = Object.entries(data.config.users);
    
    // Preenche os campos de 2 usuários (conforme seu HTML atual)
    // Se houver mais usuários (como o Matheus), eles serão "invisíveis" no form,
    // mas a lógica de saveCfgBtn irá recuperá-los do LocalStorage para não serem apagados.
    
    const user1 = userEntries[0] || ['', ''];
    document.getElementById('cfgUser1').value = user1[0];
    document.getElementById('cfgPass1').value = user1[1];
    
    const user2 = userEntries[1] || ['', ''];
    document.getElementById('cfgUser2').value = user2[0];
    document.getElementById('cfgPass2').value = user2[1];
});

saveCfgBtn.addEventListener('click', () => {
    const newConfig = {
        title: document.getElementById('cfgTitle').value,
        users: { ...data.config.users }, // Inicia com todos os usuários existentes (incluindo Matheus)
        commissionPct: parseFloat(document.getElementById('cfgPct').value)
    };
    
    // Processa o primeiro usuário (Geralmente Proprietário) e sobrescreve
    const user1 = document.getElementById('cfgUser1').value.toLowerCase();
    const pass1 = document.getElementById('cfgPass1').value;
    if (user1 && pass1) {
        newConfig.users[user1] = pass1;
    }
    
    // Processa o segundo usuário (Funcionário - Luís) e sobrescreve
    const user2 = document.getElementById('cfgUser2').value.toLowerCase();
    const pass2 = document.getElementById('cfgPass2').value;
    if (user2 && pass2) {
        newConfig.users[user2] = pass2;
    }
    
    // REMOVEMOS A BUSCA PELO CFGUSER3, POIS ELE NÃO EXISTE NO SEU HTML

    data.config = newConfig;
    saveStorageData(data);
    showActions();
});

resetBtn.addEventListener('click', () => {
    if (confirm('Isso irá APAGAR TODOS os registros de serviços. Você tem certeza?')) {
        data.records = [];
        saveStorageData(data);
        showActions();
    }
});