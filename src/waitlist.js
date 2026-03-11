const WAITLIST_STATUS = {
  AGUARDANDO: 'aguardando',
  CHAMADO: 'chamado',
  ENTROU: 'entrou',
  CANCELADO: 'cancelado'
};

const TABLE_STATUS = {
  OCUPADA: 'ocupada',
  DISPONIVEL: 'disponivel',
  LIBERANDO: 'liberando',
  RESERVADA: 'reservada'
};

const STATUS_LABELS = {
  [WAITLIST_STATUS.AGUARDANDO]: 'Aguardando',
  [WAITLIST_STATUS.CHAMADO]: 'Chamado',
  [WAITLIST_STATUS.ENTROU]: 'Entrou',
  [WAITLIST_STATUS.CANCELADO]: 'Cancelado'
};

const TABLE_STATUS_LABELS = {
  [TABLE_STATUS.OCUPADA]: 'Ocupada',
  [TABLE_STATUS.DISPONIVEL]: 'Disponível',
  [TABLE_STATUS.LIBERANDO]: 'Liberando',
  [TABLE_STATUS.RESERVADA]: 'Reservada'
};

const WAITLIST_STATUS_OPTIONS = Object.values(WAITLIST_STATUS);
const TABLE_STATUS_OPTIONS = Object.values(TABLE_STATUS);

/**
 * Repositório isolado para facilitar migração futura para Supabase.
 * Basta manter a mesma assinatura pública dos métodos.
 */
class WaitlistRepository {
  #customers = [];

  list() {
    return [...this.#customers];
  }

  create(customer) {
    this.#customers.push(customer);
    return customer;
  }

  updateStatus(customerId, status) {
    this.#customers = this.#customers.map((customer) => (
      customer.id === customerId
        ? { ...customer, status }
        : customer
    ));
  }
}

/**
 * Estrutura preparada para integração futura com Supabase e sincronização entre atendentes.
 */
class TableRepository {
  #tables = [];

  list() {
    return [...this.#tables];
  }

  create(table) {
    this.#tables.push(table);
    return table;
  }

  updateStatus(tableId, status) {
    this.#tables = this.#tables.map((table) => (
      table.id === tableId
        ? { ...table, status }
        : table
    ));
  }
}

/**
 * Serviço desacoplado para futura automação de notificações via WhatsApp.
 */
class NotificationService {
  notifyTableReleased() {
    // Placeholder: futuramente enviar webhook/trigger para WhatsApp.
  }
}

const waitlistRepository = new WaitlistRepository();
const tableRepository = new TableRepository();
const notificationService = new NotificationService();

const elements = {
  waitlistForm: document.querySelector('#waitlist-form'),
  waitlistFeedback: document.querySelector('#form-feedback'),
  queueList: document.querySelector('#queue-list'),
  queueCounter: document.querySelector('#queue-counter'),
  tableForm: document.querySelector('#table-form'),
  tableFeedback: document.querySelector('#table-feedback'),
  tableList: document.querySelector('#table-list'),
  tableCounter: document.querySelector('#table-counter'),
  hostPanel: document.querySelector('#host-panel'),
  availableCounter: document.querySelector('#available-counter')
};

const createCustomer = ({ name, whatsapp, partySize, notes }) => ({
  id: crypto.randomUUID(),
  name,
  whatsapp,
  partySize,
  notes,
  status: WAITLIST_STATUS.AGUARDANDO,
  createdAt: new Date().toISOString()
});

const createTable = ({ label, capacity, status }) => ({
  id: crypto.randomUUID(),
  label,
  capacity,
  status,
  createdAt: new Date().toISOString()
});

const sanitizePhone = (value) => value.replace(/\D+/g, '');

