# Variable: PRIVACY_FILTER_OPENAI

> `const` **PRIVACY_FILTER_OPENAI**: `object`

Defined in: [constants/modelUrls.ts:1244](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts#L1244)

openai/privacy-filter — base PII detector with 8 entity types
(account_number, private_address, private_date, private_email,
private_person, private_phone, private_url, secret).

## Type Declaration

### labelNames

> `readonly` **labelNames**: readonly \[`"O"`, `"B-account_number"`, `"I-account_number"`, `"E-account_number"`, `"S-account_number"`, `"B-private_address"`, `"I-private_address"`, `"E-private_address"`, `"S-private_address"`, `"B-private_date"`, `"I-private_date"`, `"E-private_date"`, `"S-private_date"`, `"B-private_email"`, `"I-private_email"`, `"E-private_email"`, `"S-private_email"`, `"B-private_person"`, `"I-private_person"`, `"E-private_person"`, `"S-private_person"`, `"B-private_phone"`, `"I-private_phone"`, `"E-private_phone"`, `"S-private_phone"`, `"B-private_url"`, `"I-private_url"`, `"E-private_url"`, `"S-private_url"`, `"B-secret"`, `"I-secret"`, `"E-secret"`, `"S-secret"`\] = `PRIVACY_FILTER_OPENAI_LABELS`

### modelName

> `readonly` **modelName**: `"privacy-filter-openai"` = `'privacy-filter-openai'`

### modelSource

> `readonly` **modelSource**: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-openai/resolve/v0.9.0/xnnpack/privacy_filter_openai_xnnpack_8da4w.pte"`

### tokenizerSource

> `readonly` **tokenizerSource**: `"https://huggingface.co/software-mansion/react-native-executorch-privacy-filter-openai/resolve/v0.9.0/tokenizer.json"`
