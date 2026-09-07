# Variable: PRIVACY_FILTER_NEMOTRON

> `const` **PRIVACY_FILTER_NEMOTRON**: `object`

Defined in: [constants/modelUrls.ts:1257](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts#L1257)

OpenMed/privacy-filter-nemotron — extended PII detector with 55 entity
types (adds medical, financial, identity, technical, demographic, etc.).
Same base architecture as the OpenAI model, larger label space.

## Type Declaration

### labelNames

> `readonly` **labelNames**: readonly \[`"O"`, `"B-account_number"`, `"I-account_number"`, `"E-account_number"`, `"S-account_number"`, `"B-age"`, `"I-age"`, `"E-age"`, `"S-age"`, `"B-api_key"`, `"I-api_key"`, `"E-api_key"`, `"S-api_key"`, `"B-bank_routing_number"`, `"I-bank_routing_number"`, `"E-bank_routing_number"`, `"S-bank_routing_number"`, `"B-biometric_identifier"`, `"I-biometric_identifier"`, `"E-biometric_identifier"`, `"S-biometric_identifier"`, `"B-blood_type"`, `"I-blood_type"`, `"E-blood_type"`, `"S-blood_type"`, `"B-certificate_license_number"`, `"I-certificate_license_number"`, `"E-certificate_license_number"`, `"S-certificate_license_number"`, `"B-city"`, `"I-city"`, `"E-city"`, `"S-city"`, `"B-company_name"`, `"I-company_name"`, `"E-company_name"`, `"S-company_name"`, `"B-coordinate"`, `"I-coordinate"`, `"E-coordinate"`, `"S-coordinate"`, `"B-country"`, `"I-country"`, `"E-country"`, `"S-country"`, `"B-county"`, `"I-county"`, `"E-county"`, `"S-county"`, `"B-credit_debit_card"`, `"I-credit_debit_card"`, `"E-credit_debit_card"`, `"S-credit_debit_card"`, `"B-customer_id"`, `"I-customer_id"`, `"E-customer_id"`, `"S-customer_id"`, `"B-cvv"`, `"I-cvv"`, `"E-cvv"`, `"S-cvv"`, `"B-date"`, `"I-date"`, `"E-date"`, `"S-date"`, `"B-date_of_birth"`, `"I-date_of_birth"`, `"E-date_of_birth"`, `"S-date_of_birth"`, `"B-date_time"`, `"I-date_time"`, `"E-date_time"`, `"S-date_time"`, `"B-device_identifier"`, `"I-device_identifier"`, `"E-device_identifier"`, `"S-device_identifier"`, `"B-education_level"`, `"I-education_level"`, `"E-education_level"`, `"S-education_level"`, `"B-email"`, `"I-email"`, `"E-email"`, `"S-email"`, `"B-employee_id"`, `"I-employee_id"`, `"E-employee_id"`, `"S-employee_id"`, `"B-employment_status"`, `"I-employment_status"`, `"E-employment_status"`, `"S-employment_status"`, `"B-fax_number"`, `"I-fax_number"`, `"E-fax_number"`, `"S-fax_number"`, `"B-first_name"`, `"I-first_name"`, `"E-first_name"`, `"S-first_name"`, `"B-gender"`, `"I-gender"`, `"E-gender"`, `"S-gender"`, `"B-health_plan_beneficiary_number"`, `"I-health_plan_beneficiary_number"`, `"E-health_plan_beneficiary_number"`, `"S-health_plan_beneficiary_number"`, `"B-http_cookie"`, `"I-http_cookie"`, `"E-http_cookie"`, `"S-http_cookie"`, `"B-ipv4"`, `"I-ipv4"`, `"E-ipv4"`, `"S-ipv4"`, `"B-ipv6"`, `"I-ipv6"`, `"E-ipv6"`, `"S-ipv6"`, `"B-language"`, `"I-language"`, `"E-language"`, `"S-language"`, `"B-last_name"`, `"I-last_name"`, `"E-last_name"`, `"S-last_name"`, `"B-license_plate"`, `"I-license_plate"`, `"E-license_plate"`, `"S-license_plate"`, `"B-mac_address"`, `"I-mac_address"`, `"E-mac_address"`, `"S-mac_address"`, `"B-medical_record_number"`, `"I-medical_record_number"`, `"E-medical_record_number"`, `"S-medical_record_number"`, `"B-national_id"`, `"I-national_id"`, `"E-national_id"`, `"S-national_id"`, `"B-occupation"`, `"I-occupation"`, `"E-occupation"`, `"S-occupation"`, `"B-password"`, `"I-password"`, `"E-password"`, `"S-password"`, `"B-phone_number"`, `"I-phone_number"`, `"E-phone_number"`, `"S-phone_number"`, `"B-pin"`, `"I-pin"`, `"E-pin"`, `"S-pin"`, `"B-political_view"`, `"I-political_view"`, `"E-political_view"`, `"S-political_view"`, `"B-postcode"`, `"I-postcode"`, `"E-postcode"`, `"S-postcode"`, `"B-race_ethnicity"`, `"I-race_ethnicity"`, `"E-race_ethnicity"`, `"S-race_ethnicity"`, `"B-religious_belief"`, `"I-religious_belief"`, `"E-religious_belief"`, `"S-religious_belief"`, `"B-sexuality"`, `"I-sexuality"`, `"E-sexuality"`, `"S-sexuality"`, `"B-ssn"`, `"I-ssn"`, `"E-ssn"`, `"S-ssn"`, `"B-state"`, `"I-state"`, `"E-state"`, `"S-state"`, `"B-street_address"`, `"I-street_address"`, `"E-street_address"`, `"S-street_address"`, `"B-swift_bic"`, `"I-swift_bic"`, `"E-swift_bic"`, `"S-swift_bic"`, `"B-tax_id"`, `"I-tax_id"`, `"E-tax_id"`, `"S-tax_id"`, `"B-time"`, `"I-time"`, `"E-time"`, `"S-time"`, `"B-unique_id"`, `"I-unique_id"`, `"E-unique_id"`, `"S-unique_id"`, `"B-url"`, `"I-url"`, `"E-url"`, `"S-url"`, `"B-user_name"`, `"I-user_name"`, `"E-user_name"`, `"S-user_name"`, `"B-vehicle_identifier"`, `"I-vehicle_identifier"`, `"E-vehicle_identifier"`, `"S-vehicle_identifier"`\] = `PRIVACY_FILTER_NEMOTRON_LABELS`

### modelName

> `readonly` **modelName**: `"privacy-filter-nemotron"` = `'privacy-filter-nemotron'`

### modelSource

> `readonly` **modelSource**: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-nemotron/resolve/v0.9.0/xnnpack/privacy_filter_nemotron_xnnpack_8da4w.pte"`

### tokenizerSource

> `readonly` **tokenizerSource**: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-nemotron/resolve/v0.9.0/tokenizer.json"`