const formatPhone = (value) => {
  const digits = sanitizePhone(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const setFeedback = (element, message, isError = false) => {
  element.textContent = message;
  element.dataset.type = isError ? 'error' : 'success';
};

const buildStatusOptions = (selectedStatus) => WAITLIST_STATUS_OPTIONS
  .map((status) => `<option value="${status}" ${selectedStatus === status ? 'selected' : ''}>${STATUS_LABELS[status]}</option>`)
  .join('');

const buildTableStatusOptions = (selectedStatus) => TABLE_STATUS_OPTIONS
  .map((status) => `<option value="${status}" ${selectedStatus === status ? 'selected' : ''}>${TABLE_STATUS_LABELS[status]}</option>`)
  .join('');

const getActiveQueueCustomers = () => waitlistRepository
  .list()
  .filter((customer) => customer.status === WAITLIST_STATUS.AGUARDANDO || customer.status === WAITLIST_STATUS.CHAMADO)
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const getCompatibleCustomers = (tableCapacity) => getActiveQueueCustomers()
  .filter((customer) => customer.partySize <= tableCapacity)
  .sort((a, b) => b.partySize - a.partySize || new Date(a.createdAt) - new Date(b.createdAt));

const updateQueueCounter = () => {
  const total = getActiveQueueCustomers().length;
  elements.queueCounter.textContent = `${total} ${total === 1 ? 'cliente' : 'clientes'}`;
};

const updateTableCounter = () => {
  const tables = tableRepository.list();
  elements.tableCounter.textContent = `${tables.length} ${tables.length === 1 ? 'mesa' : 'mesas'}`;
};

const updateAvailableCounter = () => {
  const available = tableRepository.list().filter((table) => table.status === TABLE_STATUS.DISPONIVEL).length;
  elements.availableCounter.textContent = `${available} disponíveis`;
};

const renderQueue = () => {
  const customers = waitlistRepository
    .list()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (customers.length === 0) {
    elements.queueList.innerHTML = '<li class="queue-empty">Nenhum cliente na fila no momento.</li>';
    updateQueueCounter();
    return;
  }

  elements.queueList.innerHTML = customers
    .map((customer) => {
      const notes = customer.notes?.trim() ? customer.notes : 'Sem observações';

      return `
        <li class="queue-item" data-id="${customer.id}">
          <div class="queue-item-main">
            <h3>${customer.name}</h3>
            <p><strong>WhatsApp:</strong> ${customer.whatsapp}</p>
            <p><strong>Pessoas:</strong> ${customer.partySize}</p>
            <p><strong>Observações:</strong> ${notes}</p>
          </div>
          <div class="queue-item-status">
            <label>
              <span>Status</span>
              <select data-action="update-customer-status" aria-label="Atualizar status de ${customer.name}">
                ${buildStatusOptions(customer.status)}
              </select>
            </label>
          </div>
        </li>
      `;
    })
    .join('');

  updateQueueCounter();
};

const renderTables = () => {
  const tables = tableRepository
    .list()
    .sort((a, b) => a.capacity - b.capacity || a.label.localeCompare(b.label));

  if (tables.length === 0) {
    elements.tableList.innerHTML = '<li class="table-empty">Nenhuma mesa cadastrada ainda.</li>';
    updateTableCounter();
    return;
  }

  elements.tableList.innerHTML = tables
    .map((table) => `
      <li class="table-item" data-id="${table.id}">
        <div class="table-item-main">
          <h3>${table.label}</h3>
          <div class="table-meta">
            <span class="status-pill status-${table.status}">${TABLE_STATUS_LABELS[table.status]}</span>
            <span class="status-pill">Capacidade ${table.capacity}</span>
          </div>
          <p>Status operacional da mesa no salão.</p>
        </div>
        <div class="table-actions">
          <label class="table-item-status">
            <span>Status da mesa</span>
            <select data-action="update-table-status" aria-label="Atualizar status da ${table.label}">
              ${buildTableStatusOptions(table.status)}
            </select>
          </label>
          <button type="button" class="secondary-button" data-action="mark-released">Mesa liberada</button>
        </div>
      </li>
    `)
    .join('');

  updateTableCounter();
};

const renderHostPanel = () => {
  const availableTables = tableRepository
    .list()
    .filter((table) => table.status === TABLE_STATUS.DISPONIVEL)
    .sort((a, b) => a.capacity - b.capacity || a.label.localeCompare(b.label));

  if (availableTables.length === 0) {
    elements.hostPanel.innerHTML = '<p class="host-empty">Sem mesas disponíveis no momento.</p>';
    updateAvailableCounter();
    return;
  }

  elements.hostPanel.innerHTML = availableTables
    .map((table) => {
      const suggestions = getCompatibleCustomers(table.capacity).slice(0, 3);

      const suggestionsMarkup = suggestions.length
        ? `<ul class="suggestion-list">${suggestions.map((customer) => `
            <li class="suggestion-item">
              <span>${customer.name} · ${customer.partySize} pessoas</span>
              <small>${customer.whatsapp}</small>
            </li>
          `).join('')}</ul>`
        : '<p class="suggestion-empty">Nenhum cliente compatível no momento.</p>';

      return `
        <article class="host-table">
          <div class="host-table-header">
            <h3>${table.label}</h3>
            <span class="status-pill status-disponivel">Capacidade ${table.capacity}</span>
          </div>
          <p>Sugestões automáticas para encaixe imediato:</p>
          ${suggestionsMarkup}
        </article>
      `;
    })
    .join('');

  updateAvailableCounter();
};

const renderAll = () => {
  renderQueue();
  renderTables();
  renderHostPanel();
};

const validateCustomerData = ({ name, whatsapp, partySize }) => {
  if (!name.trim()) {
    return 'Informe o nome do cliente.';
  }

  if (sanitizePhone(whatsapp).length < 10) {
    return 'Informe um WhatsApp válido com DDD.';
  }

  if (!Number.isInteger(partySize) || partySize < 1) {
    return 'Quantidade de pessoas deve ser no mínimo 1.';
  }

  return null;
};

const validateTableData = ({ label, capacity, status }) => {
  if (!label.trim()) {
    return 'Informe o nome ou número da mesa.';
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    return 'Capacidade da mesa deve ser no mínimo 1.';
  }

  if (!TABLE_STATUS_OPTIONS.includes(status)) {
    return 'Selecione um status válido para a mesa.';
  }

  return null;
};

const handleWaitlistSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(elements.waitlistForm);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    whatsapp: formatPhone(String(formData.get('whatsapp') || '')),
    partySize: Number.parseInt(String(formData.get('partySize') || ''), 10),
    notes: String(formData.get('notes') || '').trim()
  };

  const validationError = validateCustomerData(payload);

  if (validationError) {
    setFeedback(elements.waitlistFeedback, validationError, true);
    return;
  }

  const customer = waitlistRepository.create(createCustomer(payload));

  setFeedback(elements.waitlistFeedback, `Cliente ${customer.name} adicionado(a) à fila com sucesso.`);
  elements.waitlistForm.reset();
  renderAll();
};

const handleTableSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(elements.tableForm);
  const payload = {
    label: String(formData.get('label') || '').trim(),
    capacity: Number.parseInt(String(formData.get('capacity') || ''), 10),
    status: String(formData.get('status') || '')
  };

  const validationError = validateTableData(payload);

  if (validationError) {
    setFeedback(elements.tableFeedback, validationError, true);
    return;
  }

  const table = tableRepository.create(createTable(payload));

  setFeedback(elements.tableFeedback, `${table.label} cadastrada com sucesso.`);
  elements.tableForm.reset();
  elements.tableForm.status.value = TABLE_STATUS.DISPONIVEL;
  renderAll();
};

const handleQueueInteraction = (event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'update-customer-status') {
    return;
  }

  const listItem = target.closest('.queue-item');

  if (!listItem) {
    return;
  }

  waitlistRepository.updateStatus(listItem.dataset.id, target.value);
  renderAll();
};

const handleTableInteraction = (event) => {
  const target = event.target;
  const listItem = target instanceof HTMLElement ? target.closest('.table-item') : null;

  if (!listItem) {
    return;
  }

  const tableId = listItem.dataset.id;

  if (target instanceof HTMLSelectElement && target.dataset.action === 'update-table-status') {
    tableRepository.updateStatus(tableId, target.value);
    renderAll();
    return;
  }

  if (target instanceof HTMLButtonElement && target.dataset.action === 'mark-released') {
    tableRepository.updateStatus(tableId, TABLE_STATUS.DISPONIVEL);
    notificationService.notifyTableReleased(tableId);
    renderAll();
    return;
  }
};

const initialize = () => {
  elements.waitlistForm.addEventListener('submit', handleWaitlistSubmit);
  elements.tableForm.addEventListener('submit', handleTableSubmit);
  elements.queueList.addEventListener('change', handleQueueInteraction);
  elements.tableList.addEventListener('change', handleTableInteraction);
  elements.tableList.addEventListener('click', handleTableInteraction);

  elements.tableForm.status.value = TABLE_STATUS.DISPONIVEL;
  renderAll();
};

initialize();
