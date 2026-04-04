/* Elevation Jeeps — Customer Portal */

(function() {
  'use strict';

  // ---- DATA LAYER (localStorage) ----
  const STORE_KEYS = {
    users: 'ej_portal_users',
    estimates: 'ej_portal_estimates',
    session: 'ej_portal_session',
    leads: 'ej_portal_leads'
  };

  function getStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  }

  function setStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function initData() {
    if (!getStore(STORE_KEYS.users)) {
      setStore(STORE_KEYS.users, [
        { id: 'admin-1', role: 'admin', name: 'Elevation Jeeps Admin', email: 'admin@elevationjeeps.com', password: 'admin123', phone: '(832) 974-4133', emailValidated: true },
        { id: 'cust-1', role: 'customer', name: 'John Smith', email: 'customer@test.com', password: 'cust123', phone: '(713) 555-0101', address: '123 Oak Lane, Houston, TX 77001', vehicle: '2024 Jeep Wrangler JL Rubicon', emailValidated: true, marketingConsent: true }
      ]);
    }
    if (!getStore(STORE_KEYS.estimates)) {
      setStore(STORE_KEYS.estimates, [
        {
          id: 'est-demo-1',
          customerId: 'cust-1',
          title: 'Suspension Lift Kit Installation',
          vehicle: '2024 Jeep Wrangler JL Rubicon',
          notes: 'Customer requested 3.5" lift with Fox shocks. Includes alignment after install.',
          parts: [
            { description: 'Mopar 3.5" Lift Kit', qty: 1, price: 1899.99 },
            { description: 'Fox 2.0 Performance Shocks (x4)', qty: 4, price: 249.99 },
            { description: 'Extended Sway Bar Links', qty: 2, price: 89.99 }
          ],
          labor: [
            { description: 'Suspension Lift Installation', hours: 6, rate: 150 },
            { description: 'Alignment After Lift', hours: 1, rate: 125 }
          ],
          other: [
            { description: 'Shop Supplies & Hardware', amount: 45 }
          ],
          taxRate: 8.25,
          status: 'pending',
          comments: [
            { author: 'Elevation Jeeps', text: 'Estimate ready for your review. All parts sourced from our trusted vendors.', date: '2026-04-01T10:00:00Z' }
          ],
          createdAt: '2026-04-01T09:30:00Z'
        }
      ]);
    }
  }

  function getUsers() { return getStore(STORE_KEYS.users) || []; }
  function saveUsers(users) { setStore(STORE_KEYS.users, users); }
  function getEstimates() { return getStore(STORE_KEYS.estimates) || []; }
  function saveEstimates(estimates) { setStore(STORE_KEYS.estimates, estimates); }
  function getLeads() { return getStore(STORE_KEYS.leads) || []; }
  function saveLeads(leads) { setStore(STORE_KEYS.leads, leads); }
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEYS.session)) || null; }
    catch { return null; }
  }
  function setSession(user) { sessionStorage.setItem(STORE_KEYS.session, JSON.stringify(user)); }
  function clearSession() { sessionStorage.removeItem(STORE_KEYS.session); }

  function generateId() { return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6); }

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  }

  function calcEstimateTotal(est) {
    let subtotal = 0;
    (est.parts || []).forEach(p => subtotal += (p.qty || 1) * (p.price || 0));
    (est.labor || []).forEach(l => subtotal += (l.hours || 0) * (l.rate || 0));
    (est.other || []).forEach(o => subtotal += (o.amount || 0));
    const tax = subtotal * ((est.taxRate || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }

  function formatCurrency(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---- DOM REFS ----
  const els = {
    loginSection: document.getElementById('login-section'),
    adminSection: document.getElementById('admin-section'),
    customerSection: document.getElementById('customer-section'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    adminLogout: document.getElementById('admin-logout'),
    customerLogout: document.getElementById('customer-logout'),
    customerName: document.getElementById('customer-name'),
    adminEstimatesList: document.getElementById('admin-estimates-list'),
    customerEstimatesList: document.getElementById('customer-estimates-list'),
    noEstimates: document.getElementById('no-estimates'),
    customersList: document.getElementById('customers-list'),
    customerSearch: document.getElementById('customer-search'),
    modal: document.getElementById('estimate-modal'),
    modalClose: document.getElementById('modal-close'),
    estimateDetail: document.getElementById('estimate-detail'),
    estimateError: document.getElementById('estimate-error')
  };

  // ---- NAVIGATION ----
  function showSection(section) {
    els.loginSection.style.display = 'none';
    els.adminSection.style.display = 'none';
    els.customerSection.style.display = 'none';
    if (section === 'login') els.loginSection.style.display = '';
    if (section === 'admin') els.adminSection.style.display = '';
    if (section === 'customer') els.customerSection.style.display = '';
  }

  // ---- LOGIN ----
  let loginRole = 'customer';

  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loginRole = tab.dataset.tab;
    });
  });

  els.loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = els.loginEmail.value.trim().toLowerCase();
    const password = els.loginPassword.value;
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password && u.role === loginRole);

    if (!user) {
      els.loginError.textContent = 'Invalid email or password.';
      els.loginError.classList.add('visible');
      return;
    }

    if (!user.emailValidated) {
      els.loginError.textContent = 'Email not yet validated. Please check your inbox for the validation email.';
      els.loginError.classList.add('visible');
      return;
    }

    els.loginError.classList.remove('visible');
    setSession({ id: user.id, role: user.role, name: user.name, email: user.email });

    if (user.role === 'admin') {
      showSection('admin');
      renderAdminEstimates();
      renderCustomers();
      renderLeads();
      populateCustomerDropdown();
    } else {
      showSection('customer');
      els.customerName.textContent = user.name;
      renderCustomerEstimates(user.id);
      renderCustomerProfile(user.id);
    }
  });

  // Logout
  if (els.adminLogout) els.adminLogout.addEventListener('click', () => { clearSession(); showSection('login'); });
  if (els.customerLogout) els.customerLogout.addEventListener('click', () => { clearSession(); showSection('login'); });

  // ---- ADMIN TABS ----
  document.querySelectorAll('#admin-section .portal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#admin-section .portal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#admin-section .portal-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.panel).classList.add('active');
      // Refresh customer dropdown when switching to create estimate
      if (tab.dataset.panel === 'admin-create') populateCustomerDropdown();
    });
  });

  // ---- CUSTOMER TABS ----
  document.querySelectorAll('#customer-section .portal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#customer-section .portal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#customer-section .portal-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.panel).classList.add('active');
    });
  });

  // ---- STATUS FILTER ----
  let adminEstimatesFilter = 'all';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminEstimatesFilter = btn.dataset.filter;
      renderAdminEstimates();
    });
  });

  // ---- RENDER ADMIN ESTIMATES ----
  function renderEstimateSummary() {
    const all = getEstimates();
    const openEstimates = all.filter(e => e.status !== 'closed');
    const counts = { total: openEstimates.length, pending: 0, approved: 0, denied: 0, commented: 0, closed: 0 };
    all.forEach(e => { if (counts.hasOwnProperty(e.status)) counts[e.status]++; });
    const summaryEl = document.getElementById('estimates-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="summary-stat"><span class="summary-num">${counts.total}</span><span class="summary-label">Open</span></div>
        <div class="summary-stat"><span class="summary-num stat-pending">${counts.pending}</span><span class="summary-label">Pending</span></div>
        <div class="summary-stat"><span class="summary-num stat-approved">${counts.approved}</span><span class="summary-label">Approved</span></div>
        <div class="summary-stat"><span class="summary-num stat-denied">${counts.denied}</span><span class="summary-label">Denied</span></div>
        <div class="summary-stat"><span class="summary-num stat-commented">${counts.commented}</span><span class="summary-label">Commented</span></div>
        <div class="summary-stat"><span class="summary-num stat-closed">${counts.closed}</span><span class="summary-label">Closed</span></div>
      `;
    }
  }

  function renderAdminEstimates() {
    const allEstimates = getEstimates();
    renderEstimateSummary();
    let estimates = allEstimates;
    if (adminEstimatesFilter !== 'all') {
      estimates = estimates.filter(e => e.status === adminEstimatesFilter);
    }
    const users = getUsers();
    if (!estimates.length) {
      const msg = adminEstimatesFilter === 'all' ? 'No estimates created yet.' : 'No ' + adminEstimatesFilter + ' estimates.';
      els.adminEstimatesList.innerHTML = '<div class="empty-state"><p>' + msg + '</p></div>';
      return;
    }
    els.adminEstimatesList.innerHTML = estimates.map(est => {
      const cust = users.find(u => u.id === est.customerId);
      const totals = calcEstimateTotal(est);
      return `<div class="estimate-card" data-id="${est.id}">
        <div class="estimate-card-header">
          <h4>${esc(est.title)}</h4>
          <span class="estimate-status status-${est.status}">${est.status}</span>
        </div>
        <div class="estimate-card-meta">
          <span>Customer: ${cust ? esc(cust.name) : 'Unassigned'}</span>
          <span>Vehicle: ${esc(est.vehicle)}</span>
          <span>${formatDate(est.createdAt)}</span>
        </div>
        <div class="estimate-card-total">${formatCurrency(totals.total)}</div>
      </div>`;
    }).join('');

    els.adminEstimatesList.querySelectorAll('.estimate-card').forEach(card => {
      card.addEventListener('click', () => openEstimateModal(card.dataset.id, 'admin'));
    });
  }

  // ---- RENDER CUSTOMER ESTIMATES ----
  function renderCustomerEstimates(customerId) {
    const estimates = getEstimates().filter(e => e.customerId === customerId);
    if (!estimates.length) {
      els.customerEstimatesList.innerHTML = '';
      els.noEstimates.style.display = '';
      return;
    }
    els.noEstimates.style.display = 'none';
    els.customerEstimatesList.innerHTML = estimates.map(est => {
      const totals = calcEstimateTotal(est);
      return `<div class="estimate-card" data-id="${est.id}">
        <div class="estimate-card-header">
          <h4>${esc(est.title)}</h4>
          <span class="estimate-status status-${est.status}">${est.status}</span>
        </div>
        <div class="estimate-card-meta">
          <span>Vehicle: ${esc(est.vehicle)}</span>
          <span>${formatDate(est.createdAt)}</span>
        </div>
        <div class="estimate-card-total">${formatCurrency(totals.total)}</div>
      </div>`;
    }).join('');

    els.customerEstimatesList.querySelectorAll('.estimate-card').forEach(card => {
      card.addEventListener('click', () => openEstimateModal(card.dataset.id, 'customer'));
    });
  }

  // ---- RENDER CUSTOMERS ----
  function renderCustomers(filter) {
    const users = getUsers().filter(u => u.role === 'customer');
    let filtered = users;
    if (filter) {
      const q = filter.toLowerCase();
      filtered = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
      );
    }
    if (!filtered.length) {
      els.customersList.innerHTML = '<div class="empty-state"><p>No customers found.</p></div>';
      return;
    }
    els.customersList.innerHTML = filtered.map(u => `
      <div class="customer-card" data-customer-id="${u.id}">
        <div class="customer-info">
          <h4>${esc(u.email)}</h4>
          <p>${esc(u.name)} &bull; ${esc(u.phone || 'No phone')} &bull; ${esc(u.vehicle || 'No vehicle')}</p>
          ${u.address ? `<p style="font-size:0.85rem; color: var(--color-text-muted);">${esc(u.address)}</p>` : ''}
          <p style="font-size: 0.8rem; color: ${u.emailValidated ? '#48c78e' : '#e2b04a'};">
            ${u.emailValidated ? '&#10003; Email validated' : '&#9888; Awaiting email validation'}
          </p>
        </div>
        <div class="customer-card-actions">
          ${!u.emailValidated ? `<button class="btn btn-primary btn-sm validate-email-btn" data-user-id="${u.id}">Simulate Validation</button>` : ''}
        </div>
      </div>
    `).join('');

    // Attach validate email handlers
    els.customersList.querySelectorAll('.validate-email-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.dataset.userId;
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return;
        users[idx].emailValidated = true;
        saveUsers(users);

        // Show the generated password
        const card = btn.closest('.customer-card');
        const actionsDiv = card.querySelector('.customer-card-actions');
        if (actionsDiv) {
          actionsDiv.innerHTML = `<p style="color:#48c78e; font-size:0.85rem;">&#10003; Validated! Login: <strong>${esc(users[idx].email)}</strong> / <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">${esc(users[idx].pendingPassword || users[idx].password)}</code></p>`;
        }

        // Update the status text
        const statusP = card.querySelector('.customer-info p:last-of-type');
        if (statusP) {
          statusP.style.color = '#48c78e';
          statusP.innerHTML = '&#10003; Email validated';
        }

        populateCustomerDropdown();
      });
    });
  }

  if (els.customerSearch) {
    els.customerSearch.addEventListener('input', () => renderCustomers(els.customerSearch.value));
  }

  // ---- POPULATE CUSTOMER DROPDOWN ----
  function populateCustomerDropdown() {
    const select = document.getElementById('estimate-customer-select');
    if (!select) return;
    const customers = getUsers().filter(u => u.role === 'customer' && u.emailValidated);
    select.innerHTML = '<option value="">— Select a customer —</option>' +
      customers.map(u => `<option value="${u.id}">${esc(u.email)} — ${esc(u.name)}</option>`).join('');
    // Reset selection state
    selectedCustomerId = null;
    const selectedCustEl = document.getElementById('selected-customer');
    if (selectedCustEl) selectedCustEl.classList.remove('visible');
  }

  // Handle dropdown change
  const estCustSelect = document.getElementById('estimate-customer-select');
  const selectedCustEl = document.getElementById('selected-customer');

  if (estCustSelect) {
    estCustSelect.addEventListener('change', function() {
      const userId = this.value;
      if (!userId) {
        selectedCustomerId = null;
        if (selectedCustEl) selectedCustEl.classList.remove('visible');
        document.getElementById('estimate-vehicle').value = '';
        return;
      }
      const user = getUsers().find(u => u.id === userId);
      if (user) {
        selectedCustomerId = user.id;
        if (selectedCustEl) {
          selectedCustEl.textContent = user.email + ' — ' + user.name;
          selectedCustEl.classList.add('visible');
        }
        const vehicleInput = document.getElementById('estimate-vehicle');
        if (vehicleInput && user.vehicle) {
          vehicleInput.value = user.vehicle;
        }
      }
    });
  }

  // ---- ADD CUSTOMER ----
  const addCustBtn = document.getElementById('add-customer-btn');
  const addCustForm = document.getElementById('add-customer-form');
  const saveCustBtn = document.getElementById('save-customer-btn');
  const cancelCustBtn = document.getElementById('cancel-customer-btn');

  if (addCustBtn) addCustBtn.addEventListener('click', () => {
    addCustForm.style.display = '';
    const msgEl = document.getElementById('customer-save-msg');
    if (msgEl) msgEl.style.display = 'none';
  });
  if (cancelCustBtn) cancelCustBtn.addEventListener('click', () => { addCustForm.style.display = 'none'; });

  if (saveCustBtn) saveCustBtn.addEventListener('click', () => {
    const name = document.getElementById('cust-name').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const vehicle = document.getElementById('cust-vehicle').value.trim();
    const msgEl = document.getElementById('customer-save-msg');

    if (!name || !email) {
      if (msgEl) {
        msgEl.style.display = '';
        msgEl.style.background = 'rgba(241,70,104,0.1)';
        msgEl.style.borderColor = 'rgba(241,70,104,0.3)';
        msgEl.style.color = '#f14668';
        msgEl.textContent = 'Name and email are required.';
      }
      return;
    }

    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      if (msgEl) {
        msgEl.style.display = '';
        msgEl.style.background = 'rgba(241,70,104,0.1)';
        msgEl.style.borderColor = 'rgba(241,70,104,0.3)';
        msgEl.style.color = '#f14668';
        msgEl.textContent = 'A customer with this email already exists.';
      }
      return;
    }

    const generatedPassword = generatePassword();
    const newUser = {
      id: generateId(),
      role: 'customer',
      name,
      email,
      phone,
      address,
      vehicle,
      password: generatedPassword,
      emailValidated: false,
      pendingPassword: generatedPassword
    };
    users.push(newUser);
    saveUsers(users);

    // Clear form
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-email').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-address').value = '';
    document.getElementById('cust-vehicle').value = '';

    // Show confirmation
    if (msgEl) {
      msgEl.style.display = '';
      msgEl.style.background = 'rgba(72,199,142,0.1)';
      msgEl.style.borderColor = 'rgba(72,199,142,0.3)';
      msgEl.style.color = '#48c78e';
      msgEl.innerHTML = `
        <strong>Customer created!</strong><br>
        A validation email has been sent to <strong>${esc(email)}</strong>.<br>
        The customer must validate their email before they can log in.<br>
        Once validated, their login credentials will be:<br>
        <strong>Username:</strong> ${esc(email)}<br>
        <strong>Temporary password:</strong> <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">${esc(generatedPassword)}</code><br>
        <em style="font-size:0.8rem;">Please share this password securely with the customer after they validate their email.</em>
      `;
    }

    renderCustomers();
    populateCustomerDropdown();
  });

  // ---- ESTIMATE CREATION ----
  let selectedCustomerId = null;

  // Line item management
  function addLineItem(containerId, type) {
    const container = document.getElementById(containerId);
    const item = document.createElement('div');
    item.className = 'line-item';

    if (type === 'part') {
      item.innerHTML = `
        <input type="text" placeholder="Part description" class="li-desc">
        <input type="number" placeholder="Qty" value="1" min="1" class="li-qty">
        <input type="number" placeholder="Price" step="0.01" min="0" class="li-price">
        <button class="line-item-remove">&times;</button>
      `;
    } else if (type === 'labor') {
      item.innerHTML = `
        <input type="text" placeholder="Labor description" class="li-desc">
        <input type="number" placeholder="Hours" step="0.5" min="0" class="li-hours">
        <input type="number" placeholder="Rate/hr" step="0.01" min="0" class="li-rate">
        <button class="line-item-remove">&times;</button>
      `;
    } else {
      item.innerHTML = `
        <input type="text" placeholder="Charge description" class="li-desc">
        <input type="number" placeholder="Amount" step="0.01" min="0" class="li-amount" style="grid-column: span 2;">
        <button class="line-item-remove">&times;</button>
      `;
    }

    item.querySelector('.line-item-remove').addEventListener('click', () => { item.remove(); updateTotal(); });
    item.querySelectorAll('input[type="number"]').forEach(inp => inp.addEventListener('input', updateTotal));
    container.appendChild(item);
  }

  document.getElementById('add-part-btn')?.addEventListener('click', () => addLineItem('parts-list', 'part'));
  document.getElementById('add-labor-btn')?.addEventListener('click', () => addLineItem('labor-list', 'labor'));
  document.getElementById('add-other-btn')?.addEventListener('click', () => addLineItem('other-list', 'other'));

  function updateTotal() {
    let subtotal = 0;
    document.querySelectorAll('#parts-list .line-item').forEach(li => {
      subtotal += (parseFloat(li.querySelector('.li-qty')?.value) || 0) * (parseFloat(li.querySelector('.li-price')?.value) || 0);
    });
    document.querySelectorAll('#labor-list .line-item').forEach(li => {
      subtotal += (parseFloat(li.querySelector('.li-hours')?.value) || 0) * (parseFloat(li.querySelector('.li-rate')?.value) || 0);
    });
    document.querySelectorAll('#other-list .line-item').forEach(li => {
      subtotal += parseFloat(li.querySelector('.li-amount')?.value) || 0;
    });
    const taxRate = parseFloat(document.getElementById('estimate-tax-rate')?.value) || 0;
    const tax = subtotal * (taxRate / 100);
    document.getElementById('estimate-total').textContent = formatCurrency(subtotal + tax);
  }

  document.getElementById('estimate-tax-rate')?.addEventListener('input', updateTotal);

  // Submit estimate
  document.getElementById('submit-estimate-btn')?.addEventListener('click', () => {
    const errEl = document.getElementById('estimate-error');
    const title = document.getElementById('estimate-title')?.value.trim();
    const vehicle = document.getElementById('estimate-vehicle')?.value.trim();
    const notes = document.getElementById('estimate-notes')?.value.trim();
    const taxRate = parseFloat(document.getElementById('estimate-tax-rate')?.value) || 0;

    if (!selectedCustomerId || !title) {
      errEl.textContent = 'Please select a customer and enter an estimate title.';
      errEl.classList.add('visible');
      return;
    }

    const parts = [];
    document.querySelectorAll('#parts-list .line-item').forEach(li => {
      const desc = li.querySelector('.li-desc')?.value.trim();
      if (desc) parts.push({ description: desc, qty: parseFloat(li.querySelector('.li-qty')?.value) || 1, price: parseFloat(li.querySelector('.li-price')?.value) || 0 });
    });

    const labor = [];
    document.querySelectorAll('#labor-list .line-item').forEach(li => {
      const desc = li.querySelector('.li-desc')?.value.trim();
      if (desc) labor.push({ description: desc, hours: parseFloat(li.querySelector('.li-hours')?.value) || 0, rate: parseFloat(li.querySelector('.li-rate')?.value) || 0 });
    });

    const other = [];
    document.querySelectorAll('#other-list .line-item').forEach(li => {
      const desc = li.querySelector('.li-desc')?.value.trim();
      if (desc) other.push({ description: desc, amount: parseFloat(li.querySelector('.li-amount')?.value) || 0 });
    });

    const estimate = {
      id: generateId(),
      customerId: selectedCustomerId,
      title, vehicle, notes, parts, labor, other, taxRate,
      status: 'pending',
      comments: [{ author: 'Elevation Jeeps', text: 'Estimate created and ready for your review.', date: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    };

    const estimates = getEstimates();
    estimates.push(estimate);
    saveEstimates(estimates);

    // Reset form
    errEl.classList.remove('visible');
    document.getElementById('estimate-title').value = '';
    document.getElementById('estimate-vehicle').value = '';
    document.getElementById('estimate-notes').value = '';
    document.getElementById('parts-list').innerHTML = '';
    document.getElementById('labor-list').innerHTML = '';
    document.getElementById('other-list').innerHTML = '';
    document.getElementById('estimate-total').textContent = '$0.00';
    if (estCustSelect) estCustSelect.value = '';
    if (selectedCustEl) selectedCustEl.classList.remove('visible');
    selectedCustomerId = null;

    // Switch to estimates tab
    document.querySelector('#admin-section [data-panel="admin-estimates"]').click();
    renderAdminEstimates();
  });

  // ---- ESTIMATE DETAIL MODAL ----
  function openEstimateModal(estimateId, viewRole) {
    const estimates = getEstimates();
    const est = estimates.find(e => e.id === estimateId);
    if (!est) return;

    const users = getUsers();
    const cust = users.find(u => u.id === est.customerId);
    const totals = calcEstimateTotal(est);

    let html = `
      <div class="estimate-detail-header">
        <h2>${esc(est.title)}</h2>
        <div class="estimate-detail-meta">
          <span>Customer: <strong>${cust ? esc(cust.name) : 'N/A'}</strong></span>
          <span>Vehicle: <strong>${esc(est.vehicle)}</strong></span>
          <span>Date: <strong>${formatDate(est.createdAt)}</strong></span>
          <span>Status: <span class="estimate-status status-${est.status}">${est.status}</span></span>
        </div>
      </div>
    `;

    if (est.notes) {
      html += `<p style="color: var(--color-text-muted); margin-bottom: 24px;">${esc(est.notes)}</p>`;
    }

    // Parts table
    if (est.parts && est.parts.length) {
      html += `<table class="estimate-table">
        <thead><tr><th>Part</th><th>Qty</th><th class="amount">Price</th><th class="amount">Total</th></tr></thead>
        <tbody>${est.parts.map(p => `<tr><td>${esc(p.description)}</td><td>${p.qty}</td><td class="amount">${formatCurrency(p.price)}</td><td class="amount">${formatCurrency(p.qty * p.price)}</td></tr>`).join('')}</tbody>
      </table>`;
    }

    // Labor table
    if (est.labor && est.labor.length) {
      html += `<table class="estimate-table">
        <thead><tr><th>Labor</th><th>Hours</th><th class="amount">Rate</th><th class="amount">Total</th></tr></thead>
        <tbody>${est.labor.map(l => `<tr><td>${esc(l.description)}</td><td>${l.hours}</td><td class="amount">${formatCurrency(l.rate)}/hr</td><td class="amount">${formatCurrency(l.hours * l.rate)}</td></tr>`).join('')}</tbody>
      </table>`;
    }

    // Other charges
    if (est.other && est.other.length) {
      html += `<table class="estimate-table">
        <thead><tr><th>Other Charges</th><th class="amount" colspan="3">Amount</th></tr></thead>
        <tbody>${est.other.map(o => `<tr><td>${esc(o.description)}</td><td class="amount" colspan="3">${formatCurrency(o.amount)}</td></tr>`).join('')}</tbody>
      </table>`;
    }

    // Summary
    html += `<div class="estimate-summary">
      <div class="estimate-summary-row"><span>Subtotal</span><span class="value">${formatCurrency(totals.subtotal)}</span></div>
      <div class="estimate-summary-row"><span>Tax (${est.taxRate}%)</span><span class="value">${formatCurrency(totals.tax)}</span></div>
      <div class="estimate-summary-row total"><span>Total</span><span class="value">${formatCurrency(totals.total)}</span></div>
    </div>`;

    // Comments
    html += `<div class="comments-section"><h3>Comments</h3>`;
    (est.comments || []).forEach(c => {
      html += `<div class="comment-item">
        <div class="comment-author">${esc(c.author)}</div>
        <div class="comment-text">${esc(c.text)}</div>
        <div class="comment-date">${formatDate(c.date)}</div>
      </div>`;
    });
    html += `<div class="add-comment">
      <input type="text" id="new-comment" placeholder="Add a comment...">
      <button class="btn btn-primary btn-sm" id="post-comment-btn">Post</button>
    </div></div>`;

    // Actions
    html += '<div class="estimate-actions">';
    if (viewRole === 'customer' && (est.status === 'pending' || est.status === 'commented')) {
      html += `<button class="btn btn-approve" id="approve-btn">Approve Estimate</button>`;
      html += `<button class="btn btn-deny" id="deny-btn">Deny Estimate</button>`;
    }
    if (viewRole === 'admin') {
      if (est.status !== 'closed') {
        html += `<button class="btn btn-close-estimate" id="close-estimate-btn">Close Estimate</button>`;
      } else {
        html += `<button class="btn btn-reopen-estimate" id="reopen-estimate-btn">Reopen Estimate</button>`;
      }
      html += `<button class="btn btn-download" id="download-btn-any">Download PDF</button>`;
    }
    if (viewRole === 'customer') {
      html += `<button class="btn btn-download" id="download-btn-cust">Download PDF</button>`;
    }
    html += '</div>';

    els.estimateDetail.innerHTML = html;
    els.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Comment posting
    document.getElementById('post-comment-btn')?.addEventListener('click', () => {
      const input = document.getElementById('new-comment');
      const text = input.value.trim();
      if (!text) return;

      const session = getSession();
      const estimates = getEstimates();
      const idx = estimates.findIndex(e => e.id === estimateId);
      if (idx === -1) return;

      estimates[idx].comments = estimates[idx].comments || [];
      estimates[idx].comments.push({ author: session.name, text, date: new Date().toISOString() });

      // If customer is commenting on a pending estimate, update status to 'commented'
      if (session.role === 'customer' && estimates[idx].status === 'pending') {
        estimates[idx].status = 'commented';
      }

      saveEstimates(estimates);
      openEstimateModal(estimateId, viewRole);
    });

    // Approve
    document.getElementById('approve-btn')?.addEventListener('click', () => {
      const estimates = getEstimates();
      const idx = estimates.findIndex(e => e.id === estimateId);
      if (idx === -1) return;
      estimates[idx].status = 'approved';
      estimates[idx].comments.push({ author: getSession().name, text: 'Estimate approved.', date: new Date().toISOString() });
      saveEstimates(estimates);
      openEstimateModal(estimateId, viewRole);
      renderCustomerEstimates(getSession().id);
    });

    // Deny
    document.getElementById('deny-btn')?.addEventListener('click', () => {
      const estimates = getEstimates();
      const idx = estimates.findIndex(e => e.id === estimateId);
      if (idx === -1) return;
      estimates[idx].status = 'denied';
      estimates[idx].comments.push({ author: getSession().name, text: 'Estimate denied.', date: new Date().toISOString() });
      saveEstimates(estimates);
      openEstimateModal(estimateId, viewRole);
      renderCustomerEstimates(getSession().id);
    });

    // Close estimate
    document.getElementById('close-estimate-btn')?.addEventListener('click', () => {
      const estimates = getEstimates();
      const idx = estimates.findIndex(e => e.id === estimateId);
      if (idx === -1) return;
      estimates[idx].status = 'closed';
      estimates[idx].comments.push({ author: 'Elevation Jeeps', text: 'Estimate closed — physical work has started.', date: new Date().toISOString() });
      saveEstimates(estimates);
      openEstimateModal(estimateId, viewRole);
      renderAdminEstimates();
    });

    // Reopen estimate
    document.getElementById('reopen-estimate-btn')?.addEventListener('click', () => {
      const estimates = getEstimates();
      const idx = estimates.findIndex(e => e.id === estimateId);
      if (idx === -1) return;
      estimates[idx].status = 'pending';
      estimates[idx].comments.push({ author: 'Elevation Jeeps', text: 'Estimate reopened.', date: new Date().toISOString() });
      saveEstimates(estimates);
      openEstimateModal(estimateId, viewRole);
      renderAdminEstimates();
    });

    // Download
    document.getElementById('download-btn-any')?.addEventListener('click', () => downloadEstimate(estimateId));
    document.getElementById('download-btn-cust')?.addEventListener('click', () => downloadEstimate(estimateId));
  }

  // Close modal
  if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
  if (els.modal) els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function closeModal() {
    els.modal.style.display = 'none';
    document.body.style.overflow = '';
    const session = getSession();
    if (session && session.role === 'admin') renderAdminEstimates();
    if (session && session.role === 'customer') renderCustomerEstimates(session.id);
  }

  // ---- DOWNLOAD ESTIMATE ----
  function downloadEstimate(estimateId) {
    const estimates = getEstimates();
    const est = estimates.find(e => e.id === estimateId);
    if (!est) return;

    const users = getUsers();
    const cust = users.find(u => u.id === est.customerId);
    const totals = calcEstimateTotal(est);

    const logoUrl = 'https://elevationjeeps.com/cdn/shop/files/Elevation_Jeeps_Logo_Colored_Lockup_Jeeps_Filter_copy_500x.png';

    // Build a printable HTML document
    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Estimate - ${esc(est.title)}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #5baab7; padding-bottom: 20px; }
  .header-left img { height: 70px; display: block; margin-bottom: 8px; }
  .header-left h1 { color: #263240; font-size: 22px; margin: 0 0 4px; }
  .header-left .status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
  .company { font-size: 13px; color: #666; text-align: right; }
  .company strong { color: #263240; font-size: 16px; display: block; margin-bottom: 4px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .meta-item { font-size: 13px; }
  .meta-item strong { display: block; font-size: 11px; text-transform: uppercase; color: #5baab7; letter-spacing: 1px; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #5baab7; border-bottom: 2px solid #5baab7; }
  td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
  .amount { text-align: right; }
  .summary { background: #f8f9fa; padding: 16px 20px; border-radius: 6px; margin-top: 20px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .summary-row.total { border-top: 2px solid #5baab7; padding-top: 10px; margin-top: 8px; font-size: 18px; font-weight: bold; color: #263240; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-approved { background: #d4edda; color: #155724; }
  .status-denied { background: #f8d7da; color: #721c24; }
  .status-commented { background: #cff4fc; color: #0c5460; }
  .status-closed { background: #e2e3e5; color: #6c757d; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
  .footer .disclaimer { font-style: italic; margin-bottom: 8px; }
  .footer .contact { color: #999; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <div class="header-left">
      <img src="${logoUrl}" alt="Elevation Jeeps Logo" onerror="this.style.display='none'">
      <h1>${esc(est.title)}</h1>
      <span class="status status-${est.status}">${est.status.toUpperCase()}</span>
    </div>
    <div class="company">
      <strong>Elevation Jeeps</strong>
      17655 Katy Fwy<br>Houston, TX 77094<br>(832) 974-4133<br>sales@elevationjeeps.com
    </div>
  </div>
  <div class="meta">
    <div class="meta-item"><strong>Customer</strong>${cust ? esc(cust.name) : 'N/A'}</div>
    <div class="meta-item"><strong>Date</strong>${formatDate(est.createdAt)}</div>
    <div class="meta-item"><strong>Vehicle</strong>${esc(est.vehicle)}</div>
    <div class="meta-item"><strong>Estimate #</strong>${est.id.substring(0, 12).toUpperCase()}</div>
  </div>
  ${est.notes ? `<p style="font-size: 13px; color: #666; margin-bottom: 20px;">${esc(est.notes)}</p>` : ''}
  ${est.parts && est.parts.length ? `<table><thead><tr><th>Part</th><th>Qty</th><th class="amount">Price</th><th class="amount">Total</th></tr></thead><tbody>${est.parts.map(p => `<tr><td>${esc(p.description)}</td><td>${p.qty}</td><td class="amount">$${p.price.toFixed(2)}</td><td class="amount">$${(p.qty * p.price).toFixed(2)}</td></tr>`).join('')}</tbody></table>` : ''}
  ${est.labor && est.labor.length ? `<table><thead><tr><th>Labor</th><th>Hours</th><th class="amount">Rate</th><th class="amount">Total</th></tr></thead><tbody>${est.labor.map(l => `<tr><td>${esc(l.description)}</td><td>${l.hours}</td><td class="amount">$${l.rate.toFixed(2)}/hr</td><td class="amount">$${(l.hours * l.rate).toFixed(2)}</td></tr>`).join('')}</tbody></table>` : ''}
  ${est.other && est.other.length ? `<table><thead><tr><th>Other Charges</th><th class="amount" colspan="3">Amount</th></tr></thead><tbody>${est.other.map(o => `<tr><td>${esc(o.description)}</td><td class="amount" colspan="3">$${o.amount.toFixed(2)}</td></tr>`).join('')}</tbody></table>` : ''}
  <div class="summary">
    <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
    <div class="summary-row"><span>Tax (${est.taxRate}%)</span><span>${formatCurrency(totals.tax)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${formatCurrency(totals.total)}</span></div>
  </div>
  <div class="footer">
    <p class="disclaimer"><strong>Please Note:</strong> This is an estimate. During the work being done there could be additional changes — these will always be communicated and agreed upon before any additional work is performed.</p>
    <p class="contact">Elevation Jeeps &mdash; Quality. Integrity. Transparency. &mdash; elevationjeeps.com</p>
  </div>
</body></html>`;

    // Open in new window for print/save as PDF
    const printWin = window.open('', '_blank');
    printWin.document.write(printHtml);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  }

  // ---- CUSTOMER PROFILE ----
  function renderCustomerProfile(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const profileEl = document.getElementById('customer-profile-info');
    if (!profileEl) return;

    profileEl.innerHTML = `
      <div class="profile-grid">
        <div class="profile-item">
          <strong>Full Name</strong>
          <span>${esc(user.name || '—')}</span>
        </div>
        <div class="profile-item">
          <strong>Email Address</strong>
          <span>${esc(user.email || '—')}</span>
        </div>
        <div class="profile-item">
          <strong>Phone Number</strong>
          <span>${esc(user.phone || '—')}</span>
        </div>
        <div class="profile-item">
          <strong>Address</strong>
          <span>${esc(user.address || '—')}</span>
        </div>
        <div class="profile-item">
          <strong>Vehicle</strong>
          <span>${esc(user.vehicle || '—')}</span>
        </div>
        <div class="profile-item">
          <strong>Marketing Consent</strong>
          <span>${user.marketingConsent !== false ? '&#10003; Opted in' : '&#10007; Opted out'}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="edit-profile-btn" style="margin-top: 16px;">Edit Profile</button>
    `;

    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      profileEl.style.display = 'none';
      const editForm = document.getElementById('profile-edit-form');
      editForm.style.display = '';
      document.getElementById('profile-name').value = user.name || '';
      document.getElementById('profile-email').value = user.email || '';
      document.getElementById('profile-phone').value = user.phone || '';
      document.getElementById('profile-address').value = user.address || '';
      document.getElementById('profile-vehicle').value = user.vehicle || '';
      document.getElementById('profile-marketing-consent').checked = user.marketingConsent !== false;
    });
  }

  // Save profile edits
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const cancelProfileBtn = document.getElementById('cancel-profile-btn');

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      const session = getSession();
      if (!session) return;
      const users = getUsers();
      const idx = users.findIndex(u => u.id === session.id);
      if (idx === -1) return;

      const name = document.getElementById('profile-name').value.trim();
      if (!name) {
        const msgEl = document.getElementById('profile-save-msg');
        if (msgEl) {
          msgEl.style.display = '';
          msgEl.style.background = 'rgba(241,70,104,0.1)';
          msgEl.style.borderColor = 'rgba(241,70,104,0.3)';
          msgEl.style.color = '#f14668';
          msgEl.textContent = 'Name is required.';
        }
        return;
      }

      users[idx].name = name;
      users[idx].phone = document.getElementById('profile-phone').value.trim();
      users[idx].address = document.getElementById('profile-address').value.trim();
      users[idx].vehicle = document.getElementById('profile-vehicle').value.trim();
      users[idx].marketingConsent = document.getElementById('profile-marketing-consent').checked;
      saveUsers(users);

      // Update session name
      session.name = name;
      setSession(session);
      const customerNameEl = document.getElementById('customer-name');
      if (customerNameEl) customerNameEl.textContent = name;

      const msgEl = document.getElementById('profile-save-msg');
      if (msgEl) {
        msgEl.style.display = '';
        msgEl.style.background = 'rgba(72,199,142,0.1)';
        msgEl.style.borderColor = 'rgba(72,199,142,0.3)';
        msgEl.style.color = '#48c78e';
        msgEl.textContent = 'Profile updated successfully!';
      }

      // Re-render and switch back to view mode after a moment
      setTimeout(() => {
        document.getElementById('profile-edit-form').style.display = 'none';
        document.getElementById('customer-profile-info').style.display = '';
        if (msgEl) msgEl.style.display = 'none';
        renderCustomerProfile(session.id);
      }, 1500);
    });
  }

  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', () => {
      document.getElementById('profile-edit-form').style.display = 'none';
      document.getElementById('customer-profile-info').style.display = '';
      const msgEl = document.getElementById('profile-save-msg');
      if (msgEl) msgEl.style.display = 'none';
    });
  }

  // ---- ADMIN LEADS ----
  function renderLeads(filter) {
    const leads = getLeads();
    const leadsListEl = document.getElementById('leads-list');
    if (!leadsListEl) return;

    let filtered = leads;
    if (filter) {
      const q = filter.toLowerCase();
      filtered = leads.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q)
      );
    }

    if (!filtered.length) {
      leadsListEl.innerHTML = '<div class="empty-state"><p>No contacts found. Contacts are created when visitors submit the Contact Us form.</p></div>';
      return;
    }

    leadsListEl.innerHTML = filtered.map(l => `
      <div class="customer-card lead-card" data-lead-id="${l.id}">
        <div class="customer-info">
          <h4>${esc(l.name)}</h4>
          <p>${esc(l.email)}${l.phone ? ' &bull; ' + esc(l.phone) : ''}</p>
          ${l.vehicle ? `<p style="font-size:0.85rem; color: var(--color-text-muted);">Vehicle: ${esc(l.vehicle)}</p>` : ''}
          ${l.service ? `<p style="font-size:0.85rem; color: var(--color-text-muted);">Interest: ${esc(l.service)}</p>` : ''}
          ${l.message ? `<p style="font-size:0.85rem; color: var(--color-text-muted); font-style: italic;">"${esc(l.message.substring(0, 120))}${l.message.length > 120 ? '...' : ''}"</p>` : ''}
          <p style="font-size: 0.8rem; color: var(--color-text-muted);">Submitted: ${formatDate(l.createdAt)}</p>
          <span class="lead-status status-${l.status === 'converted' ? 'approved' : 'pending'}">${l.status === 'converted' ? 'Converted' : 'New'}</span>
        </div>
        ${l.status !== 'converted' ? `<div class="lead-actions">
          <button class="btn btn-primary btn-sm convert-lead-btn" data-lead-id="${l.id}">Convert to Customer</button>
        </div>` : ''}
      </div>
    `).join('');

    leadsListEl.querySelectorAll('.convert-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        convertLeadToCustomer(btn.dataset.leadId);
      });
    });
  }

  function convertLeadToCustomer(leadId) {
    const leads = getLeads();
    const leadIdx = leads.findIndex(l => l.id === leadId);
    if (leadIdx === -1) return;

    const lead = leads[leadIdx];
    const users = getUsers();

    // Check if email already exists as a customer
    if (users.find(u => u.email.toLowerCase() === lead.email.toLowerCase())) {
      const leadsListEl = document.getElementById('leads-list');
      const card = leadsListEl?.querySelector(`[data-lead-id="${leadId}"]`);
      if (card) {
        const actionsDiv = card.querySelector('.lead-actions');
        if (actionsDiv) actionsDiv.innerHTML = '<p style="color:#f14668; font-size:0.85rem;">A customer with this email already exists.</p>';
      }
      return;
    }

    const generatedPassword = generatePassword();
    const newUser = {
      id: generateId(),
      role: 'customer',
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      address: '',
      vehicle: lead.vehicle || '',
      password: generatedPassword,
      pendingPassword: generatedPassword,
      emailValidated: false,
      marketingConsent: true
    };
    users.push(newUser);
    saveUsers(users);

    // Mark lead as converted
    leads[leadIdx].status = 'converted';
    leads[leadIdx].convertedCustomerId = newUser.id;
    saveLeads(leads);

    // Refresh views
    renderLeads(document.getElementById('leads-search')?.value);
    renderCustomers();
    populateCustomerDropdown();

    // Show success feedback inline
    const leadsListEl = document.getElementById('leads-list');
    const card = leadsListEl.querySelector(`[data-lead-id="${leadId}"]`);
    if (card) {
      const actionsDiv = card.querySelector('.lead-actions');
      if (actionsDiv) {
        actionsDiv.innerHTML = `<p style="color:#48c78e; font-size:0.85rem; font-weight:600;">&#10003; Converted! Temp password: <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;">${esc(generatedPassword)}</code></p>`;
      }
    }
  }

  // Leads search
  const leadsSearch = document.getElementById('leads-search');
  if (leadsSearch) {
    leadsSearch.addEventListener('input', () => renderLeads(leadsSearch.value));
  }

  // ---- WORKFLOW BANNER ----
  const dismissWorkflow = document.getElementById('dismiss-workflow');
  if (dismissWorkflow) {
    dismissWorkflow.addEventListener('click', () => {
      const banner = document.getElementById('admin-workflow-banner');
      if (banner) banner.style.display = 'none';
    });
  }

  // ---- CHANGE PASSWORD ----
  const changePwdBtn = document.getElementById('change-password-btn');
  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      const currentPwd = document.getElementById('pwd-current').value;
      const newPwd = document.getElementById('pwd-new').value;
      const confirmPwd = document.getElementById('pwd-confirm').value;
      const msgEl = document.getElementById('password-msg');

      msgEl.classList.remove('visible');
      msgEl.style.color = '';

      const session = getSession();
      if (!session) return;

      const users = getUsers();
      const userIdx = users.findIndex(u => u.id === session.id);
      if (userIdx === -1) return;

      if (users[userIdx].password !== currentPwd) {
        msgEl.textContent = 'Current password is incorrect.';
        msgEl.classList.add('visible');
        return;
      }

      if (newPwd.length < 6) {
        msgEl.textContent = 'New password must be at least 6 characters.';
        msgEl.classList.add('visible');
        return;
      }

      if (newPwd !== confirmPwd) {
        msgEl.textContent = 'New passwords do not match.';
        msgEl.classList.add('visible');
        return;
      }

      users[userIdx].password = newPwd;
      saveUsers(users);

      document.getElementById('pwd-current').value = '';
      document.getElementById('pwd-new').value = '';
      document.getElementById('pwd-confirm').value = '';

      msgEl.textContent = 'Password updated successfully!';
      msgEl.style.color = '#48c78e';
      msgEl.classList.add('visible');
    });
  }

  // ---- UTILITY ----
  function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- INIT ----
  initData();
  const session = getSession();
  if (session) {
    if (session.role === 'admin') {
      showSection('admin');
      renderAdminEstimates();
      renderCustomers();
      renderLeads();
      populateCustomerDropdown();
    } else {
      showSection('customer');
      els.customerName.textContent = session.name;
      renderCustomerEstimates(session.id);
      renderCustomerProfile(session.id);
    }
  } else {
    showSection('login');
  }

  // ---- AUTO-LOGOUT ON LEAVE ----
  // Session stored in sessionStorage: automatically cleared when tab/browser closes.
  // No event listeners needed — navigating between site pages preserves session,
  // but closing the tab or browser logs the user out.

  // Force fade-ins visible
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
})();
