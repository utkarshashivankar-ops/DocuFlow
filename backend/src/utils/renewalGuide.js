// Renewal guidance per document type: checklist, steps and (where a single national portal exists) an official link.
// Links are only filled in where the issuing authority has one well-known portal; everything else stays empty and the
// user can add their own (never guessed/invented). Documents the user edits keep their own copy of this template.
const GUIDES = {
  Passport: {
    action: 'Apply for passport re-issue',
    url: 'https://www.passportindia.gov.in',
    checklist: ['Old passport (original)', 'Address proof (e.g. Aadhaar)', 'Recent passport-size photographs', 'Application fee payment receipt', 'Appointment confirmation'],
    steps: ['Register / sign in on the passport portal', 'Fill the re-issue application', 'Pay the fee and book an appointment', 'Visit the passport centre with originals', 'Track status until the new passport is dispatched'],
  },
  'Driving Licence': {
    action: 'Renew your driving licence',
    url: 'https://parivahan.gov.in',
    checklist: ['Old driving licence', 'Address proof', 'Medical certificate (Form 1A, if required)', 'Passport-size photograph', 'Fee payment receipt'],
    steps: ['Open the transport (Parivahan) portal and choose licence services', 'Enter your licence number and date of birth', 'Upload documents and pay the renewal fee', 'Book a slot if a visit to the RTO is required', 'Collect or track the renewed licence'],
  },
  Aadhaar: {
    action: 'Review / update your Aadhaar details',
    url: 'https://myaadhaar.uidai.gov.in',
    checklist: ['Aadhaar number', 'Mobile number linked to Aadhaar', 'Proof of identity / address for any update'],
    steps: ['Sign in with Aadhaar number and OTP', 'Review the details shown', 'Request an update if anything is outdated', 'Download the updated Aadhaar'],
  },
  PAN: {
    action: 'Update or reprint your PAN',
    url: 'https://www.incometax.gov.in',
    checklist: ['PAN number', 'Proof of identity', 'Proof of address / date of birth (for corrections)'],
    steps: ['Open the Income Tax e-filing portal', 'Choose the PAN service you need (reprint / correction)', 'Submit the request with supporting documents', 'Track the acknowledgement until completion'],
  },
  'Health Insurance': {
    action: 'Renew health insurance policy',
    checklist: ['Current policy number', 'Premium payment method', 'Updated medical declarations (if any)', 'Nominee / contact details'],
    steps: ['Compare the renewal quote with your current cover', 'Check waiting periods and no-claim bonus', 'Pay the premium before the due date', 'Download the new policy and upload it here as a new version'],
  },
  'Vehicle Insurance': {
    action: 'Renew vehicle insurance',
    checklist: ['Registration certificate (RC)', 'Previous policy', 'Valid pollution-under-control certificate', 'Payment method'],
    steps: ['Get renewal quotes before expiry', 'Declare any claims in the last year', 'Pay the premium', 'Upload the new policy as a new version'],
  },
  'Life Insurance': {
    action: 'Pay life insurance premium / renew',
    checklist: ['Policy number', 'Premium due date', 'Payment method', 'Nominee details'],
    steps: ['Check the premium due date and grace period', 'Pay the premium', 'Keep the receipt and upload it here'],
  },
  'Insurance Policy': {
    action: 'Renew insurance policy',
    checklist: ['Policy number', 'Premium payment method', 'Latest policy document'],
    steps: ['Contact your insurer or open its portal', 'Review the renewal quote', 'Pay the premium', 'Upload the renewed policy as a new version'],
  },
  Degree: { action: 'Request a duplicate / verification', checklist: ['Identity proof', 'Application form', 'Fee receipt'], steps: ['Contact the university examination section', 'Submit the request with documents', 'Collect the document'] },
  Marksheet: { action: 'Request a duplicate marksheet', checklist: ['Identity proof', 'Application form', 'Fee receipt'], steps: ['Contact your board / university', 'Submit the request with documents', 'Collect the document'] },
  Certificate: { action: 'Renew or re-issue the certificate', checklist: ['Original certificate', 'Identity proof', 'Renewal / re-issue fee'], steps: ['Contact the issuing institute', 'Submit the renewal request', 'Upload the new certificate as a new version'] },
  'Bank Document': { action: 'Update bank documents', checklist: ['Account number', 'KYC documents', 'Passbook / statement'], steps: ['Visit your bank branch or net banking', 'Submit the update request', 'Upload the updated document'] },
  'Tax Document': { action: 'Prepare the next tax filing', checklist: ['Form 16 / income proofs', 'Investment proofs', 'Bank statements'], steps: ['Collect documents for the financial year', 'File on the Income Tax portal', 'Upload the acknowledgement here'] },
  'Financial Certificate': { action: 'Renew or roll over the investment', checklist: ['Account / folio number', 'Maturity details', 'KYC documents'], steps: ['Check maturity terms with the provider', 'Decide: renew, roll over or withdraw', 'Upload the new certificate'] },
  Agreement: { action: 'Renew the agreement', checklist: ['Existing agreement', 'Identity proofs of both parties', 'Revised terms (rent / duration)', 'Stamp paper / registration fee'], steps: ['Discuss the renewal terms with the other party', 'Draft the renewed agreement', 'Sign (and register / notarise if required)', 'Upload the signed copy as a new version'] },
  Contract: { action: 'Renew or extend the contract', checklist: ['Existing contract', 'Revised terms', 'Signatures of all parties'], steps: ['Review obligations and termination clauses', 'Agree on an extension', 'Sign the renewed contract', 'Upload the signed copy as a new version'] },
};

const GENERIC = {
  action: 'Renew this document',
  checklist: ['Original document', 'Identity proof', 'Application form / fee (if applicable)'],
  steps: ['Find the issuing authority or provider', 'Check what they need for renewal', 'Submit the renewal', 'Upload the renewed document as a new version here'],
};

function guideFor(documentType) {
  return GUIDES[documentType] || GENERIC;
}

/** Fresh renewal template (checklist items start un-ticked). */
function renewalTemplate(documentType) {
  const g = guideFor(documentType);
  return {
    checklist: g.checklist.map((label) => ({ label, done: false })),
    steps: [...g.steps],
    officialUrl: g.url || '',
    action: g.action,
  };
}

const recommendedAction = (documentType) => guideFor(documentType).action;

module.exports = { guideFor, renewalTemplate, recommendedAction };
