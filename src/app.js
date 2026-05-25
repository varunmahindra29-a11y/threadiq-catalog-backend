import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const demoProperties = [
  {
    id: crypto.randomUUID(),
    title: "Furnished 2BHK near Andheri West Metro",
    description: "Move-in ready apartment in a gated society with parking, lift, security, and quick metro access.",
    listing_type: "rent",
    property_type: "Apartment",
    locality: "Andheri West",
    city: "Mumbai",
    price: 48000,
    bhk: 2,
    area_sqft: 780,
    furnishing: "Furnished",
    availability: "Immediate",
    amenities: ["Parking", "Lift", "Security", "Metro nearby"],
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 34,
    visits: 9,
  },
  {
    id: crypto.randomUUID(),
    title: "Lake-view 3BHK in Powai",
    description: "Premium resale apartment with balcony, clubhouse access, and two covered parking slots.",
    listing_type: "sale",
    property_type: "Apartment",
    locality: "Powai",
    city: "Mumbai",
    price: 28500000,
    bhk: 3,
    area_sqft: 1280,
    furnishing: "Semi-furnished",
    availability: "Ready to move",
    amenities: ["Clubhouse", "Balcony", "Parking", "Lake view"],
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 28,
    visits: 6,
  },
  {
    id: crypto.randomUUID(),
    title: "Ready 2BHK in Sector 76 Noida",
    description: "Compact family apartment in a maintained society with park, power backup, and covered parking.",
    listing_type: "sale",
    property_type: "Apartment",
    locality: "Sector 76",
    city: "Noida",
    price: 8200000,
    bhk: 2,
    area_sqft: 1045,
    furnishing: "Unfurnished",
    availability: "Ready to move",
    amenities: ["Park", "Power backup", "Parking", "Security"],
    image_url: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 22,
    visits: 5,
  },
  {
    id: crypto.randomUUID(),
    title: "Modern 1BHK in Golf Course Extension",
    description: "Bright rental apartment ideal for professionals, with gym, lift, security, and fast office access.",
    listing_type: "rent",
    property_type: "Apartment",
    locality: "Golf Course Extension",
    city: "Gurugram",
    price: 32000,
    bhk: 1,
    area_sqft: 610,
    furnishing: "Semi-furnished",
    availability: "From next month",
    amenities: ["Gym", "Lift", "Security", "Power backup"],
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 26,
    visits: 7,
  },
  {
    id: crypto.randomUUID(),
    title: "4BHK villa near Whitefield",
    description: "Independent villa with private garden, servant room, two car parks, and quiet gated community access.",
    listing_type: "sale",
    property_type: "Villa",
    locality: "Whitefield",
    city: "Bengaluru",
    price: 36000000,
    bhk: 4,
    area_sqft: 2650,
    furnishing: "Semi-furnished",
    availability: "Ready to move",
    amenities: ["Private garden", "Gated community", "Parking", "Servant room"],
    image_url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 17,
    visits: 4,
  },
  {
    id: crypto.randomUUID(),
    title: "Compact studio in Bandra West",
    description: "Well-located studio for single occupancy with furnished setup and quick access to cafes and offices.",
    listing_type: "rent",
    property_type: "Studio",
    locality: "Bandra West",
    city: "Mumbai",
    price: 42000,
    bhk: 0,
    area_sqft: 410,
    furnishing: "Furnished",
    availability: "Immediate",
    amenities: ["Furnished", "Security", "Prime location"],
    image_url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 31,
    visits: 8,
  },
];

const leadSeries = {
  7: [8, 12, 11, 16, 19, 21, 28],
  14: [5, 7, 9, 8, 12, 14, 13, 15, 18, 17, 20, 22, 24, 28],
  30: [3, 4, 6, 7, 8, 9, 9, 11, 10, 13, 14, 14, 16, 17, 16, 19, 20, 21, 23, 22, 24, 25, 26, 24, 27, 29, 30, 31, 33, 35],
};

