import * as Brightness from 'expo-brightness';
import { clamp } from 'react-native-reanimated';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { LLMTool } from 'react-native-executorch/lib/typescript/types/llm';

export interface ToolCall {
  toolName: string;
  arguments: Object;
}

export const parseToolCall: (message: string) => ToolCall[] = (
  message: string
) => {
  try {
    const unparsedToolCalls = message.match('\\[(.|\\s)*\\]');
    if (!unparsedToolCalls) {
      throw Error('Regex did not match array.');
    }
    const parsedMessage: LLMTool[] = JSON.parse(unparsedToolCalls[0]);
    const results = [];

    for (const tool of parsedMessage) {
      if ('name' in tool && typeof tool.name === 'string') {
        results.push({
          toolName: tool.name,
          arguments: { ...tool },
        });
      }
    }

    return results;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const executeToolCall: (
  call: ToolCall
) => Promise<string | undefined> = async (call) => {
  console.log('call', call);
  switch (call.toolName) {
    case 'brightness':
      console.log('Changing brightness!');
      if (
        'targetBrightness' in call.arguments &&
        typeof call.arguments.targetBrightness === 'string'
      ) {
        await Brightness.setBrightnessAsync(
          parseInt(call.arguments.targetBrightness, 10) / 100
        );
      } else if (
        'relativeChange' in call.arguments &&
        typeof call.arguments.relativeChange === 'string'
      ) {
        await Brightness.setBrightnessAsync(
          clamp(
            (await Brightness.getBrightnessAsync()) +
              parseInt(call.arguments.relativeChange, 10) / 100,
            0,
            1
          )
        );
      }
      break;
    case 'get_contacts':
      console.log('Getting your phone contacts');
      const contacts = (
        await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          name:
            'name' in call.arguments &&
            typeof call.arguments.name === 'string' &&
            call.arguments.name !== ''
              ? call.arguments.name
              : undefined,
        })
      ).data
        .map((contact) => ({
          name: contact.name,
          phoneNumber:
            contact.phoneNumbers && contact.phoneNumbers.length > 0
              ? contact.phoneNumbers[0].number
              : 'No number',
        }))
        .filter(({ phoneNumber }) => {
          return phoneNumber?.includes(
            'phoneNumberPrefix' in call.arguments &&
              typeof call.arguments.phoneNumberPrefix === 'string'
              ? call.arguments.phoneNumberPrefix
              : ''
          );
        });

      const contactsString = contacts
        .map((contact) => `${contact.name}: ${contact.phoneNumber}`)
        .join('\n');

      console.log('contact string:', contactsString);

      return contactsString;
    case 'send_sms':
      console.log('Sending an SMS for you');
      await SMS.sendSMSAsync(
        [
          'to' in call.arguments && typeof call.arguments.to === 'string'
            ? call.arguments.to
            : 'No number',
        ],
        'body' in call.arguments && typeof call.arguments.body === 'string'
          ? call.arguments.body
          : ''
      );
      break;
    default:
      console.log(`Wrong function! We don't handle it!`);
  }
};
