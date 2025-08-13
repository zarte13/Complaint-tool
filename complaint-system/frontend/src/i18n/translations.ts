export interface Translations {
  // Navigation
  navHome: string;
  navComplaints: string;
  navDashboard: string;
  navResponsables?: string;
  settings?: string;
  notAuthorized?: string;
  settingsTaxonomy?: string;
  settingsDashboard?: string;
  settingsMasterData?: string;
  settingsTaxonomyIntro?: string;
  settingsDashboardIntro?: string;
  settingsMasterDataIntro?: string;
  settingsDashboardWeeks?: string;
  settingsCardKpis?: string;
  settingsCardTrends?: string;
  settingsCardFailures?: string;
  settingsCardStacked?: string;
  settingsCardRAR?: string;
  saved?: string;
  failedToSave?: string;
  systemTitle: string;
  
  // Home Page
  homeTitle: string;
  homeSubtitle: string;
  
  // Second Page
  secondTitle: string;
  secondSubtitle: string;
  comingSoon: string;
  placeholderMessage: string;
  
  // Complaint Management
  complaintManagement: string;
  manageAndTrackAllComplaints: string;
  searchComplaints: string;
  refresh: string;
  export: string;
  exportCSV: string;
  exportExcel: string;
  filters: string;
  allStatuses: string;
  allIssueTypes: string;
  clearFilters: string;
  from: string;
  to: string;
  showing: string;
  of: string;
  results: string;
  show: string;
  perPage: string;
  previous: string;
  next: string;
  noComplaintsFound: string;
  noActionsFound: string;
  
  // Complaint Form
  submitComplaint: string;
  complaintKind?: string;
  officialComplaint?: string;
  notificationComplaint?: string;
  ncrNumber?: string;
  customerCompany: string;
  partNumber: string;
  issueType: string;
  details: string;
  quantityOrdered: string;
  quantityReceived: string;
  attachFiles: string;
  submitButton: string;
  submitting: string;
  
  // Form Options
  selectIssueType: string;
  selectIssueCategory?: string;
  selectSubtypes?: string;
  wrongQuantity: string;
  wrongPart: string;
  damaged: string;
  other: string;
  issueCategory?: string;
  issueSubtypes?: string;
  newSubtypePlaceholder?: string;
  addSubtype?: string;
  categoryDimensional?: string;
  categoryVisual?: string;
  categoryPackaging?: string;
  visualScratch?: string;
  visualNicks?: string;
  visualRust?: string;
  packagingWrongBox?: string;
  packagingWrongBag?: string;
  packagingWrongPaper?: string;
  packagingWrongTags?: string;
  packagingReceivedLabel?: string;
  packagingExpectedLabel?: string;

  // Status display (complaint)
  statusOpenLabel: string;
  statusInPlanningLabel?: string;
  statusInProgressLabel: string;
  statusClosedLabel: string;
  // Optional alternate label for open actions in summaries/tiles
  statusUpcoming?: string;
  
  // Fields
  workOrderNumber: string;
  workOrderAbbrev: string;
  occurrence: string;
  dateReceived?: string;
  partReceived: string;
  humanFactor: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  
  // Tooltips
  tooltipCompany: string;
  tooltipPart: string;
  tooltipIssueType: string;
  tooltipQuantityOrdered: string;
  tooltipQuantityReceived: string;
  tooltipDetails: string;
  tooltipFileUpload: string;
  uploadDropHereOrClick: string;
  uploadSupportNote: string;
  pleaseLoginToSubmit?: string;
  tooltipWorkOrderNumber: string;
  tooltipOccurrence: string;
  tooltipDateReceived?: string;
  tooltipPartReceived: string;
  tooltipHumanFactor: string;
  
  // Complaint Details
  complaintDetails: string;
  basicInformation: string;
  additionalInformation: string;
  followUpActions: string;
  addAction: string;
  actionText: string;
  owner: string;
  dueDate: string;
  due: string;
  overdue: string;
  open: string;
  closed: string;
  add: string;
  cancel: string;
  save: string;
  yes?: string;
  no?: string;
  delete?: string;
  
  // Follow-up Actions Extended
  actionsPanel: string;
  createNewAction: string;
  actionNumber: string;
  responsiblePerson: string;
  priority: string;
  notes: string;
  progress: string;
  actionsOpen: string;
  actionsOverdue: string;
  actionsCompleted: string;
  completionRate: string;
  createFirstAction: string;
  actionLimit: string;
  actionLimitReached: string;
  
  // Action Statuses
  statusOpen: string;
  statusPending: string;
  statusInProgress: string;
  statusBlocked: string;
  statusEscalated: string;
  statusClosed: string;
  
  // Action Priorities
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityCritical: string;
  
  // Complaint List
  recentComplaints: string;
  noComplaints: string;
  id: string;
  ordered: string;
  received: string;
  hasAttachments: string;
  attachFilesButton: string;
  hide: string;
  itemNumber: string;
  humanFactorIndicator: string;
  viewFiles: string;
  noFiles: string;
  extraInfo: string;
  viewDetails?: string;
  
  // Validation
  requiredField: string;
  minCharacters: string;
  selectCompany: string;
  selectPart: string;
  
  // Drawer
  closePanel: string;
  edit: string;
  saving: string;
  undo: string;
  redo: string;
  lastEdit: string;
  editableFields: string;
  readOnlyInformation: string;
  
  // Enhanced Details
  orderDetails: string;
  issueDetails: string;
  systemInformation: string;
  neverEdited: string;
  attachedFiles: string;
  exportPdf?: string;
  
  // Image Gallery
  imageGallery: string;
  loadingImages: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  downloadImage: string;
  failedToLoadImage: string;

  // Dashboard
  dashboardTitle: string;
  loadingDashboard: string;
  kpiOpenCount: string;
  kpiInProgressCount: string;
  kpiResolvedCount: string;
  trendsTitle: string;
  failureModesTitle: string;

  // Attachments (Detail view)
  loadingFiles: string;
  downloadAttachment: string;
  download: string;
  deleteAttachment: string;
  confirmDeleteAttachment: string;
  noFilesAttached: string;

  // Authentication (Login)
  loginTitle: string;
  loginUsername: string;
  loginPassword: string;
  loginPasswordHelp: string;
  loginSubmit: string;
  loginSubmitting: string;
  loginFailed: string;
  loginLink: string;
  logoutButton: string;

  // Offline banner
  offlineModeTitle?: string;
  offlineModeMessage?: string;

  // Responsables
  responsablesTitle?: string;
  responsablesSubtitle?: string;
  searchResponsables?: string;
  showInactive?: string;
  name?: string;
  email?: string;
  department?: string;
  actions?: string;
  loading?: string;
  noResponsablesFound?: string;
  addPerson?: string;
  active?: string;
  inactive?: string;
  deactivate?: string;
}

