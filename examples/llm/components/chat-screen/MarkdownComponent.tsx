import { Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import ColorPalette from '../../colors';

interface Props {
  text: string;
}

const MarkdownComponent = ({ text }: Props) => {
  const fontSize = Platform.OS === 'ios' ? 16 : 14;
  return (
    <Markdown
      style={{
        body: {
          color: ColorPalette.primary,
          fontFamily: 'regular',
          lineHeight: 19.6,
          fontSize: fontSize,
          alignSelf: 'flex-start',
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 0,
        },
        heading1: { fontSize: 14 },
        heading2: { fontSize: 14 },
        strong: { fontFamily: 'medium' },
      }}
    >
      {text}
    </Markdown>
  );
};

export default MarkdownComponent;