const demoLeads = [
  {
    id: "demo-lead-1",
    customer_whatsapp: "919876543210",
    customer_message: "2BHK furnished flat rent in Andheri under 50k, visit karna hai",
    matched_property_names: ["Furnished 2BHK near Andheri West Metro"],
    intent: "site_visit",
    status: "new",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-lead-2",
    customer_whatsapp: "918888777666",
    customer_message: "Noida mein 2BHK sale property budget 85 lakh",
    matched_property_names: ["Ready 2BHK in Sector 76 Noida"],
    intent: "callback",
    status: "follow_up",
    created_at: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
  },
  {
    id: "demo-lead-3",
    customer_whatsapp: "917777666555",
    customer_message: "Bandra studio rent available hai kya",
    matched_property_names: ["Compact studio in Bandra West"],
    intent: "shortlist",
    status: "new",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

const state = {
  properties: [],
  leads: [],
  leadMessages: [],
  selectedLeadId: "",
  inventoryPage: 1,
  inventoryPageSize: 8,
  needsVisitOnly: false,
  defaultShopId: "",
  config: {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,
  },
  activePanel: "dashboard",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadLocalState() {
  state.properties = demoProperties;
  state.leads = demoLeads.map(normalizeLead);
  state.selectedLeadId = state.leads[0]?.id || "";
}

function hasSupabaseConfig() {
  return Boolean(state.config.url && state.config.key);
}

function supabaseHeaders() {
  return {
    apikey: state.config.key,
    Authorization: `Bearer ${state.config.key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function fetchSupabaseProperties() {
  try {
    const localResponse = await fetch("/api/properties");
    if (localResponse.ok) {
      const result = await localResponse.json();
      state.defaultShopId = result.shop_id || state.defaultShopId;
      state.properties = Array.isArray(result.properties) ? result.properties.map(normalizeProperty) : [];
      return;
    }
    if (localResponse.status !== 404) throw new Error("Local properties API failed");
  } catch {
    // Fall back to browser-side Supabase for static deployments.
  }

  if (!hasSupabaseConfig()) {
    updateSyncButton("Supabase config missing");
    return;
  }
  const params = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
  });
  if (state.defaultShopId) params.set("shop_id", `eq.${state.defaultShopId}`);
  const endpoint = `${state.config.url.replace(/\/$/, "")}/rest/v1/properties?${params.toString()}`;
  const response = await fetch(endpoint, { headers: supabaseHeaders() });
  if (!response.ok) throw new Error("Supabase properties fetch failed");
  const rows = await response.json();
  if (Array.isArray(rows)) state.properties = rows.map(normalizeProperty);
}

async function fetchDefaultShopId() {
  if (!hasSupabaseConfig()) return "";
  const endpoint = `${state.config.url.replace(/\/$/, "")}/rest/v1/shops?select=id&slug=eq.estateiq-demo-realty&limit=1`;
  const response = await fetch(endpoint, { headers: supabaseHeaders() });
  if (!response.ok) return "";
  const rows = await response.json();
  state.defaultShopId = rows?.[0]?.id || "";
  return state.defaultShopId;
}

async function fetchLeads() {
  try {
    const response = await fetch("/api/leads");
    if (!response.ok) throw new Error("Leads API failed");
    const result = await response.json();
    state.leads = Array.isArray(result.leads) ? result.leads.map(normalizeLead) : [];
    state.leadMessages = Array.isArray(result.messages) ? result.messages.map(normalizeMessage) : [];
    state.selectedLeadId = state.leads[0]?.id || "";
  } catch {
    if (!state.leads.length) {
      state.leads = demoLeads.map(normalizeLead);
      state.selectedLeadId = state.leads[0]?.id || "";
    }
  }
}

async function insertSupabaseProperty(property) {
  try {
    const localResponse = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(property),
    });
    if (localResponse.ok) {
      const result = await localResponse.json();
      state.defaultShopId = result.shop_id || state.defaultShopId;
      return normalizeProperty(result.property || property);
    }
    if (localResponse.status !== 404) {
      const result = await localResponse.json().catch(() => ({}));
      throw new Error(result.error || "Local property publish failed");
    }
  } catch {
    throw new Error("Local property publish failed");
  }

  if (!hasSupabaseConfig()) throw new Error("Supabase config missing");
  if (!state.defaultShopId) await fetchDefaultShopId();
  if (!state.defaultShopId) throw new Error("Default broker missing");
  const endpoint = `${state.config.url.replace(/\/$/, "")}/rest/v1/properties`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ ...property, shop_id: state.defaultShopId }),
  });
  if (!response.ok) throw new Error("Supabase property insert failed");
  const rows = await response.json();
  return rows[0] ? normalizeProperty(rows[0]) : property;
}

async function updateSupabaseProperty(property) {
  const response = await fetch(`/api/properties?id=${encodeURIComponent(property.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(property),
  });
  if (!response.ok) throw new Error("Property update failed");
  const result = await response.json();
  return normalizeProperty(result.property || property);
}

async function deleteSupabaseProperty(propertyId) {
  const response = await fetch(`/api/properties?id=${encodeURIComponent(propertyId)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Property delete failed");
}

function normalizeProperty(property) {
  return {
    id: property.id || crypto.randomUUID(),
    title: property.title || property.name || "Untitled property",
    description: property.description || "",
    listing_type: property.listing_type || "rent",
    property_type: property.property_type || "Apartment",
    locality: property.locality || "",
    city: property.city || "",
    price: Number(property.price || 0),
    bhk: Number(property.bhk || 0),
    area_sqft: Number(property.area_sqft || 0),
    furnishing: property.furnishing || "",
    availability: property.availability || property.possession || "",
    amenities: Array.isArray(property.amenities) ? property.amenities : splitList(property.amenities),
    image_url: property.image_url || "",
    status: property.status || "active",
    inquiries: Number(property.inquiries || 0),
    visits: Number(property.visits || 0),
  };
}

function normalizeLead(lead) {
  return {
    id: lead.id || crypto.randomUUID(),
    customer_whatsapp: lead.customer_whatsapp || "",
    customer_message: lead.customer_message || "",
    matched_property_ids: Array.isArray(lead.matched_property_ids) ? lead.matched_property_ids : splitList(lead.matched_property_ids),
    matched_property_names: Array.isArray(lead.matched_property_names) ? lead.matched_property_names : splitList(lead.matched_property_names),
    intent: lead.intent || "site_visit",
    status: lead.status || "new",
    created_at: lead.created_at || new Date().toISOString(),
  };
}

function normalizeMessage(message) {
  return {
    id: message.id || crypto.randomUUID(),
    customer_whatsapp: message.customer_whatsapp || "",
    direction: message.direction || "inbound",
    body: message.body || "",
    created_at: message.created_at || new Date().toISOString(),
  };
}

function splitList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderAll() {
  updateSyncButton(hasSupabaseConfig() ? "Supabase connected" : "Supabase config missing");
  renderMetrics();
  renderProperties();
  renderLocalityBars();
  renderHealth();
  renderHotLeads();
  renderLeadInbox();
  drawChart();
}

function renderMetrics() {
  const active = state.properties.filter((property) => property.status === "active");
  const pipelineValue = active.reduce((sum, property) => {
    return sum + (property.listing_type === "rent" ? property.price * 12 : property.price);
  }, 0);
  const inquiries = active.reduce((sum, property) => sum + property.inquiries, 0);
  const visits = active.reduce((sum, property) => sum + property.visits, 0);
  const conversion = inquiries ? Math.round((visits / inquiries) * 100) : 0;
  const rentCount = active.filter((property) => property.listing_type === "rent").length;
  const saleCount = active.filter((property) => property.listing_type === "sale").length;

  $("#metricPipeline").textContent = formatCompactMoney(pipelineValue);
  $("#metricProperties").textContent = active.length;
  $("#metricConversion").textContent = `${conversion}%`;
  $("#metricVisits").textContent = visits;
  $("#rentSaleSplit").textContent = `${rentCount} rent / ${saleCount} sale`;
  $("#todayLeads").textContent = `${state.leads.length || leadSeries[7].at(-1)} leads`;
}

function renderProperties() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const type = $("#typeFilter").value;
  const properties = state.properties.filter((property) => {
    const haystack = [
      property.title,
      property.description,
      property.listing_type,
      property.property_type,
      property.locality,
      property.city,
      property.bhk,
      property.area_sqft,
      property.furnishing,
      property.availability,
      property.amenities.join(" "),
      property.price,
    ]
      .join(" ")
      .toLowerCase();
    const needsVisits = property.inquiries >= 10 && property.visits <= 2;
    return haystack.includes(query) && (type === "all" || property.listing_type === type) && (!state.needsVisitOnly || needsVisits);
  });
  const pageCount = Math.max(Math.ceil(properties.length / state.inventoryPageSize), 1);
  state.inventoryPage = Math.min(state.inventoryPage, pageCount);
  const start = (state.inventoryPage - 1) * state.inventoryPageSize;
  const visibleProperties = properties.slice(start, start + state.inventoryPageSize);

  $("#propertyGrid").innerHTML = visibleProperties.length
    ? visibleProperties.map(renderPropertyCard).join("")
    : `<div class="empty-state">No properties match this filter yet.</div>`;
  $("#listingCount").textContent = properties.length
    ? `Showing ${start + 1}-${Math.min(start + state.inventoryPageSize, properties.length)} of ${properties.length} properties`
    : "No properties found";
  renderPropertyPager(pageCount);
}

function renderPropertyCard(property) {
  const image = property.image_url || "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80";
  const tags = [
    property.listing_type === "rent" ? "Rent" : "Sale",
    bhkLabel(property),
    property.furnishing,
    property.availability,
  ].filter(Boolean);
  return `
    <article class="property-card catalog-card">
      <div class="property-media">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(property.title)}" loading="lazy" />
        <span class="listing-badge ${escapeHtml(property.listing_type)}">${escapeHtml(property.listing_type)}</span>
        <div class="property-actions">
          <button type="button" data-edit-property="${escapeHtml(property.id)}">Edit</button>
          <button type="button" data-delete-property="${escapeHtml(property.id)}">Delete</button>
        </div>
      </div>
      <div class="property-content">
        <div class="property-title">
          <strong>${escapeHtml(property.title)}</strong>
          <span class="price">${formatPrice(property)}</span>
        </div>
        <small>${escapeHtml(property.locality)}, ${escapeHtml(property.city)} - ${Number(property.area_sqft || 0).toLocaleString("en-IN")} sq ft - ${property.inquiries} inquiries</small>
        <div class="tag-list">
          ${tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderPropertyPager(pageCount) {
  const buttons = [];
  buttons.push(`<button type="button" data-page-step="-1" ${state.inventoryPage === 1 ? "disabled" : ""}>Prev</button>`);
  for (let page = 1; page <= pageCount; page += 1) {
    if (pageCount > 6 && page > 3 && page < pageCount) {
      if (page === 4) buttons.push(`<span>...</span>`);
      continue;
    }
    buttons.push(`<button class="${page === state.inventoryPage ? "active" : ""}" type="button" data-page="${page}">${page}</button>`);
  }
  buttons.push(`<button type="button" data-page-step="1" ${state.inventoryPage === pageCount ? "disabled" : ""}>Next</button>`);
  $("#propertyPager").innerHTML = buttons.join("");
}

function renderLocalityBars() {
  const totals = [...new Set(state.properties.map((property) => property.locality).filter(Boolean))]
    .map((locality) => ({
      locality,
      value: state.properties.filter((property) => property.locality === locality).reduce((sum, property) => sum + property.inquiries, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const max = Math.max(...totals.map((item) => item.value), 1);
  const total = Math.max(totals.reduce((sum, item) => sum + item.value, 0), 1);
  $("#categoryBars").innerHTML = totals
    .map(
      (item, index) => `
      <div class="bar-row">
        <header>
          <span>${index + 1}</span>
          <strong>${escapeHtml(item.locality)}</strong>
          <em>${item.value} (${Math.round((item.value / total) * 100)}%)</em>
        </header>
        <div class="bar-track"><div class="bar-fill" style="width: ${(item.value / max) * 100}%"></div></div>
      </div>
    `,
    )
    .join("");
}

function renderHealth() {
  const sorted = [...state.properties]
    .sort((a, b) => healthPriority(b) - healthPriority(a))
    .slice(0, 4);
  $("#healthList").innerHTML = `
    <div class="health-table" role="table" aria-label="Property health">
      <div class="health-row head" role="row">
        <span>Property</span>
        <span>Issue</span>
        <span>Priority</span>
        <span>Suggested Action</span>
        <span>Status</span>
        <span>Action</span>
      </div>
      ${sorted.map(renderHealthRow).join("")}
    </div>
  `;
}

function healthPriority(property) {
  if (!property.image_url) return 3;
  if (!property.availability) return 2;
  if (property.inquiries >= 10 && property.visits <= 2) return 2;
  return 1;
}

function renderHealthRow(property) {
  const missingImage = !property.image_url;
  const missingAvailability = !property.availability;
  const needsVisits = property.inquiries >= 10 && property.visits <= 2;
  const issue = missingImage ? "Missing property photo" : missingAvailability ? "Availability unclear" : needsVisits ? "High demand, low visits" : "Ready for AI matching";
  const priority = missingImage ? "High" : missingAvailability || needsVisits ? "Medium" : "Low";
  const status = missingImage || missingAvailability ? "Needs Attention" : needsVisits ? "In Progress" : "Pending";
  const action = missingImage
    ? "Add a clear listing photo"
    : missingAvailability
      ? "Confirm possession or move-in timing"
      : needsVisits
        ? "Push callback and site visit CTA"
        : "Keep active in WhatsApp matches";
  return `
    <div class="health-row" role="row">
      <span class="health-property">
        <img src="${escapeHtml(property.image_url || "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80")}" alt="${escapeHtml(property.title)}" />
        <span>
          <strong>${escapeHtml(property.title)}</strong>
          <small>${escapeHtml(property.locality)}, ${escapeHtml(property.city)}</small>
        </span>
      </span>
      <span>${escapeHtml(issue)}</span>
      <span><mark class="priority ${priority.toLowerCase()}">${escapeHtml(priority)}</mark></span>
      <span>${escapeHtml(action)}</span>
      <span><mark class="status-badge ${status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(status)}</mark></span>
      <span><button class="table-action" data-open-listing type="button">Fix</button></span>
    </div>
  `;
}

function renderHotLeads() {
  const leads = [...state.leads].sort((a, b) => leadIntentScore(b) - leadIntentScore(a)).slice(0, 3);
  $("#hotLeadList").innerHTML = leads.length
    ? leads
        .map((lead) => {
          const properties = leadProperties(lead).slice(0, 2);
          return `
            <button class="hot-lead-card" data-lead-id="${escapeHtml(lead.id)}" type="button">
              <span class="lead-avatar">${escapeHtml(customerInitial(lead.customer_whatsapp))}</span>
              <span>
                <strong>+${escapeHtml(maskPhone(lead.customer_whatsapp))}</strong>
                <small>${escapeHtml(lead.customer_message)}</small>
              </span>
              <em>${properties.length ? properties.map((property) => escapeHtml(property.locality)).join(", ") : escapeHtml(statusLabel(lead.intent))}</em>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">WhatsApp leads will appear here after customers ask for properties.</div>`;
}

function renderLeadInbox() {
  renderLeadMetrics();
  renderLeadList();
  renderLeadDetail();
}

function renderLeadMetrics() {
  const open = state.leads.filter((lead) => lead.status !== "closed").length;
  const hot = state.leads.filter((lead) => leadIntentScore(lead) >= 75).length;
  const today = state.leads.filter((lead) => isToday(lead.created_at)).length || state.leads.length;
  $("#leadOpenCount").textContent = open;
  $("#leadHotCount").textContent = hot;
  $("#leadTodayCount").textContent = today;
}

function renderLeadList() {
  const query = $("#leadSearchInput").value.trim().toLowerCase();
  const status = $("#leadStatusFilter").value;
  const leads = state.leads.filter((lead) => {
    const propertyText = leadProperties(lead)
      .map((property) => `${property.title} ${property.locality} ${property.city}`)
      .join(" ");
    const haystack = `${lead.customer_whatsapp} ${lead.customer_message} ${propertyText}`.toLowerCase();
    return haystack.includes(query) && (status === "all" || lead.status === status);
  });

  $("#leadList").innerHTML = leads.length
    ? leads.map(renderLeadItem).join("")
    : `<div class="empty-state">No leads match this filter.</div>`;
  if (!leads.some((lead) => lead.id === state.selectedLeadId)) {
    state.selectedLeadId = leads[0]?.id || "";
  }
}

function renderLeadItem(lead) {
  return `
    <button class="lead-item ${lead.id === state.selectedLeadId ? "active" : ""}" data-lead-id="${escapeHtml(lead.id)}" type="button">
      <span class="lead-avatar">${escapeHtml(customerInitial(lead.customer_whatsapp))}</span>
      <span class="lead-item-body">
        <span class="lead-line">
          <strong>+${escapeHtml(maskPhone(lead.customer_whatsapp))}</strong>
          <em>${formatTime(lead.created_at)}</em>
        </span>
        <small>${escapeHtml(lead.customer_message)}</small>
        <span class="lead-tags">
          <span>${leadIntentScore(lead)} intent</span>
          <span>${escapeHtml(statusLabel(lead.intent))}</span>
        </span>
      </span>
    </button>
  `;
}

function renderLeadDetail() {
  const lead = state.leads.find((item) => item.id === state.selectedLeadId);
  if (!lead) {
    $("#leadDetail").innerHTML = `<div class="empty-state">Select a lead to view requirement details.</div>`;
    return;
  }
  const properties = leadProperties(lead);
  const messages = leadMessages(lead);
  const whatsappUrl = `https://wa.me/${encodeURIComponent(lead.customer_whatsapp)}`;
  $("#leadDetail").innerHTML = `
    <div class="lead-detail-head">
      <div>
        <span class="muted-label">Customer</span>
        <h2>+${escapeHtml(maskPhone(lead.customer_whatsapp))}</h2>
        <p>${escapeHtml(lead.customer_message)}</p>
      </div>
      <a class="primary-button link-button" href="${whatsappUrl}" target="_blank" rel="noreferrer">Reply</a>
    </div>

    <div class="intent-meter" aria-label="Lead intent score">
      <span style="width: ${leadIntentScore(lead)}%"></span>
    </div>

    <div class="lead-insight-grid">
      <div>
        <span class="muted-label">Intent</span>
        <strong>${leadIntentScore(lead)} / 100</strong>
      </div>
      <div>
        <span class="muted-label">Next Step</span>
        <strong>${escapeHtml(statusLabel(lead.intent))}</strong>
      </div>
      <div>
        <span class="muted-label">Received</span>
        <strong>${formatTime(lead.created_at)}</strong>
      </div>
    </div>

    <section class="detail-block">
      <span class="muted-label">AI matched properties</span>
      <div class="lead-property-list">
        ${renderLeadProperties(properties, lead)}
      </div>
    </section>

    <section class="detail-block">
      <span class="muted-label">Visit / callback CTA</span>
      <p class="detail-copy">Ask for a preferred time, confirm budget and locality, then schedule the site visit with the broker.</p>
    </section>

    <section class="detail-block">
      <span class="muted-label">Conversation trail</span>
      <div class="lead-timeline">
        ${messages.length ? messages.map(renderLeadMessage).join("") : `<p>No message history logged yet.</p>`}
      </div>
    </section>
  `;
}

function renderLeadProperties(properties, lead) {
  if (!properties.length && lead.matched_property_names.length) {
    return lead.matched_property_names.map((name) => `<div class="lead-property-fallback">${escapeHtml(name)}</div>`).join("");
  }
  if (!properties.length) return `<div class="lead-property-fallback">No matched property stored yet.</div>`;
  return properties
    .map(
      (property) => `
        <article class="lead-property">
          <img src="${escapeHtml(property.image_url || "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80")}" alt="${escapeHtml(property.title)}" />
          <div>
            <strong>${escapeHtml(property.title)}</strong>
            <small>${escapeHtml(property.locality)}, ${escapeHtml(property.city)} - ${formatPrice(property)} - ${bhkLabel(property)}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderLeadMessage(message) {
  return `
    <div class="timeline-row ${message.direction}">
      <strong>${message.direction === "inbound" ? "Customer" : "AI"}</strong>
      <span>${escapeHtml(message.body)}</span>
    </div>
  `;
}

function drawChart() {
  const canvas = $("#leadsChart");
  const ctx = canvas.getContext("2d");
  const range = $("#rangeFilter").value;
  const data = leadSeries[range];
  const width = canvas.width;
  const height = canvas.height;
  const padding = 36;
  const max = Math.max(...data) + 8;

  ctx.clearRect(0, 0, width, height);

  // Soft grid lines
  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const points = data.map((value, index) => {
    const x = padding + ((width - padding * 2) / (data.length - 1)) * index;
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value };
  });

  // Beautiful royal blue vertical gradient fill
  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, "rgba(37, 99, 235, 0.16)");
  gradient.addColorStop(1, "rgba(37, 99, 235, 0.00)");

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(points.at(-1).x, height - padding);
  ctx.lineTo(points[0].x, height - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Smooth line curve outline
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Draw node points
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3.5;
    ctx.stroke();
  });
}

function switchPanel(panel) {
  state.activePanel = panel;
  $$(".panel").forEach((element) => element.classList.remove("active"));
  $(`#${panel}Panel`).classList.add("active");
  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panel);
  });
  if (panel === "dashboard") drawChart();
  if (panel === "leads") renderLeadInbox();
}

function formatPrice(property) {
  const price = currency.format(property.price);
  return property.listing_type === "rent" ? `${price}/mo` : price;
}

function formatCompactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function bhkLabel(property) {
  return Number(property.bhk || 0) > 0 ? `${property.bhk}BHK` : property.property_type || "Studio";
}

function leadProperties(lead) {
  const ids = new Set(lead.matched_property_ids);
  const names = new Set(lead.matched_property_names.map((name) => name.toLowerCase()));
  return state.properties.filter((property) => ids.has(property.id) || names.has(property.title.toLowerCase()));
}

function leadMessages(lead) {
  return state.leadMessages
    .filter((message) => message.customer_whatsapp === lead.customer_whatsapp)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function leadIntentScore(lead) {
  const text = `${lead.customer_message} ${lead.intent} ${lead.status}`.toLowerCase();
  let score = 42;
  if (/(visit|site visit|call|callback|book|shortlist|chahiye|available|confirm|price|budget|rent|sale|buy)/i.test(text)) score += 30;
  if (leadProperties(lead).length || lead.matched_property_names.length) score += 18;
  if (lead.status === "new") score += 8;
  if (lead.status === "closed") score -= 30;
  return Math.max(0, Math.min(score, 100));
}

function customerInitial(phone) {
  return String(phone || "C").replace(/\D/g, "").slice(-1) || "C";
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length <= 4) return digits || "customer";
  return `${digits.slice(0, 2)}....${digits.slice(-4)}`;
}

function statusLabel(status) {
  return String(status || "new")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function uploadPropertyImage(file) {
  if (!file || !file.size) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Unsupported image type");
  }
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/property-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      dataUrl,
    }),
  });
  if (!response.ok) throw new Error("Image upload failed");
  const result = await response.json();
  return result.image_url || "";
}

function resetImagePreview() {
  const preview = $("#imagePreview");
  const image = $("#imagePreviewImg");
  if (image.dataset.previewUrl) URL.revokeObjectURL(image.dataset.previewUrl);
  image.removeAttribute("src");
  image.dataset.previewUrl = "";
  $("#imagePreviewName").textContent = "";
  preview.hidden = true;
}

function updateImagePreview(file) {
  resetImagePreview();
  if (!file || !file.size) return;
  const previewUrl = URL.createObjectURL(file);
  const image = $("#imagePreviewImg");
  image.src = previewUrl;
  image.dataset.previewUrl = previewUrl;
  $("#imagePreviewName").textContent = file.name;
  $("#imagePreview").hidden = false;
}

function openPropertyDialog(property = null) {
  const form = $("#propertyForm");
  const isEdit = Boolean(property);
  form.reset();
  resetImagePreview();
  form.elements.id.value = property?.id || "";
  form.elements.existing_image_url.value = property?.image_url || "";
  form.elements.title.value = property?.title || "";
  form.elements.description.value = property?.description || "";
  form.elements.listing_type.value = property?.listing_type || "rent";
  form.elements.property_type.value = property?.property_type || "";
  form.elements.locality.value = property?.locality || "";
  form.elements.city.value = property?.city || "";
  form.elements.price.value = property?.price || "";
  form.elements.bhk.value = property?.bhk ?? "";
  form.elements.area_sqft.value = property?.area_sqft || "";
  form.elements.furnishing.value = property?.furnishing || "";
  form.elements.availability.value = property?.availability || "";
  form.elements.amenities.value = property?.amenities?.join(", ") || "";
  $("#propertyDialogTitle").textContent = isEdit ? "Edit property" : "Add property";
  $("#savePropertyButton").textContent = isEdit ? "Save changes" : "Publish property";
  $("#deletePropertyButton").hidden = !isEdit;
  $("#pausePropertyButton").hidden = !isEdit;
  $("#pausePropertyButton").textContent = property?.status === "paused" ? "Resume" : "Pause";
  $("#propertyDialog").showModal();
}

function closePropertyDialog() {
  const propertyDialog = $("#propertyDialog");
  $("#propertyForm").reset();
  resetImagePreview();
  $("#deletePropertyButton").hidden = true;
  $("#pausePropertyButton").hidden = true;
  if (propertyDialog.open) propertyDialog.close();
}

async function handlePropertySubmit(event) {
  if (event.submitter?.value === "cancel") {
    resetImagePreview();
    return;
  }
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const imageFile = formData.get("image_file");
  const propertyId = formData.get("id");
  const existingImageUrl = formData.get("existing_image_url");
  const existingProperty = state.properties.find((property) => property.id === propertyId);
  let imageUrl = "";

  try {
    imageUrl = await uploadPropertyImage(imageFile);
  } catch {
    alert("Property image upload nahi ho paayi. JPG, PNG ya WebP file select karo.");
    return;
  }

  const property = normalizeProperty({
    id: crypto.randomUUID(),
    title: formData.get("title"),
    description: formData.get("description"),
    listing_type: formData.get("listing_type"),
    property_type: formData.get("property_type"),
    locality: formData.get("locality"),
    city: formData.get("city"),
    price: formData.get("price"),
    bhk: formData.get("bhk"),
    area_sqft: formData.get("area_sqft"),
    furnishing: formData.get("furnishing"),
    availability: formData.get("availability"),
    amenities: splitList(formData.get("amenities")),
    image_url: imageUrl || existingImageUrl,
    status: existingProperty?.status || "active",
    inquiries: existingProperty?.inquiries ?? Math.floor(Math.random() * 12) + 3,
    visits: existingProperty?.visits ?? Math.floor(Math.random() * 4),
  });

  try {
    if (propertyId) {
      const updated = await updateSupabaseProperty({ ...property, id: propertyId });
      state.properties = state.properties.map((item) => (item.id === propertyId ? updated : item));
    } else {
      const inserted = await insertSupabaseProperty(property);
      state.properties.unshift(inserted);
    }
    await fetchSupabaseProperties();
  } catch {
    alert("Property save nahi hua. Supabase ya API issue check karo.");
    return;
  }

  closePropertyDialog();
  renderAll();
  switchPanel("inventory");
}

async function handleDeleteProperty(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId);
  if (!property) return;
  const confirmed = confirm(`Delete ${property.title}? Ye property WhatsApp AI recommendations se bhi hat jayegi.`);
  if (!confirmed) return;
  try {
    await deleteSupabaseProperty(propertyId);
    state.properties = state.properties.filter((item) => item.id !== propertyId);
    closePropertyDialog();
    renderAll();
  } catch {
    alert("Property delete nahi hui. API ya Supabase issue check karo.");
  }
}

async function handlePauseProperty(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId);
  if (!property) return;
  const nextStatus = property.status === "paused" ? "active" : "paused";
  try {
    const updated = await updateSupabaseProperty({ ...property, status: nextStatus });
    state.properties = state.properties.map((item) => (item.id === propertyId ? updated : item));
    closePropertyDialog();
    renderAll();
  } catch {
    alert("Property status update nahi hua.");
  }
}

function updateSyncButton(message) {
  const syncButton = $("#syncButton");
  syncButton.title = message;
  syncButton.setAttribute("aria-label", message);
  syncButton.classList.toggle("connected", hasSupabaseConfig());
}

function parseMoneyValue(rawNumber, suffix = "") {
  const value = Number(String(rawNumber || "").replace(/,/g, ""));
  if (!Number.isFinite(value)) return 0;
  const normalizedSuffix = suffix.toLowerCase();
  if (normalizedSuffix === "k") return value * 1000;
  if (["l", "lac", "lakh", "lakhs"].includes(normalizedSuffix)) return value * 100000;
  if (["cr", "crore", "crores"].includes(normalizedSuffix)) return value * 10000000;
  return value;
}

function extractBudget(query) {
  const match = query.match(/(?:under|below|less than|budget|upto|up to|rs\.?|inr|rent|price|sale)\s*(\d+(?:\.\d+)?)\s*(k|l|lac|lakh|lakhs|cr|crore|crores)?\b/i);
  if (match) return parseMoneyValue(match[1], match[2]);
  const suffixed = query.match(/\b(\d+(?:\.\d+)?)\s*(k|l|lac|lakh|lakhs|cr|crore|crores)\b/i);
  return suffixed ? parseMoneyValue(suffixed[1], suffixed[2]) : 0;
}

function extractListingType(query) {
  if (/\b(rent|rental|lease|kiraya|tenant)\b/i.test(query)) return "rent";
  if (/\b(sale|buy|purchase|kharid|resale)\b/i.test(query)) return "sale";
  return "";
}

function extractBhk(query) {
  const match = query.match(/\b([1-9])\s*(?:bhk|bed|bedroom|br)\b/i);
  return match ? Number(match[1]) : 0;
}

function findMatches(query) {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !["flat", "property", "rent", "sale", "buy", "under", "budget", "bhk"].includes(term));
  const budget = extractBudget(query);
  const listingType = extractListingType(query);
  const bhk = extractBhk(query);

  return state.properties
    .filter((property) => !listingType || property.listing_type === listingType)
    .map((property) => {
      const text = [
        property.title,
        property.description,
        property.listing_type,
        property.property_type,
        property.locality,
        property.city,
        property.furnishing,
        property.availability,
        property.amenities.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const keywordScore = terms.reduce((score, term) => score + (text.includes(term) ? 12 : 0), 0);
      const budgetScore = budget && property.price <= budget ? 24 : 0;
      const bhkScore = bhk && property.bhk === bhk ? 22 : 0;
      const typeScore = listingType ? 18 : 0;
      const demandScore = Math.min(property.inquiries, 20);
      return { property, score: keywordScore + budgetScore + bhkScore + typeScore + demandScore };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function renderChat(query, matches) {
  $("#chatWindow").innerHTML = `
    <div class="message ai">Hi, customer ki requirement bhejo. Main locality, budget, rent/sale, BHK aur availability ke basis pe best properties nikal dunga.</div>
    <div class="message user">${escapeHtml(query)}</div>
    <div class="message ai">Top ${matches.length} property options mil gaye. Best match ke saath callback/site visit CTA ready hai.</div>
  `;
}

function renderMatches(matches) {
  $("#matchResults").innerHTML = matches.length
    ? matches
        .map(
          ({ property, score }) => `
      <article class="match-card">
        <img src="${escapeHtml(property.image_url || "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80")}" alt="${escapeHtml(property.title)}" />
        <div>
          <strong>${escapeHtml(property.title)}</strong>
          <small>${escapeHtml(property.locality)}, ${escapeHtml(property.city)} - ${formatPrice(property)} - ${bhkLabel(property)} - ${Number(property.area_sqft || 0).toLocaleString("en-IN")} sq ft</small>
          <p class="match-score">${Math.max(score, 0)} match score</p>
        </div>
      </article>
    `,
        )
        .join("")
    : `<div class="empty-state">No matching property found. Try adding locality, budget, BHK, and rent/sale intent.</div>`;
}

function handleMatchSubmit(event) {
  event.preventDefault();
  const query = $("#matchQuery").value.trim() || "2BHK furnished flat rent in Andheri under 50k";
  const matches = findMatches(query);
  renderChat(query, matches);
  renderMatches(matches);
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.panel));
  });
  $$("[data-panel-shortcut]").forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.panelShortcut));
  });
  $$("[data-open-listing]").forEach((button) => {
    button.addEventListener("click", () => openPropertyDialog());
  });
  $("#healthList").addEventListener("click", (event) => {
    if (event.target.closest("[data-open-listing]")) openPropertyDialog();
  });
  $("#propertyForm").addEventListener("submit", handlePropertySubmit);
  $("#propertyDialog").addEventListener("close", () => {
    if (!$("#propertyDialog").returnValue) return;
    resetImagePreview();
  });
  $("#propertyImageInput").addEventListener("change", (event) => {
    updateImagePreview(event.currentTarget.files?.[0]);
  });
  $("#searchInput").addEventListener("input", () => {
    state.inventoryPage = 1;
    renderProperties();
  });
  $("#typeFilter").addEventListener("change", () => {
    state.inventoryPage = 1;
    renderProperties();
  });
  $("#visitFilterButton").addEventListener("click", () => {
    state.needsVisitOnly = !state.needsVisitOnly;
    state.inventoryPage = 1;
    $("#visitFilterButton").classList.toggle("active", state.needsVisitOnly);
    renderProperties();
  });
  $("#pageSizeSelect").addEventListener("change", (event) => {
    state.inventoryPageSize = Number(event.currentTarget.value);
    state.inventoryPage = 1;
    renderProperties();
  });
  $("#propertyPager").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const page = button.dataset.page ? Number(button.dataset.page) : state.inventoryPage + Number(button.dataset.pageStep || 0);
    if (!Number.isFinite(page)) return;
    state.inventoryPage = Math.max(1, page);
    renderProperties();
  });
  $("#propertyGrid").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-property]");
    if (editButton) {
      const property = state.properties.find((item) => item.id === editButton.dataset.editProperty);
      if (property) openPropertyDialog(property);
      return;
    }
    const deleteButton = event.target.closest("[data-delete-property]");
    if (deleteButton) handleDeleteProperty(deleteButton.dataset.deleteProperty);
  });
  $("#deletePropertyButton").addEventListener("click", () => {
    const propertyId = $("#propertyForm").elements.id.value;
    if (propertyId) handleDeleteProperty(propertyId);
  });
  $("#pausePropertyButton").addEventListener("click", () => {
    const propertyId = $("#propertyForm").elements.id.value;
    if (propertyId) handlePauseProperty(propertyId);
  });
  $("#leadSearchInput").addEventListener("input", renderLeadInbox);
  $("#leadStatusFilter").addEventListener("change", renderLeadInbox);
  $("#leadList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lead-id]");
    if (!button) return;
    state.selectedLeadId = button.dataset.leadId;
    renderLeadInbox();
  });
  $("#hotLeadList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lead-id]");
    if (!button) return;
    state.selectedLeadId = button.dataset.leadId;
    switchPanel("leads");
  });
  $("#rangeFilter").addEventListener("change", drawChart);
  $("#matchForm").addEventListener("submit", handleMatchSubmit);
  $("#syncButton").addEventListener("click", async () => {
    try {
      await fetchSupabaseProperties();
      await fetchLeads();
      updateSyncButton("Synced with Supabase");
      renderAll();
    } catch {
      updateSyncButton("Sync failed");
    }
  });
  window.addEventListener("resize", drawChart);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init() {
  loadLocalState();
  bindEvents();
  fetchDefaultShopId()
    .then(fetchSupabaseProperties)
    .then(fetchLeads)
    .catch(() => updateSyncButton("Supabase sync failed"))
    .finally(() => {
      renderAll();
      const defaultQuery = "2BHK furnished flat rent in Andheri under 50k";
      renderChat(defaultQuery, findMatches(defaultQuery));
      renderMatches(findMatches(defaultQuery));
    });
}

init();
