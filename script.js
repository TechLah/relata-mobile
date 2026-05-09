const screens = [...document.querySelectorAll(".screen")];
const steps = [...document.querySelectorAll(".step")];
const nextButtons = [...document.querySelectorAll("[data-next]")];
const pauseButton = document.querySelector("#pauseResearch");
const researchOrbit = document.querySelector(".research-orbit");
const STORAGE_KEY = "relata.contacts";
const DEMO_NOTE =
  "Met Daniel Lee at the Singapore fintech dinner. He leads partnerships at Meridian Pay. Mentioned he knows Clara from NUS and is exploring bank distribution partners.";

const appState = {
  savedContacts: [],
  demoPrepared: false,
  contact: {
    id: `contact-${Date.now()}`,
    confirmed: false,
    lens: "Business development",
    rawNote: DEMO_NOTE,
    sources: [
      {
        id: "src-card",
        type: "Name card",
        label: "daniel-card.jpg",
        icon: "card-icon",
      },
      {
        id: "src-web",
        type: "Website",
        label: "meridianpay.co",
        icon: "link-icon",
      },
    ],
    facts: [],
    findings: [],
    relationships: [],
  },
};

const elements = {
  phoneFrame: document.querySelector(".phone-frame"),
  memoryNote: document.querySelector("#memoryNote"),
  homeButton: document.querySelector("#homeButton"),
  demoModeButton: document.querySelector("#demoModeButton"),
  demoStatus: document.querySelector("#demoStatus"),
  toast: document.querySelector("#toast"),
  savedCount: document.querySelector("#savedCount"),
  savedList: document.querySelector("#savedList"),
  seedContactsButton: document.querySelector("#seedContactsButton"),
  newContactButton: document.querySelector("#newContactButton"),
  saveContactButton: document.querySelector("#saveContactButton"),
  lensButtons: [...document.querySelectorAll("[data-lens]")],
  sourceInput: document.querySelector("#sourceInput"),
  sourceStrip: document.querySelector("#sourceStrip"),
  addSourceButton: document.querySelector("#addSourceButton"),
  sampleSourceButton: document.querySelector("#sampleSourceButton"),
  reviewAvatar: document.querySelector("#reviewAvatar"),
  reviewName: document.querySelector("#reviewName"),
  reviewSubtitle: document.querySelector("#reviewSubtitle"),
  factList: document.querySelector("#factList"),
  confidenceText: document.querySelector("#confidenceText"),
  confirmContactButton: document.querySelector("#confirmContactButton"),
  researchTitle: document.querySelector("#researchTitle"),
  researchFeed: document.querySelector("#researchFeed"),
  findingCount: document.querySelector("#findingCount"),
  suggestionList: document.querySelector("#suggestionList"),
  mapMainNode: document.querySelector("#mapMainNode"),
  mapTopNode: document.querySelector("#mapTopNode"),
  mapRightNode: document.querySelector("#mapRightNode"),
  mapBottomNode: document.querySelector("#mapBottomNode"),
  linkGroups: document.querySelector("#linkGroups"),
  profileTitle: document.querySelector("#profileTitle"),
  profileAvatar: document.querySelector("#profileAvatar"),
  profileRole: document.querySelector("#profileRole"),
  profileCompany: document.querySelector("#profileCompany"),
  memoryLayers: document.querySelector("#memoryLayers"),
  relationshipLens: document.querySelector("#relationshipLens"),
  nextAction: document.querySelector("#nextAction"),
};

