export type SectionKey =
  | 'patient'
  | 'medical'
  | 'contact'
  | 'address'
  | 'financial'
  | 'identifiers'
  | 'technical'
  | 'other';

export interface SectionMeta {
  key: SectionKey;
  title: string;
  // Soft pastel fill / border / accent dot, in screenshot style.
  fill: string;
  border: string;
  dot: string;
  label: string;
  value: string;
  chipBg: string;
  chipText: string;
}

export const SECTIONS: Record<SectionKey, SectionMeta> = {
  patient: {
    key: 'patient',
    title: 'PATIENT',
    fill: '#FBE6DC',
    border: '#F4CDB8',
    dot: '#D9663B',
    label: '#B5532F',
    value: '#7A2E12',
    chipBg: '#F4CDB8',
    chipText: '#7A2E12',
  },
  medical: {
    key: 'medical',
    title: 'MEDICAL',
    fill: '#DDEDE3',
    border: '#B7D9C5',
    dot: '#3F8B5E',
    label: '#3B7A52',
    value: '#1F4A30',
    chipBg: '#B7D9C5',
    chipText: '#1F4A30',
  },
  contact: {
    key: 'contact',
    title: 'CONTACT',
    fill: '#E0E4F5',
    border: '#BDC4E8',
    dot: '#4860B5',
    label: '#3F58A8',
    value: '#1E2E6E',
    chipBg: '#BDC4E8',
    chipText: '#1E2E6E',
  },
  address: {
    key: 'address',
    title: 'ADDRESS',
    fill: '#E7E1F0',
    border: '#CDC1DE',
    dot: '#7058A6',
    label: '#5E4691',
    value: '#36245F',
    chipBg: '#CDC1DE',
    chipText: '#36245F',
  },
  financial: {
    key: 'financial',
    title: 'FINANCIAL',
    fill: '#F5EAD0',
    border: '#E5D29B',
    dot: '#A1832A',
    label: '#8A6E1F',
    value: '#5A4710',
    chipBg: '#E5D29B',
    chipText: '#5A4710',
  },
  identifiers: {
    key: 'identifiers',
    title: 'IDENTIFIERS',
    fill: '#E6E6E6',
    border: '#CCCCCC',
    dot: '#666666',
    label: '#555555',
    value: '#222222',
    chipBg: '#CCCCCC',
    chipText: '#222222',
  },
  technical: {
    key: 'technical',
    title: 'TECHNICAL',
    fill: '#DCE9EE',
    border: '#B6D2DC',
    dot: '#3E7A8C',
    label: '#356A7B',
    value: '#173542',
    chipBg: '#B6D2DC',
    chipText: '#173542',
  },
  other: {
    key: 'other',
    title: 'OTHER',
    fill: '#F0EEEA',
    border: '#D8D4CD',
    dot: '#7A736A',
    label: '#6A6359',
    value: '#332F2A',
    chipBg: '#D8D4CD',
    chipText: '#332F2A',
  },
};

// Display order in the card view.
export const SECTION_ORDER: SectionKey[] = [
  'patient',
  'medical',
  'contact',
  'address',
  'financial',
  'identifiers',
  'technical',
  'other',
];

