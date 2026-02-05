# Loading Models

There are three different methods available for loading model files, depending on their size and location.

**1. Load from React Native assets folder (For Files < 512MB)**

```typescript
useExecutorchModule({
  modelSource: require('../assets/llama3_2.pte'),
});

```

**2. Load from remote URL:**

For files larger than 512MB or when you want to keep size of the app smaller, you can load the model from a remote URL (e.g. HuggingFace).

```typescript
useExecutorchModule({
  modelSource: 'https://.../llama3_2.pte',
});

```

**3. Load from local file system:**

If you prefer to delegate the process of obtaining and loading model and tokenizer files to the user, you can use the following method:

```typescript
useExecutorchModule({
  modelSource: 'file:///var/mobile/.../llama3_2.pte',
});

```

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

The downloaded files are stored in documents directory of your application.

## Predefined Models[​](#predefined-models "Direct link to Predefined Models")

Our library offers out-of-the-box support for multiple models. To make things easier, we created aliases for our model exported to `pte` format. For full list of aliases, check out: [API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---classification)

## Example[​](#example "Direct link to Example")

The following code snippet demonstrates how to load model and tokenizer files using `useLLM` hook:

```typescript
import { useLLM } from 'react-native-executorch';

const llama = useLLM({
  modelSource: 'https://.../llama3_2.pte',
  tokenizerSource: require('../assets/tokenizer.bin'),
});

```