const aiMemoryService = {
  extractContact({ note, sources, lens }) {
    const source = "Voice";
    const metNameMatch = note.match(/\b(?:met|meet|introduced to)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?/i);
    const companyMatch = note.match(/(?:at|from|with)\s+([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)?)/);
    const eventMatch = note.match(/at the ([^.]+?(?:dinner|event|conference|meetup|summit))/i);
    const roleMatch = note.match(/(?:leads|is|works as)\s+([^/.]+?)(?:\s+at|\.)/i);
    const needMatch = note.match(/(?:exploring|looking for|needs|wants)\s+([^/.]+)/i);
    const cardHint = sources.find((item) => item.label.toLowerCase().includes("daniel"));

    const firstName = metNameMatch?.[1];
    const lastName = metNameMatch?.[2] || (firstName === "Daniel" || cardHint ? "Lee" : "");
    const name = firstName ? `${firstName} ${lastName}`.trim() : "New Contact";
    const company = companyMatch ? companyMatch[1] : "Unknown company";
    const role =
      roleMatch && roleMatch[1].toLowerCase().includes("partnership")
        ? "Partnerships Lead"
        : roleMatch
          ? roleMatch[1]
          : "Relationship contact";
    const context = eventMatch ? eventMatch[1] : "Introduced by user memory";
    const need = needMatch ? needMatch[1] : lensDefaults[lens].need;

    return {
      facts: [
        {
          id: "fact-name",
          label: "Name",
          value: name,
          source: sources.some((item) => item.type === "Name card") ? "Card" : source,
          confidence: "strong",
        },
        {
          id: "fact-role",
          label: "Role",
          value: titleCase(role),
          source,
          confidence: "strong",
        },
        {
          id: "fact-company",
          label: "Company",
          value: company,
          source: sources.some((item) => item.type === "Website") ? "Website" : source,
          confidence: "strong",
        },
        {
          id: "fact-context",
          label: "Context",
          value: titleCase(context),
          source,
          confidence: "normal",
        },
        {
          id: "fact-need",
          label: "Need",
          value: titleCase(need),
          source,
          confidence: "normal",
        },
      ],
    };
  },

  enrichContact({ lens }) {
    const name = getFact("Name") || "this contact";
    const company = getFact("Company") || "their company";
    const role = getFact("Role") || "their role";
    const preset = lensDefaults[lens];

    return [
      {
        id: "finding-role",
        category: preset.findingCategory,
        text: preset.findingText(name, company, role),
        source: `${company} team page`,
        accepted: true,
      },
      {
        id: "finding-profile",
        category: "Public profile",
        text: `Likely public profile match for ${name}.`,
        source: "Search result",
        accepted: false,
      },
      {
        id: "finding-company",
        category: preset.companyCategory,
        text: preset.companyText(company),
        source: "Company website",
        accepted: false,
      },
    ];
  },

  suggestRelationships({ note, lens }) {
    const name = getFact("Name") || "This contact";
    const mentionedName = note.match(/knows\s+([A-Z][a-z]+)/)?.[1] || "Clara";
    const company = getFact("Company") || "Company";
    const preset = lensDefaults[lens];
    const savedMatches = appState.savedContacts
      .filter((contact) => contact.name !== name)
      .filter((contact) => {
        const haystack = `${contact.name} ${contact.company} ${contact.context} ${contact.rawNote}`.toLowerCase();
        return (
          haystack.includes(mentionedName.toLowerCase()) ||
          haystack.includes(company.toLowerCase()) ||
          note.toLowerCase().includes(contact.name.split(" ")[0].toLowerCase())
        );
      })
      .slice(0, 2)
      .map((contact) => ({
        id: `rel-saved-${contact.id}`,
        group: "strong",
        name: contact.name,
        reason: `${contact.name} is already saved and overlaps through ${contact.company || "shared context"}.`,
        status: "pending",
        strength: "high",
      }));

    const relationshipSuggestions = [
      {
        id: "rel-direct",
        group: "strong",
        name: `${mentionedName} Tan`,
        reason: `${name} mentioned ${mentionedName} directly in the voice note.`,
        status: "pending",
        strength: "high",
      },
      {
        id: "rel-school",
        group: "possible",
        name: preset.clusterName,
        reason: preset.clusterReason(company),
        status: "later",
        strength: "medium",
      },
      {
        id: "rel-followup",
        group: "possible",
        name: preset.followupGroup,
        reason: preset.followupReason(company),
        status: "later",
        strength: "low",
      },
    ];

    const savedNames = new Set(savedMatches.map((match) => match.name));
    return [
      ...savedMatches,
      ...relationshipSuggestions.filter((item) => !savedNames.has(item.name)),
    ];
  },
};

