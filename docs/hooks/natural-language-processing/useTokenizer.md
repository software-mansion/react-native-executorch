# useTokenizer

Tokenization is the process of breaking down text into smaller units called tokens. It’s a crucial step in natural language processing that converts text into a format that machine learning models can understand.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

We are using [Hugging Face Tokenizers](https://huggingface.co/docs/tokenizers/index) under the hood, ensuring compatibility with the Hugging Face ecosystem.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `useTokenizer` see: [`useTokenizer` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTokenizer).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { useTokenizer, ALL_MINILM_L6_V2 } from 'react-native-executorch';

const tokenizer = useTokenizer({ tokenizer: ALL_MINILM_L6_V2 });

const text = 'Hello, world!';

try {
  // Tokenize the text
  const tokens = await tokenizer.encode(text);
  console.log('Tokens:', tokens);

  // Decode the tokens back to text
  const decodedText = await tokenizer.decode(tokens);
  console.log('Decoded text:', decodedText);
} catch (error) {
  console.error('Error tokenizing text:', error);
}

```

### Arguments[​](#arguments "Direct link to Arguments")

`useTokenizer` takes [`TokenizerProps`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TokenizerProps) that consists of:

* `tokenizer` of type [`KokoroConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/KokoroConfig) containing [`tokenizerSource`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TokenizerProps#tokenizersource).
* An optional flag [`preventLoad`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TokenizerProps#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

* For detailed information about `useTokenizer` arguments check this section: [`useTokenizer` arguments](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTokenizer#parameters).
* For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

`useTokenizer` returns an object called `TokenizerType` containing bunch of functions to interact with Tokenizers. To get more details please read: [`TokenizerType` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/TokenizerType).

## Example[​](#example "Direct link to Example")

```typescript
import { useTokenizer, ALL_MINILM_L6_V2 } from 'react-native-executorch';

function App() {
  const tokenizer = useTokenizer({ tokenizer: ALL_MINILM_L6_V2 });

  // ...

  try {
    const text = 'Hello, world!';

    const vocabSize = await tokenizer.getVocabSize();
    console.log('Vocabulary size:', vocabSize);

    const tokens = await tokenizer.encode(text);
    console.log('Token IDs:', tokens);

    const decoded = await tokenizer.decode(tokens);
    console.log('Decoded text:', decoded);

    const tokenId = await tokenizer.tokenToId('hello');
    console.log('Token ID for "Hello":', tokenId);

    const token = await tokenizer.idToToken(tokenId);
    console.log('Token for ID:', token);
  } catch (error) {
    console.error(error);
  }

  // ...
}

```
