export interface Translations {
  // Navigation
  navHome: string;
  navComplaints: string;
  navDashboard: string;
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
  wrongQuantity: string;
  wrongPart: string;
  damaged: string;
  other: string;
  
  // Fields
  workOrderNumber: string;
  occurrence: string;
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
  tooltipWorkOrderNumber: string;
  tooltipOccurrence: string;
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
  
  // Validation
  requiredField: string;
  minCharacters: string;
  selectCompany: string;
  selectPart: string;
  
  // Drawer
  closePanel: string;
  edit: string;
  save: string;
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
  
  // Image Gallery
  imageGallery: string;
  loadingImages: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  downloadImage: string;
  failedToLoadImage: string;
}

export const translations: Record<'en' | 'fr', Translations> = {
  en: {
    navHome: 'Home',
    navComplaints: 'Complaints',
    navDashboard: 'Dashboard',
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
    
    // Form Options
    selectIssueType: 'Select issue type',
    wrongQuantity: 'Wrong Quantity',
    wrongPart: 'Wrong Part',
    damaged: 'Damaged',
    other: 'Other',
    
    // Fields
    workOrderNumber: 'Work Order Number *',
    occurrence: 'Occurrence',
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
    tooltipWorkOrderNumber: 'Enter the work order number for tracking purposes',
    tooltipOccurrence: 'Specify the occurrence or instance number',
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
    
    // Validation
    requiredField: 'This field is required',
    minCharacters: 'Details must be at least 10 characters',
    selectCompany: 'Please select a customer company',
    selectPart: 'Please select a part',
    
    // Drawer
    closePanel: 'Close Panel',
    edit: 'Edit',
    save: 'Save',
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
    
    // Image Gallery
    imageGallery: 'Image Gallery',
    loadingImages: 'Loading images...',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    downloadImage: 'Download',
    failedToLoadImage: 'Failed to load image'
  },
  fr: {
    navHome: 'Accueil',
    navComplaints: 'Réclamations',
    navDashboard: 'Tableau de bord',
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
    
    // Form Options
    selectIssueType: 'Sélectionner le type de problème',
    wrongQuantity: 'Mauvaise Quantité',
    wrongPart: 'Mauvaise Pièce',
    damaged: 'Endommagé',
    other: 'Autre',
    
    // Fields
    workOrderNumber: 'Numéro de bon de travail (BT) *',
    occurrence: 'Occurrence',
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
    tooltipWorkOrderNumber: 'Entrer le numéro de bon de travail (BT) pour le suivi',
    tooltipOccurrence: 'Spécifier l\'occurrence ou le numéro d\'instance',
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
    
    // Complaint List
    recentComplaints: 'Réclamations Récentes',
    noComplaints: 'Aucune réclamation trouvée',
    id: 'ID',
    ordered: 'Commandé',
    received: 'Reçu',
    hasAttachments: 'A des pièces jointes',
    attachFilesButton: 'Joindre des Fichiers',
    hide: 'Masquer',
    itemNumber: 'Article #',
    humanFactorIndicator: 'FH',
    viewFiles: 'Voir les fichiers',
    noFiles: 'Aucun fichier',
    extraInfo: 'Informations supplémentaires',
    
    // Validation
    requiredField: 'Ce champ est obligatoire',
    minCharacters: 'Les détails doivent comporter au moins 10 caractères',
    selectCompany: 'Veuillez sélectionner une société cliente',
    selectPart: 'Veuillez sélectionner une pièce',
    
    // Drawer
    closePanel: 'Fermer le panneau',
    edit: 'Modifier',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    undo: 'Annuler',
    redo: 'Refaire',
    lastEdit: 'Dernière modification',
    editableFields: 'Champs modifiables',
    readOnlyInformation: 'Informations en lecture seule',
    
    // Enhanced Details
    orderDetails: 'Détails de la commande',
    issueDetails: 'Détails du problème',
    systemInformation: 'Informations système',
    neverEdited: 'Jamais modifié',
    attachedFiles: 'Fichiers joints',
    
    // Image Gallery
    imageGallery: 'Galerie d\'images',
    loadingImages: 'Chargement des images...',
    zoomIn: 'Agrandir',
    zoomOut: 'Réduire',
    resetZoom: 'Réinitialiser le zoom',
    downloadImage: 'Télécharger',
    failedToLoadImage: 'Impossible de charger l\'image'
  },
};