const lensDefaults = {
  "Business development": {
    need: "identify partnership opportunities",
    findingCategory: "Commercial angle",
    companyCategory: "Company category",
    clusterName: "Banking partners group",
    followupGroup: "Distribution contacts",
    findingText: (name, company, role) =>
      `${name} may influence ${role.toLowerCase()} and partner channels at ${company}.`,
    companyText: (company) =>
      `${company} appears relevant to B2B payments, banking channels, or distribution partnerships.`,
    clusterReason: (company) =>
      `Related to existing bank distribution contacts around ${company}.`,
    followupReason: () => "Possible warm intro route for commercial follow-up.",
    nextAction: (need) => `Follow up about ${need.toLowerCase()} and possible partner introductions.`,
  },
  "Investor / Founder": {
    need: "understand funding, startup, and market relevance",
    findingCategory: "Startup signal",
    companyCategory: "Market category",
    clusterName: "Founder and investor cluster",
    followupGroup: "Warm intro path",
    findingText: (name, company) =>
      `${name} may be useful for understanding ${company}'s market, traction, or partnership strategy.`,
    companyText: (company) =>
      `${company} should be reviewed for market size, funding stage, and founder/investor relevance.`,
    clusterReason: () => "Possible overlap with founders, operators, or investors already in the network.",
    followupReason: () => "Could become a warm intro for diligence, fundraising, or founder learning.",
    nextAction: (need) => `Ask about ${need.toLowerCase()} and whether there is a founder/investor angle.`,
  },
  Recruiting: {
    need: "understand skills, team fit, and hiring relevance",
    findingCategory: "Talent signal",
    companyCategory: "Career context",
    clusterName: "Talent network",
    followupGroup: "Hiring manager contacts",
    findingText: (name, company, role) =>
      `${name}'s ${role.toLowerCase()} experience at ${company} may indicate hiring or candidate relevance.`,
    companyText: (company) =>
      `${company} provides career context for seniority, domain experience, and hiring fit.`,
    clusterReason: () => "Possible overlap with candidates, hiring managers, or alumni in the network.",
    followupReason: () => "May connect to roles, referrals, or talent mapping.",
    nextAction: (need) => `Clarify ${need.toLowerCase()} and whether there is a hiring or referral fit.`,
  },
  "Personal network": {
    need: "remember the relationship context and next personal touchpoint",
    findingCategory: "Personal memory",
    companyCategory: "Background context",
    clusterName: "Shared context",
    followupGroup: "Personal reminders",
    findingText: (name) =>
      `${name}'s profile should preserve how you met and what felt personally memorable.`,
    companyText: (company) =>
      `${company} is useful background, but the relationship memory should stay human-first.`,
    clusterReason: () => "Possible overlap through shared school, event, or friend context.",
    followupReason: () => "Useful for remembering a thoughtful follow-up later.",
    nextAction: () => "Send a short personal follow-up while the meeting context is still fresh.",
  },
};

function getFact(label) {
  return appState.contact.facts.find((fact) => fact.label === label)?.value || "";
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadSavedContacts() {
  try {
    appState.savedContacts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    appState.savedContacts = [];
  }
}

function persistSavedContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.savedContacts));
}

function createBlankContact() {
  return {
    id: `contact-${Date.now()}`,
    confirmed: false,
    lens: appState.contact.lens || "Business development",
    rawNote: "",
    sources: [],
    facts: [],
    findings: [],
    relationships: [],
  };
}

function resetContact() {
  appState.contact = createBlankContact();
  elements.memoryNote.value = "";
  elements.sourceInput.value = "";
  renderAll();
}

