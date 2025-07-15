export interface Translations {
  // Navigation
  navHome: string;
  navSecond: string;
  systemTitle: string;
  
  // Home Page
  homeTitle: string;
  homeSubtitle: string;
  
  // Second Page
  secondTitle: string;
  secondSubtitle: string;
  comingSoon: string;
  placeholderMessage: string;
  
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
  
  // Tooltips
  tooltipCompany: string;
  tooltipPart: string;
  tooltipIssueType: string;
  tooltipQuantityOrdered: string;
  tooltipQuantityReceived: string;
  tooltipDetails: string;
  tooltipFileUpload: string;
  
  // Complaint List
  recentComplaints: string;
  noComplaints: string;
  id: string;
  ordered: string;
  received: string;
  hasAttachments: string;
  attachFilesButton: string;
  hide: string;
  
  // Validation
  requiredField: string;
  minCharacters: string;
  selectCompany: string;
  selectPart: string;
}

export const translations: Record<'en' | 'fr', Translations> = {
  en: {
    navHome: 'Home',
    navSecond: 'Second Page',
    systemTitle: 'Complaint System',
    homeTitle: 'Part Order Complaint System',
    homeSubtitle: 'Submit and track complaints for part order issues',
    secondTitle: 'Second Page',
    secondSubtitle: 'This is a placeholder page for future features.',
    comingSoon: 'Coming Soon',
    placeholderMessage: 'This page is reserved for additional features and functionality.',
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
    selectIssueType: 'Select issue type',
    wrongQuantity: 'Wrong Quantity',
    wrongPart: 'Wrong Part',
    damaged: 'Damaged',
    other: 'Other',
    tooltipCompany: 'Select the customer company that placed the order',
    tooltipPart: 'Choose the specific part number related to this complaint',
    tooltipIssueType: 'Categorize the type of problem encountered',
    tooltipQuantityOrdered: 'Enter the original quantity that was ordered',
    tooltipQuantityReceived: 'Enter the actual quantity received',
    tooltipDetails: 'Provide a detailed description of the issue, including any relevant context',
    tooltipFileUpload: 'Attach supporting documents, photos, or evidence (PDF, JPG, PNG, max 10MB each)',
    recentComplaints: 'Recent Complaints',
    noComplaints: 'No complaints found',
    id: 'ID',
    ordered: 'Ordered',
    received: 'Received',
    hasAttachments: 'Has attachments',
    attachFilesButton: 'Attach Files',
    hide: 'Hide',
    requiredField: 'This field is required',
    minCharacters: 'Details must be at least 10 characters',
    selectCompany: 'Please select a customer company',
    selectPart: 'Please select a part'
  },
  fr: {
    navHome: 'Accueil',
    navSecond: 'Deuxième Page',
    systemTitle: 'Système de Réclamation',
    homeTitle: 'Système de Réclamation de Commandes de Pièces',
    homeSubtitle: 'Soumettre et suivre les réclamations pour les problèmes de commandes de pièces',
    secondTitle: 'Deuxième Page',
    secondSubtitle: 'Ceci est une page de remplacement pour les fonctionnalités futures.',
    comingSoon: 'Bientôt Disponible',
    placeholderMessage: 'Cette page est réservée aux fonctionnalités supplémentaires.',
    submitComplaint: 'Soumettre une Nouvelle Réclamation',
    customerCompany: 'Compagnie Cliente *',
    partNumber: 'Numéro de Pièce *',
    issueType: 'Type de Problème *',
    details: 'Détails *',
    quantityOrdered: 'Quantité Commandée',
    quantityReceived: 'Quantité Reçue',
    attachFiles: 'Joindre des Fichiers',
    submitButton: 'Soumettre la Réclamation',
    submitting: 'Envoi en cours...',
    selectIssueType: 'Sélectionner le type de problème',
    wrongQuantity: 'Mauvaise Quantité',
    wrongPart: 'Mauvaise Pièce',
    damaged: 'Endommagé',
    other: 'Autre',
    tooltipCompany: 'Sélectionner la société cliente qui a passé la commande',
    tooltipPart: 'Choisir le numéro de pièce spécifique lié à cette réclamation',
    tooltipIssueType: 'Catégoriser le type de problème rencontré',
    tooltipQuantityOrdered: 'Entrer la quantité originale qui a été commandée',
    tooltipQuantityReceived: 'Entrer la quantité réellement reçue',
    tooltipDetails: 'Fournir une description détaillée du problème, incluant tout contexte pertinent',
    tooltipFileUpload: 'Joindre des documents, photos ou preuves à l\'appui (PDF, JPG, PNG, max 10 Mo chacun)',
    recentComplaints: 'Réclamations Récentes',
    noComplaints: 'Aucune réclamation trouvée',
    id: 'ID',
    ordered: 'Commandé',
    received: 'Reçu',
    hasAttachments: 'A des pièces jointes',
    attachFilesButton: 'Joindre des Fichiers',
    hide: 'Masquer',
    requiredField: 'Ce champ est obligatoire',
    minCharacters: 'Les détails doivent comporter au moins 10 caractères',
    selectCompany: 'Veuillez sélectionner une société cliente',
    selectPart: 'Veuillez sélectionner une pièce'
  }
};