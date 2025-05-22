/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */

const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure, here we override that so we can nest stuff.
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Fundamentals',
      collapsed: false,
      items: [
        'fundamentals/getting-started',
        'fundamentals/loading-models',
        'faq/frequently-asked-questions',
      ],
    },
    {
      type: 'category',
      label: 'Hooks',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Natural Language Processing',
          link: {
            type: 'generated-index',
          },
          items: [
            'natural-language-processing/useLLM',
            'natural-language-processing/useSpeechToText',
            'natural-language-processing/useTextEmbeddings',
            'natural-language-processing/useTokenizer',
          ],
        },
        {
          type: 'category',
          label: 'Computer Vision',
          link: {
            type: 'generated-index',
          },
          items: [
            'computer-vision/useOCR',
            'computer-vision/useVerticalOCR',
            'computer-vision/useImageSegmentation',
            'computer-vision/useClassification',
            'computer-vision/useObjectDetection',
            'computer-vision/useStyleTransfer',
          ],
        },
        {
          type: 'category',
          label: 'ExecuTorch bindings',
          link: {
            type: 'generated-index',
          },
          items: ['executorch-bindings/useExecutorchModule'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Typescript API',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Natural Language Processing',
          link: {
            type: 'generated-index',
          },
          items: [
            'typescript-api/LLMModule',
            'typescript-api/SpeechToTextModule',
            'typescript-api/TextEmbeddingsModule',
            'typescript-api/TokenizerModule',
          ],
        },
        {
          type: 'category',
          label: 'Computer Vision',
          link: {
            type: 'generated-index',
          },
          items: [
            'typescript-api/OCRModule',
            'typescript-api/VerticalOCRModule',
            'typescript-api/ImageSegmentationModule',
            'typescript-api/ClassificationModule',
            'typescript-api/ObjectDetectionModule',
            'typescript-api/StyleTransferModule',
          ],
        },
        {
          type: 'category',
          label: 'ExecuTorch bindings',
          link: {
            type: 'generated-index',
          },
          items: ['typescript-api/ExecutorchModule'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Benchmarks',
      collapsed: false,
      items: [
        'benchmarks/inference-time',
        'benchmarks/memory-usage',
        'benchmarks/model-size',
      ],
    },
    {
      type: 'category',
      label: 'Utilities',
      collapsed: false,
      items: ['utilities/resource-fetcher'],
    },
  ],
};

module.exports = sidebars;