// Relax type to avoid requiring all keys during iteration; runtime access stays the same
export const translations: Record<'en' | 'fr', Partial<Translations>> = {
  en: {
    navHome: 'Home',
    navComplaints: 'Complaints',
    navDashboard: 'Dashboard',
    settings: 'Settings',
    notAuthorized: 'You are not authorized to view this page.',
    settingsTaxonomy: 'Complaint Taxonomy',
    settingsDashboard: 'Dashboard',
    settingsMasterData: 'Master Data',
    settingsTaxonomyIntro: 'Manage issue categories and sub-types with English/French labels. Changes are global.',
    settingsDashboardIntro: 'Customize which cards are shown, their order/size, and the default time window.',
    settingsMasterDataIntro: 'Admin utilities for Companies and Parts.',
    settingsDashboardWeeks: 'Default weeks window',
    settingsCardKpis: 'Show KPI counters',
    settingsCardTrends: 'Show 12-week trend',
    settingsCardFailures: 'Show failure modes pie',
    settingsCardStacked: 'Show stacked glowing bar',
    settingsCardRAR: 'Show RAR metric card',
    saved: 'Saved',
    failedToSave: 'Failed to save',
    systemTitle: 'Complaint System',
    homeTitle: 'Part Order Complaint System',
    homeSubtitle: 'Submit and track complaints for part order issues',
    secondTitle: 'Complaint Management',
    secondSubtitle: 'Manage and track all complaints in one place',
    comingSoon: 'Coming Soon',
    placeholderMessage: 'This page is reserved for additional features and functionality',
    
    // Complaint Management
    complaintManagement: 'Complaint Management',
    manageAndTrackAllComplaints: 'Manage and track all complaints in one place',
    searchComplaints: 'Search complaints...',
    refresh: 'Refresh',
    export: 'Export',
    exportCSV: 'Export CSV',
    exportExcel: 'Export Excel',
    filters: 'Filters',
    allStatuses: 'All Statuses',
    allIssueTypes: 'All Issue Types',
    clearFilters: 'Clear Filters',
    from: 'From',
    to: 'To',
    showing: 'Showing',
    of: 'of',
    results: 'results',
    show: 'Show',
    perPage: 'per page',
    previous: 'Previous',
    next: 'Next',
    noComplaintsFound: 'No complaints found',
    noActionsFound: 'No actions found',
    
    // Complaint Form
    submitComplaint: 'Submit New Complaint',
    customerCompany: 'Customer Company *',
    partNumber: 'Part Number *',
    issueType: 'Issue Type *',
    details: 'Details *',
    quantityOrdered: 'Quantity Ordered',
    quantityReceived: 'Quantity Received',
    attachFiles: 'Attach Files',
    submitButton: 'Submit Complaint',
    submitting: 'Submitting...',
    complaintKind: 'Type',
    officialComplaint: 'Official Complaint',
    notificationComplaint: 'Notification',
    ncrNumber: 'NCR Number',
    
    // Form Options
    selectIssueType: 'Select issue type',
    selectIssueCategory: 'Select category',
    selectSubtypes: 'Select subtypes',
    wrongQuantity: 'Wrong Quantity',
    wrongPart: 'Wrong Part',
    damaged: 'Damaged',
    other: 'Other',
    issueCategory: 'Issue Category',
    issueSubtypes: 'Issue Subtypes',
    newSubtypePlaceholder: 'New sub-category...',
    addSubtype: 'Add',
    categoryDimensional: 'Dimensional',
    categoryVisual: 'Visual',
    categoryPackaging: 'Packaging',
    visualScratch: 'Scratch',
    visualNicks: 'Nicks',
    visualRust: 'Rust',
    packagingWrongBox: 'Wrong Box',
    packagingWrongBag: 'Wrong Bag',
    packagingWrongPaper: 'Wrong Paper',
    packagingWrongTags: 'Wrong Tags',
    packagingReceivedLabel: 'Received',
    packagingExpectedLabel: 'Expected',

    // Status display (complaint)
    statusOpenLabel: 'Communicated',
    statusInPlanningLabel: 'In Planning',
    statusInProgressLabel: 'In Progress',
    statusClosedLabel: 'Closed',
    statusUpcoming: 'Upcoming',
    
    // Fields
    workOrderNumber: 'Work Order Number',
    workOrderAbbrev: 'WO',
    occurrence: 'Occurrence',
    dateReceived: 'Date Received',
    partReceived: 'Part Received',
    humanFactor: 'Cause with Human Factor',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    status: 'Status',
    
    // Tooltips
    tooltipCompany: 'Select the customer company that placed the order',
    tooltipPart: 'Choose the specific part number related to this complaint',
    tooltipIssueType: 'Categorize the type of problem encountered',
    tooltipQuantityOrdered: 'Enter the original quantity that was ordered',
    tooltipQuantityReceived: 'Enter the actual quantity received',
    tooltipDetails: 'Provide a detailed description of the issue, including any relevant context',
    tooltipFileUpload: 'Attach supporting documents, photos, or evidence (PDF, JPG, PNG, max 10MB each)',
    uploadDropHereOrClick: 'Drag & drop files here, or click to select',
    uploadSupportNote: 'Supports images, PDFs, and text files up to 10MB',
    pleaseLoginToSubmit: 'Please log in to submit a complaint.',
    tooltipWorkOrderNumber: 'Enter the work order number for tracking purposes',
    tooltipOccurrence: 'Specify the occurrence or instance number',
    tooltipDateReceived: 'Select the date when this complaint/notification was received',
    tooltipPartReceived: 'Enter the part number that was actually received',
    tooltipHumanFactor: 'Human error was involved in this issue',
    
    // Complaint Details
    complaintDetails: 'Complaint Details',
    basicInformation: 'Basic Information',
    additionalInformation: 'Additional Information',
    followUpActions: 'Follow-up Actions',
    addAction: 'Add Action',
    actionText: 'Action Text',
    owner: 'Owner',
    dueDate: 'Due Date',
    due: 'Due',
    overdue: 'Overdue',
    open: 'Open',
    closed: 'Closed',
    add: 'Add',
    cancel: 'Cancel',
    save: 'Save',
    yes: 'Yes',
    no: 'No',
    delete: 'Delete',
    
    // Complaint List
    recentComplaints: 'Recent Complaints',
    noComplaints: 'No complaints found',
    id: 'ID',
    ordered: 'Ordered',
    received: 'Received',
    hasAttachments: 'Has attachments',
    attachFilesButton: 'Attach Files',
    hide: 'Hide',
    itemNumber: 'Item #',
    humanFactorIndicator: 'HF',
    viewFiles: 'View Files',
    noFiles: 'No files',
    extraInfo: 'Additional Information',
    viewDetails: 'View details',
    
    // Follow-up Actions Extended
    actionsPanel: 'Follow-up Actions',
    createNewAction: 'Add New Action',
    actionNumber: 'Action #',
    responsiblePerson: 'Responsible Person',
    priority: 'Priority',
    notes: 'Notes',
    progress: 'Progress',
    actionsOpen: 'open',
    actionsOverdue: 'overdue',
    actionsCompleted: 'completed',
    completionRate: 'completed',
    createFirstAction: 'Create the first action to organize the action plan',
    actionLimit: 'Warning: You are approaching the 10 actions per complaint limit',
    actionLimitReached: 'Limit reached: Maximum 10 actions per complaint',
    
    // Validation
    requiredField: 'This field is required',
    minCharacters: 'Details must be at least 10 characters',
    selectCompany: 'Please select a customer company',
    selectPart: 'Please select a part',
    
    // Drawer
    closePanel: 'Close Panel',
    edit: 'Edit',
    saving: 'Saving...',
    undo: 'Undo',
    redo: 'Redo',
    lastEdit: 'Last Edit',
    editableFields: 'Editable Fields',
    readOnlyInformation: 'Read-Only Information',
    
    // Enhanced Details
    orderDetails: 'Order Details',
    issueDetails: 'Issue Details',
    systemInformation: 'System Information',
    neverEdited: 'Never edited',
    attachedFiles: 'Attached Files',
    exportPdf: 'Export PDF',
    
    // Image Gallery
    imageGallery: 'Image Gallery',
    loadingImages: 'Loading images...',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    downloadImage: 'Download',
    failedToLoadImage: 'Failed to load image',

    // Dashboard
    dashboardTitle: 'Command Center Dashboard',
    loadingDashboard: 'Loading dashboard...',
    kpiOpenCount: 'Number of open complaints',
    kpiInProgressCount: 'Number of in progress complaints',
    kpiResolvedCount: 'Number of resolved complaints',
    trendsTitle: 'Complaint Trends (12 Weeks)',
    failureModesTitle: 'Failure Modes',

    // Authentication (Login)
    loginTitle: 'Login',
    loginUsername: 'Username',
    loginPassword: 'Password',
    loginPasswordHelp: 'At least 10 characters, include upper, lower, and a digit.',
    loginSubmit: 'Sign in',
    loginSubmitting: 'Signing in…',
    loginFailed: 'Login failed',
    loginLink: 'Login',
    logoutButton: 'Logout',
    // Offline banner
    offlineModeTitle: 'Offline mode',
    offlineModeMessage: 'You are currently offline. Changes will sync when you are back online.',
    // Responsables
    navResponsables: 'Responsables',
    responsablesTitle: 'Responsables',
    responsablesSubtitle: 'Manage responsible persons for follow-up actions',
    searchResponsables: 'Search responsables...',
    showInactive: 'Show inactive',
    name: 'Name',
    email: 'Email',
    department: 'Department',
    actions: 'Actions',
    loading: 'Loading...',
    noResponsablesFound: 'No responsables found',
    addPerson: 'Add Person',
    active: 'Active',
    inactive: 'Inactive',
    deactivate: 'Deactivate'
  },
  fr: {
    navHome: 'Accueil',
    navComplaints: 'Réclamations',
    navDashboard: 'Tableau de bord',
    settings: 'Paramètres',
    notAuthorized: 'Vous n\'êtes pas autorisé à voir cette page.',
    settingsTaxonomy: 'Taxonomie des réclamations',
    settingsDashboard: 'Tableau de bord',
    settingsMasterData: 'Données de référence',
    settingsTaxonomyIntro: 'Gérer les catégories et sous-types avec libellés FR/EN. Changements globaux.',
    settingsDashboardIntro: 'Personnalisez les cartes affichées, l\'ordre/la taille et la période par défaut.',
    settingsMasterDataIntro: 'Outils d\'administration pour les Clients et Pièces.',
    settingsDashboardWeeks: 'Période par défaut (semaines)',
    settingsCardKpis: 'Afficher les indicateurs KPI',
    settingsCardTrends: 'Afficher la tendance sur 12 semaines',
    settingsCardFailures: 'Afficher le camembert des modes de défaillance',
    settingsCardStacked: 'Afficher le graphique à barres empilées',
    settingsCardRAR: 'Afficher la carte RAR',
    saved: 'Enregistré',
    failedToSave: 'Échec de l\'enregistrement',
    systemTitle: 'Système de plainte',
    homeTitle: 'Système de Réclamation de Commandes de Pièces',
    homeSubtitle: 'Soumettre et suivre les réclamations pour les problèmes de commandes de pièces',
    secondTitle: 'Gestion des Réclamations',
    secondSubtitle: 'Gérer et suivre toutes les réclamations',
    comingSoon: 'Bientôt Disponible',
    placeholderMessage: 'Cette page est réservée aux fonctionnalités supplémentaires',
    
    // Complaint Management
    complaintManagement: 'Gestion des Réclamations',
    manageAndTrackAllComplaints: 'Gérer et suivre toutes les réclamations en un seul endroit',
    searchComplaints: 'Rechercher des réclamations...',
    refresh: 'Actualiser',
    export: 'Exporter',
    exportCSV: 'Exporter CSV',
    exportExcel: 'Exporter Excel',
    filters: 'Filtres',
    allStatuses: 'Tous les Statuts',
    allIssueTypes: 'Tous les Types de Problèmes',
    clearFilters: 'Effacer les Filtres',
    from: 'De',
    to: 'À',
    showing: 'Affichage',
    of: 'de',
    results: 'résultats',
    show: 'Afficher',
    perPage: 'par page',
    previous: 'Précédent',
    next: 'Suivant',
    noComplaintsFound: 'Aucune réclamation trouvée',
    noActionsFound: 'Aucune action trouvée',
    
    // Complaint Form
    submitComplaint: 'Soumettre une Nouvelle Plainte',
    customerCompany: 'Compagnie Cliente *',
    partNumber: 'Numéro de Pièce *',
    issueType: 'Type de Problème *',
    details: 'Détails *',
    quantityOrdered: 'Quantité Commandée',
    quantityReceived: 'Quantité Reçue',
    attachFiles: 'Joindre des Fichiers',
    submitButton: 'Soumettre la Plainte',
    submitting: 'Envoi en cours...',
    complaintKind: 'Type',
    officialComplaint: 'Plainte officielle',
    notificationComplaint: 'Notification',
    ncrNumber: 'Numéro NCR',
    
    // Form Options
    selectIssueType: 'Sélectionner le type de problème',
    selectIssueCategory: 'Sélectionner la catégorie',
    selectSubtypes: 'Sélectionner des sous-types',
    wrongQuantity: 'Mauvaise quantité',
    wrongPart: 'Mauvaise pièce',
    damaged: 'Endommagé',
    other: 'Autre',
    issueCategory: 'Catégorie du problème',
    issueSubtypes: 'Sous-types',
    newSubtypePlaceholder: 'Nouvelle sous-catégorie...',
    addSubtype: 'Ajouter',
    categoryDimensional: 'Dimensionnel',
    categoryVisual: 'Visuel',
    categoryPackaging: 'Emballage',
    visualScratch: 'Éraflure',
    visualNicks: 'Coches',
    visualRust: 'Rouille',
    packagingWrongBox: 'Mauvaise boîte',
    packagingWrongBag: 'Mauvais sac',
    packagingWrongPaper: 'Mauvais papier',
    packagingWrongTags: 'Mauvaises étiquettes',
    packagingReceivedLabel: 'Reçu',
    packagingExpectedLabel: 'Attendu',

    // Status display (complaint)
    statusOpenLabel: 'Communiquées',
    statusInPlanningLabel: 'Plans établis',
    statusInProgressLabel: 'En cours',
    statusClosedLabel: 'Fermée',
    statusUpcoming: 'À venir',
    statusInProgress: 'En cours',
    statusClosed: 'Complétée',
    
    // Fields
    workOrderNumber: 'Numéro de bon de travail (BT)',
    workOrderAbbrev: 'BT',
    occurrence: 'Occurrence',
    dateReceived: 'Date de réception',
    partReceived: 'Pièce reçue',
    humanFactor: 'Cause avec facteur humain',
    createdAt: 'Créé le',
    updatedAt: 'Mis à jour le',
    status: 'Statut',
    
    // Tooltips
    tooltipCompany: 'Sélectionner la société cliente qui a passé la commande',
    tooltipPart: 'Choisir le numéro de pièce spécifique lié à cette réclamation',
    tooltipIssueType: 'Catégoriser le type de problème rencontré',
    tooltipQuantityOrdered: 'Entrer la quantité originale qui a été commandée',
    tooltipQuantityReceived: 'Entrer la quantité réellement reçue',
    tooltipDetails: 'Fournir une description détaillée du problème, incluant tout contexte pertinent',
    tooltipFileUpload: 'Joindre des documents, photos ou preuves à l\'appui (PDF, JPG, PNG, max 10 Mo chacun)',
    uploadDropHereOrClick: 'Glissez-déposez des fichiers ici, ou cliquez pour sélectionner',
    uploadSupportNote: 'Prend en charge les images, PDF et fichiers texte jusqu\'à 10 Mo',
    pleaseLoginToSubmit: 'Veuillez vous connecter pour soumettre une réclamation.',
    tooltipWorkOrderNumber: 'Entrer le numéro de bon de travail (BT) pour le suivi',
    tooltipOccurrence: 'Spécifier l\'occurrence ou le numéro d\'instance',
    tooltipDateReceived: 'Sélectionnez la date de réception de cette plainte/notification',
    tooltipPartReceived: 'Entrer le numéro de pièce qui a été réellement reçu',
    tooltipHumanFactor: 'Une erreur humaine est impliquée dans cette plainte',
    
    // Complaint Details
    complaintDetails: 'Détails de la Réclamation',
    basicInformation: 'Informations de Base',
    additionalInformation: 'Informations Supplémentaires',
    followUpActions: 'Actions de Suivi',
    addAction: 'Ajouter une Action',
    actionText: 'Texte de l\'Action',
    owner: 'Propriétaire',
    dueDate: 'Date d\'Échéance',
    due: 'Dû',
    overdue: 'En retard',
    open: 'Ouvert',
    closed: 'Fermé',
    add: 'Ajouter',
    cancel: 'Annuler',
    save: 'Enregistrer',
    yes: 'Oui',
    no: 'Non',
    delete: 'Supprimer',
    
    // Complaint List
    recentComplaints: 'Réclamations Récentes',
    noComplaints: 'Aucune réclamation trouvée',
    id: 'ID',
    ordered: 'Commandé',
    received: 'Reçu',
    hasAttachments: 'A des pièces jointes',
    attachFilesButton: 'Joindre des Fichiers',
    hide: 'Masquer',
    itemNumber: '# de pièce',
    humanFactorIndicator: 'FH',
    viewFiles: 'Voir les fichiers',
    noFiles: 'Aucun fichier',
    extraInfo: 'Informations supplémentaires',
    viewDetails: 'Voir les détails',
    
    // Validation
    requiredField: 'Ce champ est obligatoire',
    minCharacters: 'Les détails doivent comporter au moins 10 caractères',
    selectCompany: 'Veuillez sélectionner une société cliente',
    selectPart: 'Veuillez sélectionner une pièce',
    
    // Drawer
    closePanel: 'Fermer le panneau',
    edit: 'Modifier',
    saving: 'Enregistrement...',
    undo: 'Annuler',
    redo: 'Refaire',
    lastEdit: 'Dernière modification',
    editableFields: 'Champs modifiables',
    readOnlyInformation: 'Informations en lecture seule',
    
    // Follow-up Actions Extended
    actionsPanel: 'Actions de Suivi',
    createNewAction: 'Ajouter une action',
    actionNumber: 'Action #',
    responsiblePerson: 'Personne responsable',
    priority: 'Priorité',
    notes: 'Notes',
    progress: 'Progression',
    actionsOpen: 'ouvertes',
    actionsOverdue: 'en retard',
    actionsCompleted: 'complétées',
    completionRate: 'complétées',
    createFirstAction: 'Créez votre première action',
    actionLimit: 'Attention: Vous approchez de la limite de 10 actions par réclamation',
    actionLimitReached: 'Limite atteinte: Maximum 10 actions par réclamation',
    
    // Enhanced Details
    orderDetails: 'Détails de la commande',
    issueDetails: 'Détails du problème',
    systemInformation: 'Informations système',
    neverEdited: 'Jamais modifié',
    attachedFiles: 'Fichiers joints',
    exportPdf: 'Exporter PDF',
    
    // Image Gallery
    imageGallery: 'Galerie d\'images',
    loadingImages: 'Chargement des images...',
    zoomIn: 'Agrandir',
    zoomOut: 'Réduire',
    resetZoom: 'Réinitialiser le zoom',
    downloadImage: 'Télécharger',
    failedToLoadImage: 'Impossible de charger l\'image',

    // Dashboard
    dashboardTitle: 'Tableau de bord du centre de commande',
    loadingDashboard: 'Chargement du tableau de bord...',
    kpiOpenCount: 'Nombre de réclamations ouvertes',
    kpiInProgressCount: 'Nombre de réclamations en cours',
    kpiResolvedCount: 'Nombre de réclamations résolues',
    trendsTitle: 'Tendances des plaintes (12 semaines)',
    failureModesTitle: 'Modes de défaillance',

    // Authentication (Login)
    loginTitle: 'Connexion',
    loginUsername: 'Nom d’utilisateur',
    loginPassword: 'Mot de passe',
    loginPasswordHelp: 'Au moins 10 caractères, incluant majuscule, minuscule et un chiffre.',
    loginSubmit: 'Se connecter',
    loginSubmitting: 'Connexion…',
    loginFailed: 'Échec de la connexion',
    loginLink: 'Connexion',
    logoutButton: 'Déconnexion',
    // Offline banner
    offlineModeTitle: 'Mode hors ligne',
    offlineModeMessage: 'Vous êtes hors ligne. Les modifications seront synchronisées lorsque vous serez de nouveau en ligne.',
    // Responsables
    navResponsables: 'Responsables',
    responsablesTitle: 'Responsables',
    responsablesSubtitle: 'Gérer les personnes responsables des actions de suivi',
    searchResponsables: 'Rechercher des responsables...',
    showInactive: 'Afficher les inactifs',
    name: 'Nom',
    email: 'Courriel',
    department: 'Département',
    actions: 'Actions',
    loading: 'Chargement...',
    noResponsablesFound: 'Aucun responsable trouvé',
    addPerson: 'Ajouter une personne',
    active: 'Actif',
    inactive: 'Inactif',
    deactivate: 'Désactiver'
  },
};