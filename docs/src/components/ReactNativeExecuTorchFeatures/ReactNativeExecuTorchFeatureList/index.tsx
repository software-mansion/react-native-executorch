import React from 'react';
import styles from './styles.module.css';
import ReactNativeExecuTorchFeatureItem from '@site/src/components/ReactNativeExecuTorchFeatures/ReactNativeExecuTorchFeatureItem';

const items = [
  {
    title: 'privacy first',
    body: "React Native ExecuTorch allows on-device execution of AI models, eliminating the need for external API calls. This means your app's data stays on the device, ensuring maximum privacy for your users.",
  },
  {
    title: 'cost effective',
    body: "The on-device computing nature of React Native ExecuTorch means you don't have to worry about cloud infrastructure. This approach reduces server costs and minimizes latency.",
  },
  {
    title: 'developer friendly',
    body: "There's no need for deep AI expertise, we handle the complexities of AI models on the native side, making it simple for developers to use these models in React Native.",
  },
];

const ReactNativeExecuTorchFeatureList = () => {
  return (
    <div className={styles.featureList}>
      {items.map((item, idx) => (
        <ReactNativeExecuTorchFeatureItem key={idx} title={item.title}>
          {item.body}
        </ReactNativeExecuTorchFeatureItem>
      ))}
    </div>
  );
};

export default ReactNativeExecuTorchFeatureList;
