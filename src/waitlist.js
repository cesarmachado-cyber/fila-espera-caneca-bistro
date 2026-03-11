const WAITLIST_STATUS = {
  AGUARDANDO: 'aguardando',
  CHAMADO: 'chamado',
  ENTROU: 'entrou',
  NAO_COMPARECEU: 'nao_compareceu',
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
  [WAITLIST_STATUS.NAO_COMPARECEU]: 'Não compareceu',
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
const DEFAULT_CALL_TOLERANCE_MINUTES = 10;

const appConfig = window.__APP_CONFIG__ || {};

class SupabaseRestClient {
  #baseUrl;

  #anonKey;

  constructor({ supabaseUrl, supabaseAnonKey }) {
    this.#baseUrl = supabaseUrl ? `${supabaseUrl.replace(/\/+$/, '')}/rest/v1` : '';
    this.#anonKey = supabaseAnonKey || '';
  }

  get isConfigured() {
    return Boolean(this.#baseUrl && this.#anonKey);
  }

  async select(table) {
    const response = await this.#request(`/${table}?select=*`);
    return response.json();
  }

  async insert(table, payload) {
    const response = await this.#request(`/${table}`, {
      method: 'POST',
      headers: {
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const rows = await response.json();
    return rows[0];
  }

  async update(table, id, payload) {
    const response = await this.#request(`/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const rows = await response.json();
    return rows[0];
  }

  async #request(path, init = {}) {
    if (!this.isConfigured) {
      throw new Error('Supabase não configurado.');
    }

    const response = await fetch(`${this.#baseUrl}${path}`, {
      ...init,
      headers: {
        apikey: this.#anonKey,
        Authorization: `Bearer ${this.#anonKey}`,
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Erro Supabase (${response.status}): ${reason}`);
    }

    return response;
  }
}

class WaitlistRepository {
  #customers = [];

  #supabase;

  constructor(supabase) {
    this.#supabase = supabase;
  }

  list() {
    return [...this.#customers];
  }

  async load() {
    if (!this.#supabase.isConfigured) {
      this.#customers = [];
      return;
    }

    const rows = await this.#supabase.select('waitlist_customers');
    this.#customers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      whatsapp: row.whatsapp,
      partySize: row.party_size,
      notes: row.notes || '',
      status: row.status,
      assignedTableId: row.assigned_table_id,
      calledAt: row.called_at,
      toleranceMinutes: row.tolerance_minutes,
      createdAt: row.created_at
    }));
  }

  async create(customer) {
    if (!this.#supabase.isConfigured) {
      this.#customers.push(customer);
      return customer;
    }

    const row = await this.#supabase.insert('waitlist_customers', {
      id: customer.id,
      name: customer.name,
      whatsapp: customer.whatsapp,
      party_size: customer.partySize,
      notes: customer.notes,
      status: customer.status,
      assigned_table_id: customer.assignedTableId,
      called_at: customer.calledAt,
      tolerance_minutes: customer.toleranceMinutes,
      created_at: customer.createdAt
    });

    const normalized = {
      id: row.id,
      name: row.name,
      whatsapp: row.whatsapp,
      partySize: row.party_size,
      notes: row.notes || '',
      status: row.status,
      assignedTableId: row.assigned_table_id,
      calledAt: row.called_at,
      toleranceMinutes: row.tolerance_minutes,
      createdAt: row.created_at
    };

    this.#customers.push(normalized);
    return normalized;
  }

  async update(customerId, patch) {
    const payload = {
      ...(Object.hasOwn(patch, 'name') ? { name: patch.name } : {}),
      ...(Object.hasOwn(patch, 'whatsapp') ? { whatsapp: patch.whatsapp } : {}),
      ...(Object.hasOwn(patch, 'partySize') ? { party_size: patch.partySize } : {}),
      ...(Object.hasOwn(patch, 'notes') ? { notes: patch.notes } : {}),
      ...(Object.hasOwn(patch, 'status') ? { status: patch.status } : {}),
      ...(Object.hasOwn(patch, 'assignedTableId') ? { assigned_table_id: patch.assignedTableId } : {}),
      ...(Object.hasOwn(patch, 'calledAt') ? { called_at: patch.calledAt } : {}),
      ...(Object.hasOwn(patch, 'toleranceMinutes') ? { tolerance_minutes: patch.toleranceMinutes } : {})
    };

    if (this.#supabase.isConfigured) {
      await this.#supabase.update('waitlist_customers', customerId, payload);
    }

    this.#customers = this.#customers.map((customer) => (
      customer.id === customerId
        ? { ...customer, ...patch }
        : customer
    ));
  }
}

class TableRepository {
  #tables = [];

  #supabase;

  constructor(supabase) {
    this.#supabase = supabase;
  }

  list() {
    return [...this.#tables];
  }

  async load() {
    if (!this.#supabase.isConfigured) {
      this.#tables = [];
      return;
    }

    const rows = await this.#supabase.select('tables');
    this.#tables = rows.map((row) => ({
      id: row.id,
      label: row.label,
      capacity: row.capacity,
      status: row.status,
      currentCustomerId: row.current_customer_id,
      createdAt: row.created_at
    }));
  }

  async create(table) {
    if (!this.#supabase.isConfigured) {
      this.#tables.push(table);
      return table;
    }

    const row = await this.#supabase.insert('tables', {
      id: table.id,
      label: table.label,
      capacity: table.capacity,
      status: table.status,
      current_customer_id: table.currentCustomerId,
      created_at: table.createdAt
    });

    const normalized = {
      id: row.id,
      label: row.label,
      capacity: row.capacity,
      status: row.status,
      currentCustomerId: row.current_customer_id,
      createdAt: row.created_at
    };

    this.#tables.push(normalized);
    return normalized;
  }

  async update(tableId, patch) {
    const payload = {
      ...(Object.hasOwn(patch, 'label') ? { label: patch.label } : {}),
      ...(Object.hasOwn(patch, 'capacity') ? { capacity: patch.capacity } : {}),
      ...(Object.hasOwn(patch, 'status') ? { status: patch.status } : {}),
      ...(Object.hasOwn(patch, 'currentCustomerId') ? { current_customer_id: patch.currentCustomerId } : {})
    };

    if (this.#supabase.isConfigured) {
      await this.#supabase.update('tables', tableId, payload);
    }

    this.#tables = this.#tables.map((table) => (
      table.id === tableId
        ? { ...table, ...patch }
        : table
    ));
  }
}

class NotificationService {
  buildManualWhatsAppCallLink(customer) {
    const whatsappNumber = this.#formatWhatsAppNumber(customer.whatsapp);
    const message = this.#buildCallMessage(customer.name);

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  openManualWhatsAppCall(customer) {
    const link = this.buildManualWhatsAppCallLink(customer);
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  notifyTableReleased() {
    console.info('notifyTableReleased');
  }

  notifyCustomerCalled({ customer, table, toleranceMinutes }) {
    console.info('notifyCustomerCalled', { customerId: customer.id, tableId: table.id, toleranceMinutes });
  }

  #buildCallMessage(name) {
    return `Olá, ${name}! Sua mesa no Caneca Bistrô já está pronta. Estamos te aguardando com carinho 😊`;
  }

  #formatWhatsAppNumber(phone) {
    const digits = sanitizePhone(phone);
    return digits.startsWith('55') ? digits : `55${digits}`;
  }
}

const supabaseClient = new SupabaseRestClient({
  supabaseUrl: appConfig.supabaseUrl,
  supabaseAnonKey: appConfig.supabaseAnonKey
});

const waitlistRepository = new WaitlistRepository(supabaseClient);
const tableRepository = new TableRepository(supabaseClient);
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
  availableCounter: document.querySelector('#available-counter'),
  callToleranceInput: document.querySelector('#call-tolerance')
};

const createCustomer = ({ name, whatsapp, partySize, notes }) => ({
  id: crypto.randomUUID(),
  name,
  whatsapp,
  partySize,
  notes,
  status: WAITLIST_STATUS.AGUARDANDO,
  assignedTableId: null,
  calledAt: null,
  toleranceMinutes: null,
  createdAt: new Date().toISOString()
});

const createTable = ({ label, capacity, status }) => ({
  id: crypto.randomUUID(),
  label,
  capacity,
  status,
  currentCustomerId: null,
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

const getTableById = (tableId) => tableRepository.list().find((table) => table.id === tableId);

const getActiveQueueCustomers = () => waitlistRepository
  .list()
  .filter((customer) => customer.status === WAITLIST_STATUS.AGUARDANDO || customer.status === WAITLIST_STATUS.CHAMADO)
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const getCompatibleCustomers = (tableCapacity) => getActiveQueueCustomers()
  .filter((customer) => customer.partySize <= tableCapacity)
  .sort((a, b) => b.partySize - a.partySize || new Date(a.createdAt) - new Date(b.createdAt));

const getToleranceMinutes = () => {
  const parsed = Number.parseInt(elements.callToleranceInput?.value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_CALL_TOLERANCE_MINUTES;
};

const formatCalledAt = (calledAt) => {
  if (!calledAt) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(calledAt));
};

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
      const assignedTable = customer.assignedTableId ? getTableById(customer.assignedTableId) : null;

      return `
        <li class="queue-item" data-id="${customer.id}">
          <div class="queue-item-main">
            <h3>${customer.name}</h3>
            <p><strong>WhatsApp:</strong> ${customer.whatsapp}</p>
            <p><strong>Pessoas:</strong> ${customer.partySize}</p>
            <p><strong>Observações:</strong> ${notes}</p>
            <p><strong>Mesa associada:</strong> ${assignedTable?.label || 'Não definida'}</p>
            <p><strong>Horário da chamada:</strong> ${formatCalledAt(customer.calledAt)}</p>
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
    .map((table) => {
      const customer = table.currentCustomerId ? waitlistRepository.list().find((item) => item.id === table.currentCustomerId) : null;

      return `
      <li class="table-item" data-id="${table.id}">
        <div class="table-item-main">
          <h3>${table.label}</h3>
          <div class="table-meta">
            <span class="status-pill status-${table.status}">${TABLE_STATUS_LABELS[table.status]}</span>
            <span class="status-pill">Capacidade ${table.capacity}</span>
          </div>
          <p>Status operacional da mesa no salão.</p>
          <p><strong>Cliente associado:</strong> ${customer ? customer.name : 'Sem cliente associado'}</p>
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
    `;
    })
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
        ? `<ul class="suggestion-list">${suggestions.map((customer) => {
          const isCalledForThisTable = customer.status === WAITLIST_STATUS.CHAMADO && customer.assignedTableId === table.id;

          return `
            <li class="suggestion-item" data-customer-id="${customer.id}" data-table-id="${table.id}">
              <div class="suggestion-content">
                <span>${customer.name} · ${customer.partySize} pessoas</span>
                <small>${customer.whatsapp}</small>
                <small>Status: ${STATUS_LABELS[customer.status]}</small>
              </div>
              <div class="host-actions">
                <button type="button" class="whatsapp-button" data-action="call-customer">Chamar no WhatsApp</button>
                <button type="button" class="secondary-button" data-action="confirm-entry" ${isCalledForThisTable ? '' : 'disabled'}>Confirmar entrada</button>
                <button type="button" class="danger-button" data-action="mark-no-show" ${isCalledForThisTable ? '' : 'disabled'}>Não compareceu</button>
                <button type="button" class="danger-button" data-action="mark-canceled" ${isCalledForThisTable ? '' : 'disabled'}>Cancelado</button>
              </div>
            </li>
          `;
        }).join('')}</ul>`
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

const handleWaitlistSubmit = async (event) => {
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

  try {
    const customer = await waitlistRepository.create(createCustomer(payload));
    setFeedback(elements.waitlistFeedback, `Cliente ${customer.name} adicionado(a) à fila com sucesso.`);
    elements.waitlistForm.reset();
    renderAll();
  } catch (error) {
    setFeedback(elements.waitlistFeedback, 'Erro ao salvar cliente. Verifique a conexão com o Supabase.', true);
    console.error(error);
  }
};

const handleTableSubmit = async (event) => {
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

  try {
    const table = await tableRepository.create(createTable(payload));
    setFeedback(elements.tableFeedback, `${table.label} cadastrada com sucesso.`);
    elements.tableForm.reset();
    elements.tableForm.status.value = TABLE_STATUS.DISPONIVEL;
    renderAll();
  } catch (error) {
    setFeedback(elements.tableFeedback, 'Erro ao salvar mesa. Verifique a conexão com o Supabase.', true);
    console.error(error);
  }
};

const handleQueueInteraction = async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'update-customer-status') {
    return;
  }

  const listItem = target.closest('.queue-item');

  if (!listItem) {
    return;
  }

  try {
    await waitlistRepository.update(listItem.dataset.id, { status: target.value });
    renderAll();
  } catch (error) {
    console.error(error);
    renderAll();
  }
};

const handleTableInteraction = async (event) => {
  const target = event.target;
  const listItem = target instanceof HTMLElement ? target.closest('.table-item') : null;

  if (!listItem) {
    return;
  }

  const tableId = listItem.dataset.id;

  if (target instanceof HTMLSelectElement && target.dataset.action === 'update-table-status') {
    try {
      await tableRepository.update(tableId, { status: target.value });
      renderAll();
    } catch (error) {
      console.error(error);
      renderAll();
    }
    return;
  }

  if (target instanceof HTMLButtonElement && target.dataset.action === 'mark-released') {
    try {
      await tableRepository.update(tableId, { status: TABLE_STATUS.DISPONIVEL, currentCustomerId: null });
      notificationService.notifyTableReleased(tableId);
      renderAll();
    } catch (error) {
      console.error(error);
      renderAll();
    }
  }
};

const handleHostPanelInteraction = async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement) || !target.dataset.action) {
    return;
  }

  const suggestionItem = target.closest('.suggestion-item');

  if (!suggestionItem) {
    return;
  }

  const customerId = suggestionItem.dataset.customerId;
  const tableId = suggestionItem.dataset.tableId;
  const customer = waitlistRepository.list().find((item) => item.id === customerId);
  const table = tableRepository.list().find((item) => item.id === tableId);

  if (!customer || !table) {
    return;
  }

  try {
    if (target.dataset.action === 'call-customer') {
      const toleranceMinutes = getToleranceMinutes();

      await waitlistRepository.update(customerId, {
        status: WAITLIST_STATUS.CHAMADO,
        assignedTableId: tableId,
        calledAt: new Date().toISOString(),
        toleranceMinutes
      });

      await tableRepository.update(tableId, { currentCustomerId: customerId });
      notificationService.notifyCustomerCalled({ customer, table, toleranceMinutes });
      notificationService.openManualWhatsAppCall(customer);
      renderAll();
      return;
    }

    if (target.dataset.action === 'confirm-entry') {
      await waitlistRepository.update(customerId, { status: WAITLIST_STATUS.ENTROU });
      await tableRepository.update(tableId, { status: TABLE_STATUS.OCUPADA, currentCustomerId: customerId });
      renderAll();
      return;
    }

    if (target.dataset.action === 'mark-no-show') {
      await waitlistRepository.update(customerId, { status: WAITLIST_STATUS.NAO_COMPARECEU, assignedTableId: null, calledAt: null });
      await tableRepository.update(tableId, { currentCustomerId: null });
      renderAll();
      return;
    }

    if (target.dataset.action === 'mark-canceled') {
      await waitlistRepository.update(customerId, { status: WAITLIST_STATUS.CANCELADO, assignedTableId: null, calledAt: null });
      await tableRepository.update(tableId, { currentCustomerId: null });
      renderAll();
    }
  } catch (error) {
    console.error(error);
    renderAll();
  }
};

const initialize = async () => {
  elements.waitlistForm.addEventListener('submit', handleWaitlistSubmit);
  elements.tableForm.addEventListener('submit', handleTableSubmit);
  elements.queueList.addEventListener('change', handleQueueInteraction);
  elements.tableList.addEventListener('change', handleTableInteraction);
  elements.tableList.addEventListener('click', handleTableInteraction);
  elements.hostPanel.addEventListener('click', handleHostPanelInteraction);

  elements.tableForm.status.value = TABLE_STATUS.DISPONIVEL;
  elements.callToleranceInput.value = String(DEFAULT_CALL_TOLERANCE_MINUTES);

  if (!supabaseClient.isConfigured) {
    setFeedback(elements.waitlistFeedback, 'Supabase não configurado. Operando em modo local temporário.', true);
  }

  try {
    await Promise.all([waitlistRepository.load(), tableRepository.load()]);
    renderAll();
  } catch (error) {
    console.error(error);
    setFeedback(elements.waitlistFeedback, 'Falha ao carregar dados persistidos do Supabase.', true);
    renderAll();
  }
};

initialize();
