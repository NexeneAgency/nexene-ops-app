export const onboardingMigration = `
 CREATE TABLE onboardings (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','completed')),
  answers TEXT NOT NULL DEFAULT '{}', step INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1, document_id TEXT REFERENCES documents(id),
  completed_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
 );
 INSERT INTO schema_migrations VALUES(5);
`;
export const statusLabels = {
  invited: ["Einladung gesendet", "Invitation sent"],
  existing: ["Nexene hat bereits Zugriff", "Nexene already has access"],
  missing: [
    "Noch kein Konto oder Zugriff möglich",
    "No account or access available yet",
  ],
  not_needed: ["Wird nicht verwendet", "Not used"],
};
export const basics = [
  ["company", "Unternehmen", "Company", "text", true],
  ["contact_name", "Ansprechperson", "Contact person", "text", true],
  [
    "contact_email",
    "E-Mail der Ansprechperson",
    "Contact email",
    "email",
    true,
  ],
  ["website", "Website-Adresse", "Website URL", "url", false],
  ["platform", "CMS / Website-System", "CMS / website platform", "text", true],
];
export function projectFields(type) {
  return type === "seo_geo"
    ? [
        [
          "goals",
          "Welche Ziele sollen SEO und GEO erreichen?",
          "What should SEO and GEO achieve?",
          "textarea",
          true,
        ],
        [
          "services",
          "Wichtigste Leistungen oder Produkte",
          "Main services or products",
          "textarea",
          true,
        ],
        [
          "audience",
          "Wen möchtet ihr erreichen?",
          "Who do you want to reach?",
          "textarea",
          true,
        ],
        [
          "locations",
          "Zielregionen und Standorte",
          "Target regions and locations",
          "textarea",
          false,
        ],
        [
          "keywords",
          "Bekannte Suchbegriffe und häufige Kundenfragen",
          "Known search terms and common customer questions",
          "textarea",
          false,
        ],
        [
          "competitors",
          "Wettbewerber und Vergleichsseiten",
          "Competitors and reference websites",
          "textarea",
          false,
        ],
      ]
    : [
        [
          "goals",
          "Was soll die Website für euch erreichen?",
          "What should the website achieve?",
          "textarea",
          true,
        ],
        [
          "services",
          "Wichtigste Leistungen oder Produkte",
          "Main services or products",
          "textarea",
          true,
        ],
        [
          "audience",
          "Wen möchtet ihr erreichen?",
          "Who do you want to reach?",
          "textarea",
          true,
        ],
        [
          "pages",
          "Benötigte Seiten und Funktionen",
          "Required pages and features",
          "textarea",
          false,
        ],
        [
          "timeline",
          "Gewünschter Starttermin und wichtige Termine",
          "Desired launch date and key dates",
          "text",
          false,
        ],
        [
          "competitors",
          "Beispiele und Websites, die euch gefallen",
          "Examples and websites you like",
          "textarea",
          false,
        ],
      ];
}
export const contentFields = [
  [
    "brand_assets",
    "Link zu Logo, Farben und Schriften",
    "Link to logo, colours and fonts",
    "url",
    false,
  ],
  [
    "content_links",
    "Link zu Texten, Bildern und vorhandenen Inhalten",
    "Link to copy, images and existing content",
    "url",
    false,
  ],
  [
    "legal_links",
    "Link zu freigegebenen Rechtstexten",
    "Link to approved legal texts",
    "url",
    false,
  ],
  [
    "integration_notes",
    "Weitere Systeme und Integrationen",
    "Other systems and integrations",
    "textarea",
    false,
  ],
  [
    "notes",
    "Was sollten wir noch wissen?",
    "What else should we know?",
    "textarea",
    false,
  ],
];
const access = {
  cms: [
    "CMS / Website-System",
    "CMS / website platform",
    "Für Inhalte einen Editorzugang einladen. Adminrechte nur, wenn technische Änderungen oder Einstellungen nötig sind.",
    "Invite an editor for content work. Grant admin rights only for technical changes or settings.",
  ],
  domain: [
    "Domain und DNS",
    "Domain and DNS",
    "Für Domain- und DNS-Änderungen einen delegierten Zugang nutzen, falls der Anbieter das unterstützt. Sonst Änderungen mit uns abstimmen.",
    "Use delegated access for domain and DNS changes where supported. Otherwise coordinate the changes with us.",
  ],
  hosting: [
    "Hosting und CDN",
    "Hosting and CDN",
    "Projektbezogenen Mitarbeiterzugang einladen. SSH oder SFTP nur bei Bedarf über einen sicheren Kanal bereitstellen.",
    "Invite project-level access. Provide SSH or SFTP access through a secure channel only when needed.",
  ],
  search_console: [
    "Google Search Console",
    "Google Search Console",
    "Nexene als vollständigen Nutzer zur passenden Property hinzufügen. Eigentümerschaft muss dafür nicht übertragen werden.",
    "Add Nexene as a full user to the relevant property. Ownership does not need to be transferred.",
  ],
  analytics: [
    "Google Analytics 4",
    "Google Analytics 4",
    "Für Auswertungen reicht die Rolle Betrachter. Editorrechte nur für vereinbarte Änderungen an der Messung.",
    "Viewer access is enough for reporting. Grant editor access only for agreed measurement changes.",
  ],
  consent: [
    "Consent- oder Cookie-Tool",
    "Consent or cookie tool",
    "Falls vorhanden, einen Mitarbeiterzugang zum Consent-Tool einladen. Einstellungen stimmen wir vor Änderungen mit euch ab.",
    "If available, invite collaborator access to the consent tool. We will agree on settings before making changes.",
  ],
  tag_manager: [
    "Google Tag Manager",
    "Google Tag Manager",
    "Für die Bestandsaufnahme reicht Lesezugriff. Veröffentlichungsrechte nur, wenn wir Tracking-Änderungen umsetzen sollen.",
    "Read access is enough for the audit. Grant publishing rights only if we are implementing tracking changes.",
  ],
  business_profile: [
    "Google Unternehmensprofil",
    "Google Business Profile",
    "Bei lokalen Unternehmen Nexene als Administrator einladen. Die Inhaberschaft bleibt bei euch.",
    "For local businesses, invite Nexene as a manager. Keep ownership of the profile.",
  ],
  bing: [
    "Bing Webmaster Tools",
    "Bing Webmaster Tools",
    "Falls vorhanden, Zugriff auf die passende Website einladen. Für die Analyse genügt Lesezugriff.",
    "If available, invite access to the relevant website. Read access is enough for analysis.",
  ],
};
export function accessItems(type, local = false) {
  const keys =
    type === "seo_geo"
      ? [
          "cms",
          "search_console",
          "analytics",
          "tag_manager",
          "consent",
          "bing",
          ...(local ? ["business_profile"] : []),
        ]
      : [
          "cms",
          "domain",
          "hosting",
          "analytics",
          "search_console",
          "tag_manager",
          "consent",
        ];
  return keys.map((id) => ({
    id,
    label: access[id].slice(0, 2),
    help: access[id].slice(2),
  }));
}
export function cleanAnswers(input, validate = true) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Angaben fehlen / Answers missing");
  const out = {};
  for (const [key] of [
    ...basics,
    ...projectFields("web"),
    ...projectFields("seo_geo"),
    ...contentFields,
  ]) {
    if (input[key] !== undefined && typeof input[key] !== "string")
      throw new Error("Ungültige Angaben / Invalid answers");
    out[key] = (input[key] || "").trim().slice(0, 4000);
  }
  out.local_business = input.local_business === true;
  out.new_website = input.new_website === true;
  out.confirmed = input.confirmed === true;
  out.accesses = {};
  for (const id of Object.keys(access)) {
    const entry = input.accesses?.[id];
    if (!entry) continue;
    if (
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      ![...Object.keys(statusLabels), ""].includes(entry.status)
    )
      throw new Error("Ungültiger Zugriffsstatus / Invalid access status");
    out.accesses[id] = {
      status: entry.status,
      note:
        typeof entry.note === "string" ? entry.note.trim().slice(0, 2000) : "",
    };
  }
  if (!validate) return out;
  for (const key of [
    "website",
    "brand_assets",
    "content_links",
    "legal_links",
  ]) {
    if (!out[key]) continue;
    let url;
    try {
      url = new URL(out[key]);
    } catch {
      throw new Error(
        "Bitte gültige Links mit https:// eingeben. / Enter valid links starting with https://.",
      );
    }
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error(
        "Bitte Links ohne Zugangsdaten verwenden. / Use links without credentials.",
      );
  }
  if (
    out.contact_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.contact_email)
  )
    throw new Error(
      "Bitte eine gültige E-Mail-Adresse eingeben. / Enter a valid email address.",
    );
  return out;
}
export function validateCompletion(answers, type) {
  for (const [key] of [...basics, ...projectFields(type)].filter((f) => f[4]))
    if (!answers[key])
      throw new Error(
        "Bitte die Pflichtfelder ausfüllen. / Complete the required fields.",
      );
  if ((type === "seo_geo" || !answers.new_website) && !answers.website)
    throw new Error(
      "Bitte die Website-Adresse angeben. / Enter the website URL.",
    );
  for (const item of accessItems(type, answers.local_business))
    if (!answers.accesses[item.id]?.status)
      throw new Error(
        "Bitte für jedes System den Zugriffsstatus auswählen. / Select an access status for each system.",
      );
  if (!answers.confirmed)
    throw new Error("Bitte die Angaben bestätigen. / Confirm your answers.");
}
const paragraph = (text) => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : [],
});
const heading = (text, level = 2) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});
export function onboardingDocument(
  project,
  answers,
  user,
  inviteEmail,
  completedAt,
  lang,
) {
  const i = lang === "en" ? 1 : 0,
    nodes = [
      heading("Onboarding: " + project.name, 1),
      paragraph(
        (i ? "Submitted by: " : "Übermittelt von: ") +
          user.name +
          " (" +
          user.email +
          ")",
      ),
      paragraph(
        new Date(completedAt).toLocaleString(i ? "en-GB" : "de-AT", {
          timeZone: "Europe/Vienna",
        }),
      ),
      paragraph(
        i
          ? "These details were submitted through onboarding. Nexene still needs to verify access."
          : "Diese Angaben wurden im Onboarding übermittelt. Nexene muss die Zugriffe noch prüfen.",
      ),
    ];
  if (project.project_type === "web" && answers.new_website)
    nodes.push(
      paragraph(
        i
          ? "New website without an existing website address."
          : "Neue Website ohne bestehende Website-Adresse.",
      ),
    );
  if (project.project_type === "seo_geo")
    nodes.push(
      paragraph(
        (i ? "Local business: " : "Lokales Unternehmen: ") +
          (answers.local_business ? (i ? "Yes" : "Ja") : i ? "No" : "Nein"),
      ),
    );
  const sections = [
    [i ? "Company and contact" : "Unternehmen und Kontakt", basics],
    [i ? "Project goals" : "Projektziele", projectFields(project.project_type)],
    [i ? "Content and assets" : "Inhalte und Materialien", contentFields],
  ];
  for (const [title, fields] of sections) {
    nodes.push(heading(title));
    for (const [key, de, en] of fields)
      nodes.push(
        heading(i ? en : de, 3),
        paragraph(answers[key] || (i ? "Not provided" : "Nicht angegeben")),
      );
  }
  nodes.push(
    heading(i ? "Access" : "Zugriffe"),
    paragraph(
      (i ? "Invitation address: " : "Einladungsadresse: ") + inviteEmail,
    ),
  );
  for (const item of accessItems(
    project.project_type,
    answers.local_business,
  )) {
    const entry = answers.accesses[item.id];
    nodes.push(
      heading(item.label[i], 3),
      paragraph(statusLabels[entry.status][i]),
    );
    if (entry.note) nodes.push(paragraph(entry.note));
  }
  return { type: "doc", content: nodes };
}