function prepareDemoContact() {
  appState.contact = {
    id: `contact-demo-${Date.now()}`,
    confirmed: false,
    lens: "Business development",
    rawNote: DEMO_NOTE,
    sources: [
      {
        id: "src-card",
        type: "Name card",
        label: "daniel-card.jpg",
        icon: "card-icon",
      },
      {
        id: "src-web",
        type: "Website",
        label: "meridianpay.co",
        icon: "link-icon",
      },
    ],
    facts: [],
    findings: [],
    relationships: [],
  };
  elements.memoryNote.value = DEMO_NOTE;
  elements.sourceInput.value = "";
  inferContactFromNote();
}

function prepareDemo() {
  seedSampleContacts();
  prepareDemoContact();
  appState.demoPrepared = true;
  renderDemoStatus("Demo ready: sample network loaded");
  showToast("Demo setup complete");
}

function createSavedSnapshot() {
  const name = getFact("Name") || "New Contact";
  const role = getFact("Role") || "Relationship contact";
  const company = getFact("Company") || "Unknown company";
  const context = getFact("Context") || appState.contact.rawNote;
  const need = getFact("Need") || "Follow up when relevant";

  return {
    id: appState.contact.id,
    name,
    role,
    company,
    context,
    need,
    lens: appState.contact.lens,
    rawNote: appState.contact.rawNote,
    sources: appState.contact.sources,
    facts: appState.contact.facts,
    findings: appState.contact.findings,
    relationships: appState.contact.relationships,
    savedAt: new Date().toISOString(),
  };
}

function saveCurrentContact() {
  const snapshot = createSavedSnapshot();
  const existingIndex = appState.savedContacts.findIndex((item) => item.id === snapshot.id);

  if (existingIndex >= 0) {
    appState.savedContacts[existingIndex] = snapshot;
  } else {
    appState.savedContacts.unshift(snapshot);
  }

  persistSavedContacts();
  renderSavedContacts();
}

function seedSampleContacts() {
  const samples = [
    {
      id: "sample-clara",
      name: "Clara Tan",
      role: "Corporate Innovation Lead",
      company: "HSBC",
      context: "Met through NUS fintech alumni event",
      need: "Can advise on bank pilots and innovation teams",
      lens: "Business development",
      rawNote: "Clara knows bank innovation teams and NUS alumni.",
      sources: [],
      facts: [],
      findings: [],
      relationships: [],
      savedAt: new Date().toISOString(),
    },
    {
      id: "sample-marcus",
      name: "Marcus Lim",
      role: "Founder",
      company: "VaultGrid",
      context: "Introduced at a startup investor breakfast",
      need: "Potential founder or investor reference",
      lens: "Investor / Founder",
      rawNote: "Marcus is a founder in payments infrastructure.",
      sources: [],
      facts: [],
      findings: [],
      relationships: [],
      savedAt: new Date().toISOString(),
    },
  ];

  samples.forEach((sample) => {
    if (!appState.savedContacts.some((contact) => contact.id === sample.id)) {
      appState.savedContacts.push(sample);
    }
  });

  persistSavedContacts();
  buildMockRelationships();
  renderAll();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 1800);
}

function renderDemoStatus(message) {
  elements.demoStatus.querySelector("p").textContent =
    message || `${appState.savedContacts.length} saved people available`;
  elements.demoStatus.classList.toggle("active", appState.demoPrepared);
}

function loadContactSnapshot(id) {
  const snapshot = appState.savedContacts.find((contact) => contact.id === id);
  if (!snapshot) return;

  appState.contact = {
    id: snapshot.id,
    confirmed: true,
    lens: snapshot.lens || "Business development",
    rawNote: snapshot.rawNote || "",
    sources: snapshot.sources || [],
    facts: snapshot.facts?.length
      ? snapshot.facts
      : [
          {
            id: "fact-name",
            label: "Name",
            value: snapshot.name,
            source: "Saved",
            confidence: "strong",
          },
          {
            id: "fact-role",
            label: "Role",
            value: snapshot.role,
            source: "Saved",
            confidence: "strong",
          },
          {
            id: "fact-company",
            label: "Company",
            value: snapshot.company,
            source: "Saved",
            confidence: "strong",
          },
          {
            id: "fact-context",
            label: "Context",
            value: snapshot.context,
            source: "Saved",
            confidence: "normal",
          },
          {
            id: "fact-need",
            label: "Need",
            value: snapshot.need,
            source: "Saved",
            confidence: "normal",
          },
        ],
    findings: snapshot.findings || [],
    relationships: snapshot.relationships || [],
  };

  elements.memoryNote.value = appState.contact.rawNote;
  renderAll();
  showScreen("profile");
}