// Friendly header for each entity-type label (the small uppercase label on
// a card). Falls back to upper-snake of the label if missing.
const DISPLAY_NAMES: Record<string, string> = {
  // OpenAI base model (private_* prefix)
  private_person: 'Name',
  private_email: 'Email',
  private_phone: 'Phone',
  private_address: 'Address',
  private_date: 'Date',
  private_url: 'URL',
  account_number: 'Account Number',
  secret: 'Secret',
  // Nemotron — patient demographics
  first_name: 'First Name',
  last_name: 'Last Name',
  user_name: 'Username',
  date_of_birth: 'Date of Birth',
  age: 'Age',
  gender: 'Gender',
  race_ethnicity: 'Race',
  religious_belief: 'Belief',
  sexuality: 'Sexuality',
  political_view: 'Political View',
  language: 'Language',
  education_level: 'Education',
  occupation: 'Occupation',
  employment_status: 'Employment',
  company_name: 'Company',
  // medical
  blood_type: 'Blood Type',
  medical_record_number: 'MRN',
  health_plan_beneficiary_number: 'Health Plan ID',
  biometric_identifier: 'Biometric ID',
  // contact
  email: 'Email',
  phone_number: 'Phone',
  fax_number: 'Fax',
  // address
  street_address: 'Street',
  city: 'City',
  county: 'County',
  state: 'State',
  postcode: 'Postcode',
  country: 'Country',
  coordinate: 'Coordinate',
  // financial
  credit_debit_card: 'Card',
  cvv: 'CVV',
  pin: 'PIN',
  bank_routing_number: 'Routing',
  swift_bic: 'SWIFT/BIC',
  tax_id: 'Tax ID',
  // identifiers
  ssn: 'SSN',
  national_id: 'National ID',
  certificate_license_number: 'License',
  license_plate: 'License Plate',
  vehicle_identifier: 'Vehicle ID',
  customer_id: 'Customer ID',
  employee_id: 'Employee ID',
  unique_id: 'ID',
  // technical
  api_key: 'API Key',
  password: 'Password',
  http_cookie: 'Cookie',
  ipv4: 'IPv4',
  ipv6: 'IPv6',
  mac_address: 'MAC',
  device_identifier: 'Device ID',
  url: 'URL',
  // dates
  date: 'Date',
  time: 'Time',
  date_time: 'Date/Time',
};

const SECTION_OF: Record<string, SectionKey> = {
  // OpenAI base
  private_person: 'patient',
  private_email: 'contact',
  private_phone: 'contact',
  private_address: 'address',
  private_date: 'patient',
  private_url: 'technical',
  account_number: 'financial',
  secret: 'technical',
  // Nemotron — patient
  first_name: 'patient',
  last_name: 'patient',
  user_name: 'patient',
  date_of_birth: 'patient',
  age: 'patient',
  gender: 'patient',
  race_ethnicity: 'patient',
  religious_belief: 'patient',
  sexuality: 'patient',
  political_view: 'patient',
  language: 'patient',
  education_level: 'patient',
  occupation: 'patient',
  employment_status: 'patient',
  company_name: 'patient',
  // medical
  blood_type: 'medical',
  medical_record_number: 'medical',
  health_plan_beneficiary_number: 'medical',
  biometric_identifier: 'medical',
  // contact
  email: 'contact',
  phone_number: 'contact',
  fax_number: 'contact',
  // address
  street_address: 'address',
  city: 'address',
  county: 'address',
  state: 'address',
  postcode: 'address',
  country: 'address',
  coordinate: 'address',
  // financial
  credit_debit_card: 'financial',
  cvv: 'financial',
  pin: 'financial',
  bank_routing_number: 'financial',
  swift_bic: 'financial',
  tax_id: 'financial',
  // identifiers
  ssn: 'identifiers',
  national_id: 'identifiers',
  certificate_license_number: 'identifiers',
  license_plate: 'identifiers',
  vehicle_identifier: 'identifiers',
  customer_id: 'identifiers',
  employee_id: 'identifiers',
  unique_id: 'identifiers',
  // technical
  api_key: 'technical',
  password: 'technical',
  http_cookie: 'technical',
  ipv4: 'technical',
  ipv6: 'technical',
  mac_address: 'technical',
  device_identifier: 'technical',
  url: 'technical',
  // dates / time → other unless context says otherwise
  date: 'other',
  time: 'other',
  date_time: 'other',
};

export function sectionForLabel(label: string): SectionKey {
  return SECTION_OF[label] ?? 'other';
}

export function displayNameForLabel(label: string): string {
  if (DISPLAY_NAMES[label]) return DISPLAY_NAMES[label] as string;
  return label
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
