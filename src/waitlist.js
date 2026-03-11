const WAITLIST_STATUS = {
  AGUARDANDO: 'aguardando',
  CHAMADO: 'chamado',
  ENTROU: 'entrou',
  CANCELADO: 'cancelado'
};

const STATUS_LABELS = {
  [WAITLIST_STATUS.AGUARDANDO]: 'Aguardando',
  [WAITLIST_STATUS.CHAMADO]: 'Chamado',
  [WAITLIST_STATUS.ENTROU]: 'Entrou',
  [WAITLIST_STATUS.CANCELADO]: 'Cancelado'
};

const STATUS_OPTIONS = Object.values(WAITLIST_STATUS);

/**
 * Repositório isolado para facilitar migração futura para Supabase.
 * Basta manter a mesma assinatura dos métodos (list, create, updateStatus).
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

const repository = new WaitlistRepository();

const elements = {
  form: document.querySelector('#waitlist-form'),
  queueList: document.querySelector('#queue-list'),
  queueCounter: document.querySelector('#queue-counter'),
  feedback: document.querySelector('#form-feedback')
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

const setFeedback = (message, isError = false) => {
  elements.feedback.textContent = message;
  elements.feedback.dataset.type = isError ? 'error' : 'success';
};

const updateCounter = () => {
  const customers = repository.list();
  const pendingCustomers = customers.filter((customer) => customer.status !== WAITLIST_STATUS.CANCELADO);
  const total = pendingCustomers.length;
  elements.queueCounter.textContent = `${total} ${total === 1 ? 'cliente' : 'clientes'}`;
};

const buildStatusOptions = (selectedStatus) => STATUS_OPTIONS
  .map((status) => `<option value="${status}" ${selectedStatus === status ? 'selected' : ''}>${STATUS_LABELS[status]}</option>`)
  .join('');

const renderQueue = () => {
  const customers = repository
    .list()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (customers.length === 0) {
    elements.queueList.innerHTML = '<li class="queue-empty">Nenhum cliente na fila no momento.</li>';
    updateCounter();
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
              <select data-action="update-status" aria-label="Atualizar status de ${customer.name}">
                ${buildStatusOptions(customer.status)}
              </select>
            </label>
          </div>
        </li>
      `;
    })
    .join('');

  updateCounter();
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

const handleSubmit = (event) => {
  event.preventDefault();

  const formData = new FormData(elements.form);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    whatsapp: formatPhone(String(formData.get('whatsapp') || '')),
    partySize: Number.parseInt(String(formData.get('partySize') || ''), 10),
    notes: String(formData.get('notes') || '').trim()
  };

  const validationError = validateCustomerData(payload);

  if (validationError) {
    setFeedback(validationError, true);
    return;
  }

  const customer = repository.create(createCustomer(payload));

  setFeedback(`Cliente ${customer.name} adicionado(a) à fila com sucesso.`);
  elements.form.reset();
  renderQueue();
};

const handleQueueInteraction = (event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'update-status') {
    return;
  }

  const listItem = target.closest('.queue-item');

  if (!listItem) {
    return;
  }

  const customerId = listItem.dataset.id;

  repository.updateStatus(customerId, target.value);
  updateCounter();
};

const initialize = () => {
  elements.form.addEventListener('submit', handleSubmit);
  elements.queueList.addEventListener('change', handleQueueInteraction);
  renderQueue();
};

initialize();