function inferContactFromNote() {
  const extraction = aiMemoryService.extractContact({
    note: appState.contact.rawNote,
    sources: appState.contact.sources,
    lens: appState.contact.lens,
  });

  appState.contact.facts = extraction.facts;
  buildMockResearch();
  buildMockRelationships();
  renderAll();
}

function titleCase(text) {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildMockResearch() {
  appState.contact.findings = aiMemoryService.enrichContact({
    lens: appState.contact.lens,
  });
}

function buildMockRelationships() {
  appState.contact.relationships = aiMemoryService.suggestRelationships({
    note: appState.contact.rawNote,
    lens: appState.contact.lens,
  });
}

function renderSources() {
  elements.sourceStrip.innerHTML = appState.contact.sources
    .map(
      (source) => `
        <article>
          <span class="source-icon ${source.icon}"></span>
          <div>
            <strong>${escapeHtml(source.type)}</strong>
            <p>${escapeHtml(source.label)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSavedContacts() {
  elements.savedCount.textContent = `${appState.savedContacts.length} saved`;
  renderDemoStatus();

  if (!appState.savedContacts.length) {
    elements.savedList.innerHTML =
      '<div class="empty-list">No saved contacts yet. Save this first memory, or add sample contacts to see network matching.</div>';
    return;
  }

  elements.savedList.innerHTML = appState.savedContacts
    .map(
      (contact) => `
        <article>
          <div class="avatar">${escapeHtml(getInitials(contact.name) || "NC")}</div>
          <div>
            <h3>${escapeHtml(contact.name)}</h3>
            <p>${escapeHtml(contact.role)} at ${escapeHtml(contact.company)}. ${escapeHtml(contact.context)}</p>
          </div>
          <button type="button" data-load-contact="${escapeHtml(contact.id)}">View</button>
        </article>
      `,
    )
    .join("");
}

function renderLensControls() {
  elements.lensButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lens === appState.contact.lens);
  });
}

function renderReview() {
  renderReviewHeader();
  elements.confidenceText.textContent = `${appState.contact.facts.length} extracted facts, ${appState.contact.relationships.length} possible relationship signals.`;

  elements.factList.innerHTML = appState.contact.facts
    .map(
      (fact) => `
        <article class="fact-row ${fact.confidence === "strong" ? "strong" : ""}">
          <label>
            <p>${escapeHtml(fact.label)}</p>
            <input value="${escapeHtml(fact.value)}" data-fact-id="${escapeHtml(fact.id)}" />
          </label>
          <button class="source-button" type="button">${escapeHtml(fact.source)}</button>
        </article>
      `,
    )
    .join("");
}

function renderReviewHeader() {
  const name = getFact("Name") || "New Contact";
  const role = getFact("Role") || "Relationship contact";
  const company = getFact("Company") || "Unknown company";

  elements.reviewAvatar.textContent = getInitials(name) || "NC";
  elements.reviewName.textContent = name;
  elements.reviewSubtitle.textContent = `${role} at ${company}`;
}

function renderResearch() {
  const name = getFact("Name") || "this contact";
  const company = getFact("Company") || "their company";
  const preset = lensDefaults[appState.contact.lens];

  elements.researchTitle.textContent = `Using confirmed facts to enrich ${name}'s profile.`;
  elements.researchFeed.innerHTML = [
    ["Company profile found", `${company} website`],
    ["Possible public profile", "Needs user review"],
    [preset.companyCategory, preset.companyText(company)],
  ]
    .map(
      ([title, detail]) => `
        <article>
          <span></span>
          <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(detail)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderFindings() {
  elements.findingCount.textContent = `${appState.contact.findings.length} found`;
  elements.suggestionList.innerHTML = appState.contact.findings
    .map(
      (finding) => `
        <article class="suggestion ${finding.accepted ? "accepted" : ""}">
          <div>
            <p>${escapeHtml(finding.category)}</p>
            <strong>${escapeHtml(finding.text)}</strong>
            <small>Source: ${escapeHtml(finding.source)}</small>
          </div>
          <button type="button" data-finding-id="${escapeHtml(finding.id)}">
            ${finding.accepted ? "Added" : "Accept"}
          </button>
        </article>
      `,
    )
    .join("");
}

function renderRelationships() {
  const name = getFact("Name") || "Contact";
  const firstName = name.split(" ")[0] || "Contact";
  const company = getFact("Company") || "Company";
  const strong = appState.contact.relationships.filter((item) => item.group === "strong");
  const possible = appState.contact.relationships.filter((item) => item.group === "possible");

  elements.mapMainNode.textContent = firstName;
  elements.mapTopNode.textContent = strong[0]?.name.split(" ")[0] || "Known";
  elements.mapRightNode.textContent = company.split(" ")[0] || "Company";
  elements.mapBottomNode.textContent = "NUS";
  elements.linkGroups.innerHTML = `
    ${renderRelationshipGroup("Strong links", strong, "")}
    ${renderRelationshipGroup("Possible links", possible, "muted")}
  `;
}

function renderRelationshipGroup(title, items, extraClass) {
  return `
    <div class="link-group ${extraClass}">
      <h3>${title}</h3>
      ${items
        .map(
          (item) => `
            <article>
              <span class="link-strength ${item.strength}"></span>
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <p>${escapeHtml(item.reason)}</p>
              </div>
              <button type="button" data-relationship-id="${escapeHtml(item.id)}">
                ${item.status === "confirmed" ? "Linked" : item.group === "strong" ? "Confirm" : "Later"}
              </button>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderProfile() {
  const name = getFact("Name") || "New Contact";
  const role = getFact("Role") || "Relationship contact";
  const company = getFact("Company") || "Unknown company";
  const context = getFact("Context") || appState.contact.rawNote;
  const need = getFact("Need") || "Follow up when relevant";
  const preset = lensDefaults[appState.contact.lens];
  const acceptedFindings = appState.contact.findings.filter((finding) => finding.accepted);
  const confirmedLinks = appState.contact.relationships.filter(
    (relationship) => relationship.status === "confirmed",
  );

  elements.profileTitle.textContent = name;
  elements.profileAvatar.textContent = getInitials(name) || "NC";
  elements.profileRole.textContent = role;
  elements.profileCompany.textContent = company;
  elements.relationshipLens.textContent = appState.contact.lens;
  elements.nextAction.textContent = `Best next action: ${preset.nextAction(need)}`;

  elements.memoryLayers.innerHTML = [
    ["You told me", `${context}. ${need}.`],
    [
      "I found",
      acceptedFindings.length
        ? acceptedFindings.map((finding) => finding.text).join(" ")
        : "No enrichments accepted yet.",
    ],
    [
      "Possible network",
      confirmedLinks.length
        ? confirmedLinks.map((item) => `Linked to ${item.name}.`).join(" ")
        : "Relationship suggestions are saved for later review.",
    ],
  ]
    .map(
      ([title, text], index) => `
        <article>
          <span>${index + 1}</span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(text)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderAll() {
  renderLensControls();
  renderSavedContacts();
  renderSources();
  renderReview();
  renderResearch();
  renderFindings();
  renderRelationships();
  renderProfile();
}

function showScreen(id) {
  if (id === "review") {
    appState.contact.rawNote = elements.memoryNote.value.trim();
    inferContactFromNote();
    showToast("Draft extracted from memory");
  }

  if (id === "research") {
    appState.contact.confirmed = true;
    renderResearch();
    showToast("Deep research started");
  }

  if (id === "enrichment") {
    showToast("Research findings ready");
  }

  if (id === "network") {
    showToast("Relationship links prepared");
  }

  if (id === "profile") {
    saveCurrentContact();
    renderProfile();
    showToast("Profile saved to Relata");
  }

  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });
  elements.phoneFrame.dataset.current = id;

  const fallbackMap = {
    enrichment: "research",
    profile: "network",
  };

  steps.forEach((step) => {
    const stepKey = fallbackMap[id] || id;
    step.classList.toggle("active", step.dataset.step === stepKey);
  });

  screens.find((screen) => screen.id === id)?.scrollTo({ top: 0 });
}

function addSourceFromInput(value) {
  const label = value.trim();
  if (!label) return;

  const isLink = /^https?:\/\//i.test(label) || label.includes(".");
  const isCardFile = /\.(jpg|jpeg|png|heic|pdf)$/i.test(label);
  appState.contact.sources.push({
    id: `src-${Date.now()}`,
    type: isCardFile ? "Name card" : isLink ? "Website" : "Note",
    label,
    icon: isLink && !isCardFile ? "link-icon" : "card-icon",
  });
  elements.sourceInput.value = "";
  renderSources();
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.next));
});

steps.forEach((step) => {
  step.addEventListener("click", () => showScreen(step.dataset.step));
});

elements.addSourceButton?.addEventListener("click", () => {
  addSourceFromInput(elements.sourceInput.value);
});

elements.sourceInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addSourceFromInput(elements.sourceInput.value);
  }
});

