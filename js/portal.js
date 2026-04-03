/* Elevation Jeeps — Customer Portal */

(function() {
  'use strict';

  // ---- DATA LAYER (localStorage) ----
  const STORE_KEYS = {
    users: 'ej_portal_users',
    estimates: 'ej_portal_estimates',
    session: 'ej_portal_session'
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
        { id: 'admin-1', role: 'admin', name: 'Elevation Jeeps Admin', email: 'admin@elevationjeeps.com', password: 'admin123', phone: '(832) 974-4133' },
        { id: 'cust-1', role: 'customer', name: 'John Smith', email: 'customer@test.com', password: 'cust123', phone: '(713) 555-0101', vehicle: '2024 Jeep Wrangler JL Rubicon' }
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
  function getSession() { return getStore(STORE_KEYS.session); }
  function setSession(user) { setStore(STORE_KEYS.session, user); }
  function clearSession() { localStorage.removeItem(STORE_KEYS.session); }

  function generateId() { return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6); }

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

    els.loginError.classList.remove('visible');
    setSession({ id: user.id, role: user.role, name: user.name, email: user.email });

    if (user.role === 'admin') {
      showSection('admin');
      renderAdminEstimates();
      renderCustomers();
    } else {
      showSection('customer');
      els.customerName.textContent = user.name;
      renderCustomerEstimates(user.id);
    }
  });

  // Logout
  if (els.adminLogout) els.adminLogout.addEventListener('click', () => { clearSession(); showSection('login'); });
  if (els.customerLogout) els.customerLogout.addEventListener('click', () => { clearSession(); showSection('login'); });

  // ---- ADMIN TABS ----
  document.querySelectorAll('.portal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.portal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.portal-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.panel).classList.add('active');
    });
  });

  // ---- RENDER ADMIN ESTIMATES ----
  function renderAdminEstimates() {
    const estimates = getEstimates();
    const users = getUsers();
    if (!estimates.length) {
      els.adminEstimatesList.innerHTML = '<div class="empty-state"><p>No estimates created yet.</p></div>';
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
      <div class="customer-card">
        <div class="customer-info">
          <h4>${esc(u.name)}</h4>
          <p>${esc(u.email)} &bull; ${esc(u.phone || 'No phone')} &bull; ${esc(u.vehicle || 'No vehicle')}</p>
        </div>
      </div>
    `).join('');
  }

  if (els.customerSearch) {
    els.customerSearch.addEventListener('input', () => renderCustomers(els.customerSearch.value));
  }

  // ---- ADD CUSTOMER ----
  const addCustBtn = document.getElementById('add-customer-btn');
  const addCustForm = document.getElementById('add-customer-form');
  const saveCustBtn = document.getElementById('save-customer-btn');
  const cancelCustBtn = document.getElementById('cancel-customer-btn');

  if (addCustBtn) addCustBtn.addEventListener('click', () => { addCustForm.style.display = ''; });
  if (cancelCustBtn) cancelCustBtn.addEventListener('click', () => { addCustForm.style.display = 'none'; });

  if (saveCustBtn) saveCustBtn.addEventListener('click', () => {
    const name = document.getElementById('cust-name').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const vehicle = document.getElementById('cust-vehicle').value.trim();
    const password = document.getElementById('cust-password').value.trim();

    if (!name || !email || !password) return;

    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return; // email already exists
    }

    users.push({ id: generateId(), role: 'customer', name, email, phone, vehicle, password });
    saveUsers(users);
    addCustForm.style.display = 'none';
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-email').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-vehicle').value = '';
    document.getElementById('cust-password').value = '';
    renderCustomers();
  });

  // ---- ESTIMATE CREATION ----
  let selectedCustomerId = null;

  // Customer search for estimate assignment
  const estCustSearch = document.getElementById('estimate-customer-search');
  const searchResultsEl = document.getElementById('customer-search-results');
  const selectedCustEl = document.getElementById('selected-customer');

  if (estCustSearch) {
    estCustSearch.addEventListener('input', function() {
      const q = this.value.trim().toLowerCase();
      if (q.length < 2) { searchResultsEl.innerHTML = ''; return; }
      const users = getUsers().filter(u => u.role === 'customer');
      const matches = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
      ).slice(0, 5);

      if (!matches.length) {
        searchResultsEl.innerHTML = '<div class="search-results-dropdown"><div class="search-result-item"><span class="detail">No customers found</span></div></div>';
        return;
      }

      searchResultsEl.innerHTML = '<div class="search-results-dropdown">' + matches.map(u => `
        <div class="search-result-item" data-id="${u.id}">
          <span class="name">${esc(u.name)}</span>
          <span class="detail">${esc(u.email)} &bull; ${esc(u.phone || '')}</span>
        </div>
      `).join('') + '</div>';

      searchResultsEl.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const user = users.find(u => u.id === item.dataset.id);
          if (user) {
            selectedCustomerId = user.id;
            estCustSearch.value = user.name;
            searchResultsEl.innerHTML = '';
            selectedCustEl.textContent = user.name + ' — ' + user.email;
            selectedCustEl.classList.add('visible');
            // Auto-fill vehicle if available
            const vehicleInput = document.getElementById('estimate-vehicle');
            if (vehicleInput && !vehicleInput.value && user.vehicle) {
              vehicleInput.value = user.vehicle;
            }
          }
        });
      });
    });
  }

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
    estCustSearch.value = '';
    selectedCustEl.classList.remove('visible');
    selectedCustomerId = null;

    // Switch to estimates tab
    document.querySelector('[data-panel="admin-estimates"]').click();
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
    if (viewRole === 'customer' && est.status === 'pending') {
      html += `<button class="btn btn-approve" id="approve-btn">Approve Estimate</button>`;
      html += `<button class="btn btn-deny" id="deny-btn">Deny Estimate</button>`;
    }
    if (viewRole === 'admin' && est.status === 'approved') {
      html += `<button class="btn btn-download" id="download-btn">Download Estimate</button>`;
    }
    if (viewRole === 'admin') {
      html += `<button class="btn btn-download" id="download-btn-any">Download PDF</button>`;
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

    // Download
    const downloadHandler = () => downloadEstimate(estimateId);
    document.getElementById('download-btn')?.addEventListener('click', downloadHandler);
    document.getElementById('download-btn-any')?.addEventListener('click', downloadHandler);
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
  }

  // ---- DOWNLOAD ESTIMATE ----
  function downloadEstimate(estimateId) {
    const estimates = getEstimates();
    const est = estimates.find(e => e.id === estimateId);
    if (!est) return;

    const users = getUsers();
    const cust = users.find(u => u.id === est.customerId);
    const totals = calcEstimateTotal(est);

    // Build a printable HTML document
    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Estimate - ${esc(est.title)}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
  h1 { color: #263240; font-size: 24px; margin-bottom: 4px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #5baab7; padding-bottom: 20px; }
  .company { font-size: 14px; color: #666; }
  .company strong { color: #263240; font-size: 18px; display: block; margin-bottom: 4px; }
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
  .status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-approved { background: #d4edda; color: #155724; }
  .status-denied { background: #f8d7da; color: #721c24; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <div>
      <h1>${esc(est.title)}</h1>
      <span class="status status-${est.status}">${est.status.toUpperCase()}</span>
    </div>
    <div class="company">
      <strong>Elevation Jeeps</strong>
      17655 Katy Fwy<br>Houston, TX 77094<br>(832) 974-4133
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
  <div class="footer">Elevation Jeeps &mdash; Quality. Integrity. Transparency. &mdash; elevationjeeps.com</div>
</body></html>`;

    // Open in new window for print/save as PDF
    const printWin = window.open('', '_blank');
    printWin.document.write(printHtml);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
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
    } else {
      showSection('customer');
      els.customerName.textContent = session.name;
      renderCustomerEstimates(session.id);
    }
  } else {
    showSection('login');
  }

  // Force fade-ins visible
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
})();