elements.sampleSourceButton?.addEventListener("click", () => {
  addSourceFromInput("daniel-card.jpg");
  showToast("Name card added");
});

elements.homeButton?.addEventListener("click", () => {
  showScreen("home");
});

elements.demoModeButton?.addEventListener("click", () => {
  prepareDemo();
  showScreen("capture");
});

elements.seedContactsButton?.addEventListener("click", () => {
  seedSampleContacts();
  appState.demoPrepared = true;
  renderDemoStatus("Sample network loaded");
  showToast("Sample contacts added");
});

elements.newContactButton?.addEventListener("click", () => {
  if (appState.demoPrepared) {
    prepareDemoContact();
  } else {
    resetContact();
  }
});

elements.saveContactButton?.addEventListener("click", () => {
  saveCurrentContact();
});

elements.savedList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-load-contact]");
  if (!button) return;
  loadContactSnapshot(button.dataset.loadContact);
});

elements.lensButtons.forEach((button) => {
  button.addEventListener("click", () => {
    appState.contact.lens = button.dataset.lens;
    appState.contact.rawNote = elements.memoryNote.value.trim();
    inferContactFromNote();
  });
});

elements.factList?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-fact-id]");
  if (!input) return;

  const fact = appState.contact.facts.find((item) => item.id === input.dataset.factId);
  if (fact) {
    fact.value = input.value;
    renderReviewHeader();
    renderResearch();
    renderRelationships();
    renderProfile();
  }
});

elements.suggestionList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-finding-id]");
  if (!button) return;

  const finding = appState.contact.findings.find(
    (item) => item.id === button.dataset.findingId,
  );
  if (finding) {
    finding.accepted = !finding.accepted;
    renderFindings();
    renderProfile();
    showToast(finding.accepted ? "Finding added" : "Finding removed");
  }
});

elements.linkGroups?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-relationship-id]");
  if (!button) return;

  const relationship = appState.contact.relationships.find(
    (item) => item.id === button.dataset.relationshipId,
  );
  if (relationship) {
    relationship.status =
      relationship.status === "confirmed" ? "later" : "confirmed";
    renderRelationships();
    renderProfile();
    showToast(relationship.status === "confirmed" ? "Relationship linked" : "Link saved for later");
  }
});

pauseButton?.addEventListener("click", () => {
  const isPaused = pauseButton.classList.toggle("paused");
  researchOrbit?.classList.toggle("paused", isPaused);
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
});

loadSavedContacts();
inferContactFromNote();
renderDemoStatus();
showScreen("home");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
